import { fetchAIGeneratedResponse, SYSTEM_INSTRUCTION } from '../src/data/clinicalEngine';

export default async function handler(req: any, res: any) {
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
    const { drugs = [], language = 'en' } = req.body || {};

    if (!Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: 'At least two medication names are required.' });
    }

    const isAr = language === 'ar';
    const prompt = `Perform a comprehensive multi-drug interaction analysis for the following medications: ${drugs.join(', ')}.
Analyze whether taking these medications concurrently presents any drug-drug interactions.
Organize your clinical analysis into:
1. Overall Interaction Risk Level (Mild / Moderate / Major / Contraindicated)
2. Pharmacological Mechanism of Interaction
3. Clinical Symptoms & Adverse Effects to Monitor
4. Recommended Patient & Prescriber Management Plan (e.g. dose spacing, alternative drugs, monitoring guidelines)
Language requirement: ${isAr ? 'Respond in professional Arabic.' : 'Respond in clear English.'}`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const { text: replyText, groundingSources } = await fetchAIGeneratedResponse(
      contents,
      SYSTEM_INSTRUCTION,
      drugs.join(' '),
      language,
      'interaction'
    );

    return res.status(200).json({ text: replyText, groundingSources });
  } catch (error: any) {
    console.error('Vercel /api/check-interactions error:', error);
    return res.status(200).json({
      text: '⚠️ **MediBot Interaction Analysis:** Service temporarily busy. Please try again.',
      groundingSources: [],
    });
  }
}
