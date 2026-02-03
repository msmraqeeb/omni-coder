const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

async function runInteractiveTest() {
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
    printf("Enter number 1: ");
    scanf("%d", &a);
    printf("Enter number 2: ");
    scanf("%d", &b);
    printf("Sum: %d", a + b);
    return 0;
}
        `;

        const language = "c";
        let accumulatedStdin = "";
        let steps = 0;
        let done = false;

        console.log("--- Starting Interactive Test ---");

        while (!done && steps < 5) {
            steps++;
            console.log(`\n[Step ${steps}] Invoking API with stdin: ${JSON.stringify(accumulatedStdin)}`);

            const systemPrompt = `
            You are a code execution engine.
            The "Standard Input (stdin)" provided below contains the ALL input provided by the user so far.
            Execute the code using this input.
            If the code requires input and the provided "Standard Input" is exhausted or insufficient:
                1. Output output generated so far (including the prompt).
                2. Output the special token <WAITING_FOR_INPUT> at the very end.
                3. STOP simulating.
            If the code finishes successfully, return the output.
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
            console.log(`[Output]:\n${output}`);

            if (output.includes("<WAITING_FOR_INPUT>")) {
                console.log("Status: WAITING FOR INPUT");
                // Simulate User providing input
                const nextInput = (steps === 1) ? "10" : "20";
                console.log(`User Input: "${nextInput}"`);
                accumulatedStdin += nextInput + "\n";
            } else {
                console.log("Status: COMPLETED");
                done = true;
            }
        }

    } catch (error) {
        console.error('ERROR:', error);
    }
}

runInteractiveTest();
