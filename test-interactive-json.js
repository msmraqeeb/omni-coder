const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function testInteractiveFlow() {
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
    int w, n;
    printf("Enter weight: ");
    scanf("%d", &w);
    printf("Enter number: ");
    scanf("%d", &n);
    printf("Result: %d", w * n);
    return 0;
}
        `;

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
                  - STOP execution immediately.
                  - Return status "WAITING".
               c. IF BUFFER HAS DATA:
                  - Consume the required data.
                  - APPEND the consumed data AND a newline "\n" to OUTPUT.
                  - Continue execution.
            
            CRITICAL RULES:
            1. **NO HALLUCINATION**: You are a dumb terminal errors. You CANNOT predict user input.
            2. **STOP ON EMPTY BUFFER**: If code asks for input and buffer is empty, you MUST STOP. Return status "WAITING".
               - WRONG: "Enter weight: 10\\nEnter number: 5..." (You hallucinated inputs!)
               - RIGHT: "Enter weight: " (Stop and wait)
            3. **ECHO WITH NEWLINE**: When you consume input "X", print "X\\n".
               - If input buffer has "50", output "50\\n".
               - The output MUST show the input value on its own line.
            4. **NO LOOKAHEAD**: Do not execute even one single print statement after a blocking input.
            
            RESPONSE FORMAT:
            You must return a valid JSON object:
            {
                "stdout": "The program output so far...",
                "status": "WAITING" | "COMPLETED"
            }
        `;

        console.log("--- STEP 1: INITIAL RUN (No Input) ---");
        let userPrompt1 = `Language: c\nCode:\n${code}`;

        const res1 = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt1 }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const out1 = JSON.parse(res1.choices[0].message.content);
        console.log("Output 1:", out1);

        if (out1.status !== "WAITING") {
            console.error("FAIL: Should be WAITING for first input.");
            return;
        }

        console.log("\n--- STEP 2: PROVIDE FIRST INPUT '10' ---");
        // NOTE: In the actual app, we pass the accumulated stdin.
        let userPrompt2 = `Language: c\nCode:\n${code}\n\nStandard Input(stdin): \n10\n`;

        const res2 = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt2 }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const out2 = JSON.parse(res2.choices[0].message.content);
        console.log("Output 2:", out2);

        if (out2.status !== "WAITING") {
            const isFinished = out2.stdout.includes("Result");
            if (isFinished) {
                console.error("FAIL: Hallucinated second input or skipped it!");
            } else {
                console.error("FAIL: Should be WAITING for second input, but got status:", out2.status);
            }
        } else {
            console.log("PASS: Correctly waiting for second input.");
            if (out2.stdout.includes("Enter number")) {
                console.log("PASS: Prompt for second input is present.");
            } else {
                console.log("FAIL: Missing second prompt text 'Enter number'.");
            }
        }

    } catch (error) {
        console.error('ERROR Test Failed:', error);
    }
}

testInteractiveFlow();
