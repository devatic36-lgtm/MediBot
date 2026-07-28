import { fetchAIGeneratedResponse, SYSTEM_INSTRUCTION, buildGeminiContents } from '../src/data/clinicalEngine';

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, history = [], imageAttachment, mode = 'chat', language = 'en' } = req.body || {};

    let activeSystemInstruction = SYSTEM_INSTRUCTION;
    if (language === 'ar') {
      activeSystemInstruction += `\nCRITICAL LANGUAGE MANDATE: The user explicitly communicated in Arabic. Respond fully in fluent, patient-friendly, grammatically flawless Arabic with medical accuracy. Use clear Arabic headings and bullet points.`;
    }

    // Current turn
    const currentTurnParts: any[] = [];
    if (imageAttachment) {
      const cleanBase64 = imageAttachment.replace(/^data:image\/\w+;base64,/, '');
      currentTurnParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    let queryPrompt = prompt || '';
    if (mode === 'scanner') {
      queryPrompt = `[PILL SCANNER ANALYSIS] Inspect this image (pill/tablet/capsule or drug packaging/label). Identify possible active ingredients, brand/generic names, strength, primary indications, dosage precautions, and crucial safety warnings. User question: ${queryPrompt}`;
    }

    currentTurnParts.push({ text: queryPrompt });
    const contents = buildGeminiContents(history, currentTurnParts);

    const { text: replyText, groundingSources } = await fetchAIGeneratedResponse(
      contents,
      activeSystemInstruction,
      queryPrompt,
      language,
      mode
    );

    return res.status(200).json({
      text: replyText,
      groundingSources,
    });
  } catch (error: any) {
    console.error('Vercel /api/chat error:', error);
    return res.status(200).json({
      text: '⚠️ **MediBot Clinical Guidance:** An unexpected connection timeout occurred. Please try again.',
      groundingSources: [],
    });
  }
}
