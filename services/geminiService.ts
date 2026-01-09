
import { GoogleGenAI } from "@google/genai";

/**
 * Generates a press release-style description for a new music release using Gemini AI.
 */
export const generateReleaseDescription = async (artist: string, title: string): Promise<string> => {
  // Always initialize with the named apiKey parameter from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use 'gemini-3-flash-preview' for basic text tasks like writing descriptions.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a press release-style description for a new music release. Artist: ${artist}. Title: ${title}. Keep it under 100 words. Be exciting and professional.`,
  });

  // Directly access the .text property from the GenerateContentResponse object.
  return response.text || '';
};
