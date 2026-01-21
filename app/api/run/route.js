import Groq from "groq-sdk";
import { NextResponse } from 'next/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        const { code, language } = await req.json();

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                output: "Error: GROQ_API_KEY is missing."
            });
        }

        const systemPrompt = `
            You are a code execution engine.
            Your task is to analyze the provided code and provide *only* the expected standard output (stdout).
            
            Rules:
            - Do not explain the code.
            - Do not enclose output in markdown code blocks.
            - If there is an error in the code, output the error message contextually.
            - If the code requires user input, assume reasonable logical defaults.
            - Return ONLY the raw output text.
        `;

        const userPrompt = `
            Language: ${language}
            Code:
            ${code}
        `;

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
            temperature: 0.1,
            max_tokens: 1024,
        });

        const output = chatCompletion.choices[0]?.message?.content || "";

        return NextResponse.json({ output: output.trim() });

    } catch (error) {
        console.error("Execution API Error:", error);
        return NextResponse.json(
            { output: `Error: ${error.message}` },
            { status: 500 }
        );
    }
}
