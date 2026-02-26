import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWorkoutPlan(goal: string, level: string, duration: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Bana evde ekipmansız yapılabilecek bir antrenman programı hazırla. 
    Hedef: ${goal}
    Seviye: ${level}
    Süre: ${duration} dakika.
    Her egzersiz için mutlaka adım adım "instructions" (nasıl yapılacağı) bilgisini ekle.
    Lütfen yanıtı JSON formatında ver.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reps: { type: Type.STRING, description: "Tekrar sayısı veya süre (örn: 12 tekrar veya 30 saniye)" },
                rest: { type: Type.STRING, description: "Dinlenme süresi" },
                instructions: { type: Type.STRING }
              },
              required: ["name", "reps", "rest", "instructions"]
            }
          }
        },
        required: ["title", "description", "exercises"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function askFitnessQuestion(question: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: question,
    config: {
      systemInstruction: "Sen profesyonel bir fitness koçusun. Soruları kısa, öz ve motive edici bir şekilde yanıtla. Sadece evde ekipmansız egzersizler üzerine odaklan."
    }
  });
  return response.text;
}
