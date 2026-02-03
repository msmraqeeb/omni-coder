import Groq from "groq-sdk";
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { code, language, stdin } = await req.json();

        // LOGGING FOR DEBUGGING
        console.log("--- RUN REQUEST ---");
        console.log("Language:", language);
        console.log("Input Array:", stdin);

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                output: "Error: GROQ_API_KEY is missing."
            });
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        // Use a clear QUEUE representation
        const queueStr = Array.isArray(stdin) ? JSON.stringify(stdin) : "[]";

        const systemPrompt = "ROLE: You are candidate for a Turing Test. You are a PRECISE CODE EXECUTOR.\\n" +
            "\\n" +
            "INPUT QUEUE: " + queueStr + "\\n" +
            "\\n" +
            "STRICT PROTOCOL:\\n" +
            "1. **REPLAY PHASE**: Start from `main()`. Execute code line-by-line.\\n" +
            "2. **PRINTING**: Output all `printf`/`cout` text exactly as it appears.\\n" +
            "3. **INPUT PHASE (`scanf`, `cin`, etc.)**:\\n" +
            "   a. **CHECK QUEUE**: Look at the `INPUT QUEUE`.\\n" +
            "   b. **CONSUME**: Take the NEXT available item from the queue.\\n" +
            "   c. **ECHO**: Print the item followed by a newline `\\n`.\\n" +
            "   d. **REMOVE**: Verify you have used that specific item. Do not use it again.\\n" +
            "   e. **CONTINUE**: Move to the next line of code.\\n" +
            "4. **BLOCKING PHASE (CRITICAL)**:\\n" +
            "   - If the code demands Input, but the `INPUT QUEUE` has NO MORE ITEMS:\\n" +
            "     1. PRINT the prompt for that input (e.g. 'Enter value: ').\\n" +
            "     2. PRINT exactly: `<WAITING_FOR_INPUT>`\\n" +
            "     3. **STOP**. Cease all execution. Return immediately.\\n" +
            "\\n" +
            "ANTI-HALLUCINATION RULES:\\n" +
            "- **NO REUSE**: You generally consume 1 item per input command. Never reuse '10' just because you used it before.\\n" +
            "- **NO AUTO-FILL**: If the queue ends, you MUST STOP. Do not infer the 4th input from the 3rd.\\n" +
            "- **NO SILENT FAILURE**: If you stop, you MUST output `<WAITING_FOR_INPUT>`.\\n" +
            "\\n" +
            "OUTPUT FORMAT (JSON):\\n" +
            "{ \"stdout\": \"...output...\", \"status\": \"WAITING\" | \"COMPLETED\" }";

        let userPrompt = `
        CODE:
        ${language}
        ${code}

        Execute.
        `;

        // Force JSON mode
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const rawContent = chatCompletion.choices[0]?.message?.content || "{}";
        console.log("LLM Response:", rawContent); // LOG RESPONSE

        let parsed;
        try {
            parsed = JSON.parse(rawContent);
        } catch (e) {
            parsed = { stdout: rawContent, status: "COMPLETED" };
        }

        let finalOutput = parsed.stdout || "";
        const status = parsed.status ? parsed.status.toUpperCase() : "COMPLETED";

        if (status === "WAITING") {
            finalOutput += "<WAITING_FOR_INPUT>";
        }

        return NextResponse.json({ output: finalOutput });

    } catch (error) {
        console.error("Execution API Error:", error);
        return NextResponse.json(
            { output: `Error: ${error.message} ` },
            { status: 500 }
        );
    }
}
