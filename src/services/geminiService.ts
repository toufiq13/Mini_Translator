import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type Language = 'English' | 'Hindi' | 'Spanish' | 'French' | 'Persian' | 'Chinese' | 'Arabic';

export const LANGUAGES: Language[] = ['English', 'Hindi', 'Spanish', 'French', 'Persian', 'Chinese', 'Arabic'];

export async function translateText(
  text: string,
  from: Language,
  to: Language
): Promise<string> {
  try {
    const prompt = `Translate the following text from ${from} to ${to}. 
    Provide only the translated text as the output, with no additional explanations or context.
    
    Text: "${text}"`;

    const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const response = await model.generateContent(prompt);
    return response.response.text()?.trim() || "Translation failed.";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Could not translate text. Please check your connection and try again.");
  }
}

export interface TextSegment {
  text: string;
  translation: string;
  boundingBox: {
    y1: number; // 0-1000 normalized
    x1: number;
    y2: number;
    x2: number;
  };
}

export async function translateImage(
  base64Image: string,
  mimeType: string,
  from: Language,
  to: Language
): Promise<TextSegment[]> {
  try {
    const prompt = `Perform highly accurate OCR on this image. Detect ALL text segments, including very small text, text at different angles, or text in non-standard fonts.
    Translate each detected segment from ${from} to ${to}.
    
    Return a valid JSON array of objects. Each object MUST have:
    - "text": the original text found in the image.
    - "translation": the same text translated into ${to}.
    - "boundingBox": an object with "y1", "x1", "y2", "x2" (normalized coordinates from 0 to 1000 where 0,0 is top-left and 1000,1000 is bottom-right). 
      The bounding boxes MUST precisely encompass the text segments to allow for accurate overlaying.
    
    If no text is found, return an empty array [].
    Return ONLY the JSON array. Do not include any markdown formatting wrappers.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image.split(',')[1] || base64Image,
      },
    };

    const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const response = await model.generateContent({
      contents: [{ 
        role: "user",
        parts: [
          imagePart, 
          { text: prompt }
        ] 
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.response.text() || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Image translation error:", error);
    throw new Error("Could not process image. Please try again.");
  }
}
