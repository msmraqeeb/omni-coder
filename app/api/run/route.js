import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { code, language } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                output: "Error: API key missing."
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using the same verified model from previous task
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
            You are a code execution engine.
            Your task is to analyze the following ${language} code and provide *only* the expected standard output (stdout).
            
            Rules:
            - Do not explain the code.
            - Do not enclose options in markdown code blocks.
            - If there is an error in the code that would prevent compilation or execution, output the error message similar to a real compiler/interpreter.
            - If the code requires user input, assume reasonable logical defaults or print a message saying "Input required not supported".
            - Be as accurate as possible with formatting (newlines, spaces).
            - Return ONLY the output text.
            
            Code:
            ${code}
        `;

        const result = await model.generateContent(prompt);
        const output = result.response.text();

        return NextResponse.json({ output: output.trim() });

    } catch (error) {
        console.error("Execution API Error:", error);
        return NextResponse.json(
            { output: `Error: ${error.message}` },
            { status: 500 }
        );
    }
}
