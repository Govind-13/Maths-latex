import { GoogleGenerativeAI } from "@google/generative-ai";

// The API key is injected at runtime in the AI Studio environment.
// For local development, it can be set in a .env file.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export async function getAiFix(latexCode: string, diagnostics: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a LaTeX expert. I have the following LaTeX code which has some issues or could be improved:

      CODE:
      ${latexCode}

      DIAGNOSTICS/ERRORS:
      ${diagnostics}

      Please provide a fixed version of the code.
      Only return the corrected LaTeX code itself, without any markdown formatting or explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}

export async function getAiExplanation(latexCode: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a LaTeX expert. Explain the following LaTeX snippet and suggest any improvements:

      ${latexCode}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
}
