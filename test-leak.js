const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function testPromptLeak() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GROQ_API_KEY=(.+)/);
        if (!match) { console.error('No API Key'); return; }
        const apiKey = match[1].trim();
        const groq = new Groq({ apiKey });

        const code = `
#include <stdio.h>
int main() {
    int h, w;
    printf("Enter height: ");
    scanf("%d", &h);
    printf("Enter width: ");
    scanf("%d", &w);
    return 0;
}
        `;

        console.log("--- Testing for Prompt Leaking ---");

        const systemPrompt = `
            You are a STATEFUL CODE SIMULATOR.
            
            INPUT:
            - Code: The program source.
            - Standard Input Buffer: A string containing available user input.

            EXECUTION PROTOCOL:
            1. Simulate the code line-by-line. DO NOT PRE-CALCULATE or LOOK AHEAD.
            2. When the code prints to stdout, append to OUTPUT immediately.
            3. When the code attempts to READ from stdin (scanf, input, etc.):
               a. CHECK the Standard Input Buffer.
               b. IF BUFFER IS EMPTY or insufficient:
                  - STOP execution immediately at this exact line.
                  - DO NOT process or print any subsequent code or prompts.
                  - Append the special token "<WAITING_FOR_INPUT>" to the end of OUTPUT.
                  - RETURN OUTPUT.
               c. IF BUFFER HAS DATA:
                  - Consume the required data.
                  - APPEND the consumed data to OUTPUT (simulate terminal echo).
                  - Continue execution.
            
            CRITICAL:
            - SIMULATE ONE INSTRUCTION AT A TIME.
            - If you hit a READ/INPUT command and the buffer is empty:
              1. STOP EXACTLY THERE.
              2. DO NOT EXECUTE THE NEXT PRINTF.
              3. DO NOT OUTPUT "Enter the width..." if you are stuck at "Enter the height...".
              4. Return output + <WAITING_FOR_INPUT>.
            - DO NOT GUESS INPUT.
            - ONLY OUTPUT RAW TEXT. NO MARKDOWN.
        `;

        // Call with NO input first. Should only see "Enter height: "
        let userPrompt = `Language: c\nCode:\n${code}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            max_tokens: 1024
        });

        const output = completion.choices[0]?.message?.content || "";
        console.log("Output:\n" + output);

        if (output.includes("Enter width")) {
            console.error("FAIL: Leaked second prompt!");
        } else {
            console.log("PASS: Only first prompt shown.");
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

testPromptLeak();
