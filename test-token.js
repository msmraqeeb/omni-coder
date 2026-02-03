const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function debugToken() {
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
    int hours; 
    printf("Enter hours: ");
    scanf("%d", &hours);
    return 0;
}
        `;

        console.log("--- Debugging Token (JSON Mode) ---");

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
                  - Return status "WAITING".
            
            CRITICAL RULES:
            - EXECUTE LINE-BY-LINE.
            - IF a READ command (scanf/input) is encountered AND buffer is empty:
              1. STOP. Do not go further.
              2. Return status "WAITING".
            - NO Lookahead.
            
            RESPONSE FORMAT:
            You must return a valid JSON object:
            {
                "stdout": "The program output so far...",
                "status": "WAITING" | "COMPLETED"
            }
        `;

        // Call with NO input first.
        let userPrompt = `Language: c\nCode:\n${code}`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        console.log("RAW JSON OUTPUT:", content);

        const parsed = JSON.parse(content);

        if (parsed.status === "WAITING") {
            console.log("PASS: Status is WAITING.");
        } else {
            console.error("FAIL: Status is " + parsed.status);
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

debugToken();
