const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.log("No API key found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // List models is not directly available in the simple SDK the same way, 
        // but we can try to hit the endpoint manually or use a simple request.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hola");
        console.log("SUCCESS with gemini-1.5-flash");
        console.log(result.response.text());
    } catch (e) {
        console.log("FAILED with gemini-1.5-flash:", e.message);

        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
            const result2 = await model2.generateContent("Hola");
            console.log("SUCCESS with gemini-1.0-pro");
        } catch (e2) {
            console.log("FAILED with gemini-1.0-pro:", e2.message);
        }
    }
}

listModels();
