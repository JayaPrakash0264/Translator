
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";

const API_KEY = process.env.API_KEY;

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> => {
  if (!API_KEY) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-3-flash-preview";

  const systemInstruction = `You are a world-class professional translator.
  Translate the given text accurately while maintaining tone, nuance, and cultural context.
  If source language is 'auto', detect it.
  Return the result in JSON format only.
  Include:
  - translatedText: The main translation.
  - detectedLanguage: The ISO code or name of the source language (if auto).
  - pronunciation: Optional phonetic spelling for non-Latin scripts.
  - alternatives: Up to 2 other ways to say this (if appropriate).`;

  const prompt = `Translate this text to ${targetLang}${sourceLang !== 'auto' ? ` from ${sourceLang}` : ''}: "${text}"`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          pronunciation: { type: Type.STRING },
          alternatives: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["translatedText"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    return { translatedText: response.text };
  }
};

export const generateSpeech = async (text: string, languageName: string): Promise<Uint8Array | null> => {
  if (!API_KEY) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Choose voice based on language name if possible, otherwise default
  const voiceName = 'Kore'; // Standard clear voice

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Speak this in ${languageName} clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    return decode(base64Audio);
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// Internal decoding utility
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
