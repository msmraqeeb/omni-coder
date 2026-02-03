const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function runMultiStepTest() {
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
    int a, b;
    float c;
    printf("Enter first integer: ");
    scanf("%d", &a);
    printf("Enter second integer: ");
    scanf("%d", &b);
    printf("Enter float value: ");
    scanf("%f", &c);
    
    printf("\\nOutput\\n");
    printf("First integer: %d\\n", a);
    printf("Second integer: %d\\n", b);
    printf("Float value: %.1f\\n", c);
    return 0;
}
        `;

        const language = "c";
        let accumulatedStdin = "";
        let steps = 0;
        let done = false;

        console.log("--- Starting Multi-Step Test ---");

        // Inputs to feed sequentially
        const inputs = ["10", "16", "12.6"];

        while (!done && steps < 10) {
            steps++;
            console.log(`\n[Step ${steps}] Invoking API... Stdin so far: ${JSON.stringify(accumulatedStdin)}`);

            const systemPrompt = `
            You are a STATEFUL CODE SIMULATOR.
            
            INPUT:
            - Code: The program source.
            - Standard Input Buffer: A string containing available user input.

            EXECUTION PROTOCOL:
            1. Simulate the code line-by-line.
            2. When the code prints to stdout, append to OUTPUT.
            3. When the code attempts to READ from stdin (scanf, input, etc.):
               a. CHECK the Standard Input Buffer.
               b. IF BUFFER IS EMPTY or insufficient:
                  - STOP execution immediately.
                  - Appending the special token "<WAITING_FOR_INPUT>" to the end of OUTPUT.
                  - RETURN OUTPUT.
               c. IF BUFFER HAS DATA:
                  - Consume the required data.
                  - APPEND the consumed data to OUTPUT (simulate terminal echo).
                  - Continue execution.
            
            CRITICAL:
            - DO NOT GUESS INPUT. If the buffer is empty, you MUST STOP and ask for input.
            - DO NOT OUTPUT FINAL RESULTS unless all required inputs were found in the buffer.
            - Return ONLY the raw output logic.
            `;

            let userPrompt = `Language: ${language}\nCode:\n${code}`;
            if (accumulatedStdin) userPrompt += `\n\nStandard Input (stdin):\n${accumulatedStdin}`;

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

            console.log(`-- Output displayed to user --\n${output}`);

            // Verification check
            if (steps === 2 && !output.includes("10")) {
                console.warn("WARNING: Input '10' was NOT echoed in Step 2 output!");
            }

            if (output.includes("<WAITING_FOR_INPUT>")) {
                console.log("Status: WAITING FOR INPUT");
                const nextInput = inputs.shift();
                if (nextInput) {
                    console.log(`User provides input: "${nextInput}"`);
                    accumulatedStdin += nextInput + "\n";
                } else {
                    console.error("Error: App asked for input but test script has runs out of inputs!");
                    done = true;
                }
            } else {
                console.log("Status: COMPLETED");
                done = true;
            }
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

runMultiStepTest();
