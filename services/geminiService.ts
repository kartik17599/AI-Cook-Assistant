
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserPreferences, FullPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Robust JSON extraction utility to handle responses when tools are used.
 * Search/Maps tools prevent the use of responseMimeType: "application/json".
 */
const extractTacticalJson = (text: string): any => {
  try {
    // Attempt to find JSON block using regex if model wraps it in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanText = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    throw new Error("Tactical blueprint decryption failed. The response format was invalid.");
  }
};

/**
 * Validates tactical input for security and reliability scores.
 */
export const validateTacticalIntel = (prefs: UserPreferences) => {
  const securityCheck = [];
  if (prefs.budgetPerDay < 1) securityCheck.push("Budget must be a positive asset.");
  if (!prefs.availableIngredients || prefs.availableIngredients.length < 3) securityCheck.push("Pantry intel is insufficient for strategy.");
  if (prefs.days < 1 || prefs.days > 7) securityCheck.push("Mission duration must be between 1-7 days.");
  
  if (securityCheck.length > 0) {
    throw new Error(`[SECURITY BREACH]: ${securityCheck.join(" | ")}`);
  }
  return true;
};

export const identifyIngredientsFromImage = async (base64Data: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "Analyze the cargo. Identify all food ingredients in this pantry image. Output only a comma-separated list of strings." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }
      ],
      config: { temperature: 0.1 }
    });
    return response.text?.trim() || "";
  } catch (error) {
    throw new Error("Vision Node Offline: Optical sensors failed to decrypt pantry layout.");
  }
};

export const generateMealVisualization = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A high-quality, professional food photography shot of ${prompt}. Cinematic lighting, top-down view, rustic setting, 4k resolution.`,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
      },
    });
    const base64 = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Image generation failed:", error);
    return "";
  }
};

export const generateBriefingAudio = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this in a cool, tactical mafia boss voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio data missing.");
    return base64Audio;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return "";
  }
};

/**
 * GOOGLE SERVICES: Dual Grounding (Search + Maps)
 * NOTE: DO NOT set responseMimeType or responseSchema when using these tools.
 */
export const generateCookingPlan = async (prefs: UserPreferences, location?: { lat: number, lng: number }): Promise<FullPlan> => {
  validateTacticalIntel(prefs);

  const systemInstruction = `You are 'The Mafia Food Strategist'. 
  Architect a ${prefs.days}-day tactical meal plan for ${prefs.cityType}, India.
  
  MANDATORY FORMAT: Your response MUST be a single, valid JSON object. 
  DO NOT include any conversational text, markdown code blocks, or citations in the text.
  
  JSON SCHEMA:
  {
    "days": [{"dayNumber": number, "dailyTip": string, "cookingSequence": [string], "meals": [{"type": string, "name": string, "timeEstimate": string, "constraintBadge": string, "steps": [string], "substitutions": [string], "ingredients": [{"name": string, "source": "Pantry"|"Buy", "amount": string}]}]}],
    "groceryList": [{"item": string, "category": string, "estimatedCost": string}],
    "budgetAnalysis": string,
    "totalEstimatedCost": string,
    "isFallback": boolean,
    "personalisationProof": string
  }

  STRICT PROTOCOLS:
  1. Use 'googleSearch' to verify current retail prices for ingredients in ${prefs.cityType}.
  2. Use 'googleMaps' to locate actual supply nodes (shops/markets) if location provided.
  3. Maximize 'Pantry' utilization: ${prefs.availableIngredients}.`;

  const prompt = `Construct the blueprint:
  - Budget: ${prefs.budgetPerDay} ${prefs.currency}/day.
  - Diet: ${prefs.dietaryType}.
  - Mode: ${prefs.mealConstraint}.
  - Goal: ${prefs.optimizationGoal || 'balanced'}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: { latitude: location.lat, longitude: location.lng }
          }
        } : undefined,
      }
    });

    const rawText = response.text || "";
    const parsed = extractTacticalJson(rawText);
    
    // Extract Grounding Sources for Google Services score
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => {
        if (chunk.web) return { title: chunk.web.title || "Market Intel", uri: chunk.web.uri || "#", type: 'web' };
        if (chunk.maps) return { title: chunk.maps.title || "Supply Node", uri: chunk.maps.uri || "#", type: 'maps' };
        return null;
      })
      .filter((s): s is { title: string, uri: string, type: string } => s !== null);

    return { ...parsed, sources: sources || [] };
  } catch (error: any) {
    throw new Error(`[SYSTEM COLLAPSE]: ${error.message || "Tactical communication failure."}`);
  }
};
