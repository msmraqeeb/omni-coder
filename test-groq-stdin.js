const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GROQ_API_KEY=(.+)/);

        if (!match) {
            console.error('GROQ_API_KEY not found in .env.local');
            return;
        }

        const apiKey = match[1].trim();
        const groq = new Groq({ apiKey });

        const code = `
#include <stdio.h>
int main() {
    int x;
    scanf("%d", &x);
    printf("You entered: %d", x);
    return 0;
}
        `;
        const stdin = "42";
        const language = "c";

        console.log("Testing Groq Stdin...");

        const systemPrompt = `
            You are a code execution engine.
            Your task is to analyze the provided code and provide *only* the expected standard output (stdout).
            - If "Standard Input (stdin)" is provided below, strictly use that data for any input operations (like scanf, cin, input()).
            - Return ONLY the raw output text.
        `;

        let userPrompt = `
            Language: ${language}
            Code:
            ${code}
        `;

        if (stdin) {
            userPrompt += `\n\nStandard Input (stdin):\n${stdin}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 1024,
        });

        const output = chatCompletion.choices[0]?.message?.content || "";
        console.log("Output:", output);

        if (output.trim().includes("You entered: 42")) {
            console.log("SUCCESS: Stdin was processed correctly.");
        } else {
            console.log("FAILURE: Output did not match expected.");
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

test();
