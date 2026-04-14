import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey });

export interface ExtractedReceiptData {
  merchantName: string;
  purchaseDate: string;
  totalAmount: number;
  currency: string;
  category: 'Electronics' | 'Appliances' | 'Clothing' | 'Food' | 'Health' | 'Home' | 'Other';
  returnDeadline: string | null;
  lineItems: Array<{ name: string; price: number }>;
  confidence: number;
  rawOcrText: string;
}

export interface InferredWarranty {
  warrantyMonths: number;
  warrantyEnd: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

/**
 * Extracts structured data directly from an image using Gemini 2.5 Flash
 */
export const extractReceiptDataFromImage = async (base64Image: string): Promise<ExtractedReceiptData | null> => {
  if (!apiKey) {
    console.warn('Gemini API key is missing.');
    return null;
  }

  try {
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const prompt = `
      Sen perakende fişlerini analiz eden bir AI asistanısın. 
      Verilen fiş görselini analiz et ve SADECE aşağıdaki JSON formatında yapılandırılmış veri döndür.
      Eğer bir alan bulunamazsa null döndür. Para birimi bilinmiyorsa 'USD' varsay. 
      Tarihler YYYY-MM-DD formatında olsun.
      
      ÇOK ÖNEMLİ TARİH KURALI: Fişin kesim tarihi (purchaseDate) bugünün tarihinden (${new Date().toISOString().split('T')[0]}) İLERİ BİR TARİH OLAMAZ. Eğer okuduğun tarih gelecekteyse, bu bir OCR hatasıdır, daha mantıklı bir tarih bulmaya çalış veya null döndür.
      
      Ayrıca görseldeki tüm metni (OCR) 'rawOcrText' alanına ekle.

      Döndürülecek JSON formatı:
      {
        "merchantName": "string",
        "purchaseDate": "string (YYYY-MM-DD)",
        "totalAmount": number,
        "currency": "string (3 harf ISO kodu)",
        "category": "Electronics" | "Appliances" | "Clothing" | "Food" | "Health" | "Home" | "Other",
        "returnDeadline": "string|null (YYYY-MM-DD)",
        "lineItems": [{"name": "string", "price": number}],
        "confidence": number (0-1, OCR kalitesini yansıt),
        "rawOcrText": "string (görseldeki tüm metin)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from Gemini');

    return JSON.parse(text) as ExtractedReceiptData;
  } catch (error) {
    console.error('Failed to extract receipt data:', error);
    return null;
  }
};

/**
 * Infers warranty period based on product name and category
 */
export const inferWarrantyPeriod = async (productName: string, category: string): Promise<InferredWarranty | null> => {
  if (!apiKey) return null;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `
      Sen tüketici elektroniği ve ürün garantileri konusunda uzman bir asistanısın.
      Şu ürün için standart garanti süresini tahmin et: ${productName} (kategori: ${category})
      Bilinen marka/model standartlarına göre warrantyEnd değerini hesapla.
      Bugünün tarihi: ${today}

      SADECE JSON döndür:
      {
        "warrantyMonths": number,
        "warrantyEnd": "string (YYYY-MM-DD)",
        "confidence": "high" | "medium" | "low",
        "reasoning": "string (max 1 cümle)"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error('No response from Gemini');

    return JSON.parse(text) as InferredWarranty;
  } catch (error) {
    console.error('Failed to infer warranty:', error);
    return null;
  }
};
