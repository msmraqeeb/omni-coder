import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { prompt, language } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn("GEMINI_API_KEY is missing. Using mock response.");
            // Minimal mock for testing without key
            return NextResponse.json({
                type: 'logic',
                explanation: '## No API Key Configured\n\nPlease add `GEMINI_API_KEY` to your `.env.local` file to use the real AI.\n\nCurrently running in **Mock Mode**.',
                code: `// .env.local\nGEMINI_API_KEY=your_api_key_here`,
                language: 'bash',
                complexity: 'N/A'
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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

        let fullPrompt = `User Prompt: ${prompt}`;
        if (language && language !== 'auto') {
            fullPrompt += `\n\nTarget Language: ${language}`;
        }

        const result = await model.generateContent([systemPrompt, fullPrompt]);
        const responseText = result.response.text();

        // Cleanup potential markdown fences if model disobeys
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJson);
        return NextResponse.json(data);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            {
                type: 'logic',
                explanation: `**Error**: ${error.message}\n\nPlease try again.`,
                code: '',
                language: 'text'
            },
            { status: 200 } // Return 200 so UI handles it gracefully as a logic response
        );
    }
}
