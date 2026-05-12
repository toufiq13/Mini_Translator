import { GoogleGenAI, Type } from "@google/genai";

export type Language = 'English' | 'Hindi' | 'Spanish' | 'French' | 'Persian' | 'Chinese' | 'Arabic';

export type TranslationMode = 'smart' | 'technical' | 'creative' | 'legal' | 'medical';

export interface AdvancedTranslationResponse {
  translatedText: string;
  confidence: number;
  detectedStyle?: 'Standard' | 'Slang' | 'Professional' | 'Educational' | 'Cultural' | 'Technical' | 'Legal' | 'Medical' | 'Mixed';
  detectedTone?: 'Neutral' | 'Friendly' | 'Formal' | 'Angry' | 'Sarcastic' | 'Humorous' | 'Urgent' | 'Academic';
  isIdiom?: boolean;
  idiomExplanation?: string;
  literalMeaning?: string;
  culturalContext?: string;
  detectedAccent?: string;
  sarcasmLevel?: number; // 0-1
  domain?: string;
  isMixedLanguage?: boolean;
  alternatives?: { text: string; note: string }[];
}

export const LANGUAGES: Language[] = ['English', 'Hindi', 'Spanish', 'French', 'Persian', 'Chinese', 'Arabic'];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const PRO_MODEL = "gemini-3.1-pro-preview";
const FLASH_MODEL = "gemini-3-flash-preview";

export async function* translateTextStream(
  text: string,
  from: Language,
  to: Language,
  mode: TranslationMode = 'smart'
): AsyncGenerator<string> {
  try {
    const systemInstruction = `You are an elite multilingual intelligence expert.
      
      TRANSLATION PHILOSOPHY:
      - PRIORITIZE SEMANTIC MEANING over literal word-for-word mapping.
      - PRESERVE TONE: If the source is sarcastic, the target must be culturally sarcastic.
      - CONTEXTUAL ADAPTATION: Handle pronouns, gender, and status honorifics (e.g., T-V distinction in French/Spanish) based on relationship context.
      - MIXED LANGUAGE: Recognize and handle code-switching (Hinglish, Arabizi, Spanglish) without losing meaning or cultural flavor.
      
      BEHAVIOR:
      - IDIOMS: Don't translate "Break a leg" literally. Use target-culture equivalents.
      - SLANG: Map youth/internet slang to regional equivalents.
      - DOMAIN: If technical, use precise terminology. If casual, use natural flow.
      
      Return ONLY the translated text as a stream. Use natural breathing patterns in the output.`;

    const response = await ai.models.generateContentStream({
      model: FLASH_MODEL,
      contents: text,
      config: { systemInstruction }
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Translation stream error:", error);
    throw new Error("Could not translate text. Please ensure your Gemini API key is set in Settings > Secrets.");
  }
}

export async function translateTextAdvanced(
  text: string,
  from: Language,
  to: Language,
  targetDomain?: TranslationMode
): Promise<AdvancedTranslationResponse> {
  try {
    const systemInstruction = `You are a world-class linguistic architect and cultural strategist. 
      Your task is to translate from ${from} to ${to}, deeply analyzing every nuance.
      
      INTELLIGENCE LAYER PROTOCOLS:
      1. MEANING EXTRACTION: Identify sarcasm, metaphors, humor, and irony.
      2. TONE DETECTION: Is this angry? Professional? Sneaky? 
      3. DOMAIN ANALYSIS: Detect if input is Legal, Medical, Technical, or Casual.
      4. CULTURAL SYNC: Adapt proverbs and idioms to the target culture.
      5. ACCENT RECOGNITION: Detect regional variations (e.g., British vs Australian English).
      6. MIXED LANGUAGE: Detect code-switching and blend naturally.
      
      OUTPUT REQUIREMENTS:
      - translatedText: The result focusing on semantic intent.
      - alternatives: 2-3 different ways to say it (e.g., more formal vs more local).
      - detectedStyle: Choose from standard list or "Mixed".
      - sarcasmLevel: Float 0-1.
      - isMixedLanguage: Boolean.
      
      Output MUST be valid JSON conforming to the requested schema.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: text,
      config: { 
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            detectedStyle: { type: Type.STRING },
            detectedTone: { type: Type.STRING },
            isIdiom: { type: Type.BOOLEAN },
            idiomExplanation: { type: Type.STRING },
            literalMeaning: { type: Type.STRING },
            culturalContext: { type: Type.STRING },
            detectedAccent: { type: Type.STRING },
            sarcasmLevel: { type: Type.NUMBER },
            domain: { type: Type.STRING },
            isMixedLanguage: { type: Type.BOOLEAN },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  note: { type: Type.STRING }
                }
              }
            }
          },
          required: ["translatedText", "confidence"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Advanced translation error:", error);
    if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
      throw new Error("You have exceeded your Gemini API quota. Please check your billing details or try again later.");
    }
    throw new Error("Advanced translation failed. Please check your API key.");
  }
}

export async function translateText(
  text: string,
  from: Language,
  to: Language
): Promise<string> {
  try {
    const advanced = await translateTextAdvanced(text, from, to);
    return advanced.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Translation service temporarily unavailable.");
  }
}

export interface TextSegment {
  text: string;
  translation: string;
  boundingBox: {
    y1: number; 
    x1: number;
    y2: number;
    x2: number;
  };
  isIdiom?: boolean;
  explanation?: string;
  domain?: string;
}

export async function translateImage(
  base64Image: string,
  mimeType: string,
  from: Language,
  to: Language,
  mode: TranslationMode = 'smart'
): Promise<TextSegment[]> {
  try {
    const prompt = `Perform ultra-high-accuracy cultural OCR and translation.
    Format: JSON array of segments.
    
    SPECIALIZED OCR PROTOCOLS:
    - HANDWRITING: Identify and decipher cursive or messy scripts.
    - STYLIZED TEXT: Correctly parse artistic/logo fonts.
    - PERSPECTIVE: Handle curved signage or angled captures.
    - CONTEXT: Use surrounding segments to disambiguate blurred characters.
    
    TRANSLATION:
    - Preserve font mood (Professional sign vs graffiti).
    - Map idioms found on signs.
    
    Output JSON array with "explanation" for cultural symbols.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Image.split(',')[1] || base64Image,
      },
    };

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              translation: { type: Type.STRING },
              boundingBox: {
                type: Type.OBJECT,
                properties: {
                  y1: { type: Type.NUMBER },
                  x1: { type: Type.NUMBER },
                  y2: { type: Type.NUMBER },
                  x2: { type: Type.NUMBER }
                }
              },
              isIdiom: { type: Type.BOOLEAN },
              explanation: { type: Type.STRING },
              domain: { type: Type.STRING }
            },
            required: ["text", "translation", "boundingBox"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    console.error("Image translation error:", error);
    throw new Error("Image processing failed.");
  }
}

