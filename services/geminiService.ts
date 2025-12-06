import { GoogleGenAI, Type } from "@google/genai";
import { ScannedData } from '../types';

export const extractContactInfo = async (base64Image: string): Promise<ScannedData> => {
  // Initialize inside function to avoid app crash if env vars are missing at load time
  // and to ensure we catch initialization errors gracefully
  let ai;
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.length < 10) {
      throw new Error("API_KEY is missing or invalid. Check your environment variables.");
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
  } catch (error: any) {
    console.error("Gemini Initialization Error:", error);
    throw new Error(error.message || "API configuration issue.");
  }

  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: "Extract contact information from this business card. If a field is not found, leave it as an empty string."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            company: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
            website: { type: Type.STRING },
            address: { type: Type.STRING }
          },
          required: ["name", "company", "phone", "email"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    return JSON.parse(text) as ScannedData;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to scan card. Please try again or use manual entry.");
  }
};