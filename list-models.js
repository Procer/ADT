const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listAll() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    // There is no listModels in the simple SDK, but we can try to fetch the URL
    const fetch = require('node-fetch');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("AVAILABLE MODELS:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("FAILED TO FETCH MODELS:", err);
    }
}

listAll();
