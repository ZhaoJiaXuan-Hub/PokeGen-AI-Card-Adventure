
import { GoogleGenAI } from "@google/genai";
import { CardData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCardArt = async (card: CardData): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A pixel art sprite of a pokemon named ${card.name} (${card.id}). 
            Type: ${card.type}. 
            Description: ${card.description}.
            Style: 16-bit, retro game sprite, GBA style, pixelated, vibrant flat colors, clean outlines.
            White background.
            No text on image.`
          }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate art:", error);
    return null;
  }
};
