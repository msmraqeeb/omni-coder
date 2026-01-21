const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('.env.local not found');
            return;
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY=(.+)/);
        if (!match) {
            console.error('GEMINI_API_KEY not found in .env.local');
            return;
        }
        const apiKey = match[1].trim();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        console.log('Testing generateContent with gemini-2.0-flash...');
        const result = await model.generateContent("Hello, just say OK.");
        const response = await result.response;
        console.log('Response:', response.text());
        console.log('SUCCESS: Model works.');

    } catch (error) {
        console.error('ERROR:', error);
    }
}

test();
