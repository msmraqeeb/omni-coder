import Groq from "groq-sdk";
import { NextResponse } from 'next/server';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        const payload = await req.json();
        // Support both existing frontend ({prompt, language}) and user's requested format ({problem, code})
        const promptInput = payload.prompt || payload.problem || "";
        const codeInput = payload.code || ""; // User's requested format includes code separately
        const language = payload.language || 'auto';

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({
                type: 'logic',
                explanation: '**Error**: GROQ_API_KEY is missing in .env.local',
                code: '',
                language: 'text'
            });
        }

        const systemPrompt = `
      You are Omni Coder, an expert full-stack developer and algorithm specialist.
      Analyze the user's request. Decide if it is a "Web Development" task (HTML/CSS/JS needed) or a "Logic/Algorithm" task (Python, C++, Java, etc.).
      
      Return ONLY raw JSON. Do not use Markdown formatting in the response (no \`\`\`json).

      For Web Development (creating UIs, widgets, websites):
      {
        "type": "web",
        "html": "...",
        "css": "...",
        "js": "..."
      }
      - HTML should be body content mainly, or full structure if needed.
      - CSS should be styling.
      - JS should be interactivity.

      For Logic/Algorithm (sorting, data structures, scripts):
      {
        "type": "logic",
        "explanation": "Markdown explanation...",
        "code": "The code solution...",
        "language": "python" | "cpp" | "javascript" | "java" etc.,
        "complexity": "Time: O(...) | Space: O(...)"
      }
      - Explanation should be clear, concise markdown.
      - Code should be complete and runnable.
    `;

        let fullPrompt = `User Prompt: ${promptInput}`;

        if (codeInput) {
            fullPrompt += `\n\nCode Context:\n${codeInput}`;
        }

        if (language && language !== 'auto') {
            fullPrompt += `\n\nTarget Language: ${language}`;
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: fullPrompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Lower temperature for more consistent JSON
            max_tokens: 2048,
            response_format: { type: "json_object" } // Force JSON mode if supported strictly, otherwise prompt does it
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "";

        // Cleanup potential markdown fences if model disobeys (though json_object format helps)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Attempt parsing
        let data;
        try {
            data = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw:", responseText);
            // Fallback if JSON is broken but contains meaningful text
            data = {
                type: 'logic',
                explanation: responseText,
                code: '',
                language: 'text'
            };
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json(
            {
                type: 'logic',
                explanation: `**Groq API Error**: ${error.message}\n\nPlease check your API key and connection.`,
                code: '',
                language: 'text'
            },
            { status: 200 }
        );
    }
}
