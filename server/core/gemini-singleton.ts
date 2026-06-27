import { GoogleGenAI } from "@google/genai";

let geminiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
    if (!geminiInstance) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("❌ خطأ حرج: متغير البيئة GEMINI_API_KEY مفقود في ملف الـ .env");
        }
        geminiInstance = new GoogleGenAI({ apiKey });
    }
    return geminiInstance;
}
