import { GoogleGenAI, Type } from "@google/genai";
import { ScannedData, Contact } from '../types';

const getAIClient = () => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey.length < 10) {
      throw new Error("API_KEY is missing or invalid. Check your environment variables.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
  } catch (error: any) {
    console.error("Gemini Initialization Error:", error);
    throw new Error(error.message || "API configuration issue.");
  }
};

export const extractContactInfo = async (base64Image: string): Promise<ScannedData> => {
  const ai = getAIClient();

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

export const queryContactsWithAI = async (query: string, contacts: Contact[]): Promise<string> => {
  const ai = getAIClient();

  // Filter contacts to only send relevant text data to save tokens and privacy
  const minimizedContacts = contacts.map(c => ({
    name: c.name,
    company: c.company,
    title: c.jobTitle,
    notes: c.notes,
    email: c.email,
    location: c.address
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: `You are a helpful network assistant. Here is my database of business contacts in JSON format: ${JSON.stringify(minimizedContacts)}. 
            
            User Question: "${query}"
            
            Answer the user's question based strictly on this contact list. 
            If asking for an email draft, write a short, professional draft.
            If searching for someone, provide their details.
            If the answer isn't in the list, say so politely.`
          }
        ]
      }
    });

    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini Query Error:", error);
    return "Sorry, I'm having trouble connecting to the AI assistant right now.";
  }
};