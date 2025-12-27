import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAIResponse = async (context: string, userMessage: string): Promise<string> => {
  if (!apiKey) return "Error: API Key not configured.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful, friendly AI assistant named "FurBot" in a social app for the furry community. 
      Keep responses concise, friendly, and helpful. 
      Context of current chat: ${context}
      
      User said: ${userMessage}
      
      Your response:`,
    });
    return response.text || "Thinking...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong with my circuits!";
  }
};

export const generateVideoDescription = async (title: string): Promise<string> => {
  if (!apiKey) return "Description unavailable.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, engaging video description for a video titled "${title}" uploaded to a furry fandom video site. Include a few relevant hashtags.`,
    });
    return response.text || "";
  } catch (error) {
    return "Could not generate description.";
  }
};