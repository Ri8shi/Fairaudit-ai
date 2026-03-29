import { GoogleGenAI } from "@google/genai";
import { AuditResult } from "../types";

// Initialize with a fallback or check
const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API Key is not configured. Please add it to your secrets.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateBiasReport(result: AuditResult) {
  const { metrics, protectedAttribute, targetAttribute, predictionAttribute } = result;

  const prompt = `
    You are an AI Fairness Expert. Analyze the following bias audit metrics and provide a human-readable report.
    
    Context:
    - Protected Attribute: ${protectedAttribute}
    - Target Variable: ${targetAttribute}
    - Model Prediction Variable: ${predictionAttribute}
    
    Metrics:
    - Demographic Parity (Selection Rate per group): ${JSON.stringify(metrics.demographicParity)}
    - Disparate Impact Ratio (relative to privileged group): ${JSON.stringify(metrics.disparateImpact)}
    - Equalized Odds (True Positive Rate per group): ${JSON.stringify(metrics.equalizedOdds)}
    - Sample Sizes: ${JSON.stringify(metrics.sampleSizes)}
    
    Please provide:
    1. A clear summary of where discrimination hides (in plain English).
    2. An assessment of legal risk (e.g., mention the 80% rule for Disparate Impact).
    3. Actionable fix suggestions (e.g., rebalancing data, feature re-weighting, or collecting more samples for specific groups).
    
    Format the response as a JSON object with two fields: "summary" (string) and "recommendations" (array of strings).
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Correct model for text generation
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      summary: `Analysis complete, but AI summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please review the raw metrics below.`,
      recommendations: [
        "Check if your GEMINI_API_KEY is correctly set in the Secrets panel.",
        "Ensure you have internet connectivity.",
        "Review the statistical charts below for manual audit."
      ],
    };
  }
}
