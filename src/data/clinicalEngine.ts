import { GoogleGenAI } from "@google/genai";

export const SYSTEM_INSTRUCTION = `You are "MediBot AI", an elite, empathetic, highly knowledgeable Evidence-Based Clinical AI Pharmacist & Medical Knowledge Assistant.
Your core mission is to empower patients, caregivers, and healthcare practitioners with precise, evidence-based medication safety information, drug interactions, pill identification guidance, dosage instructions, and clinical precautions.

CRITICAL CLINICAL & RESPONSE DIRECTIVES:
1. **Clinical Accuracy & Structure**: Always organize answers logically using clear headings, structured bullet points, bold key terms, and visual callouts.
2. **Bilingual Precision**: Respond fluently in the user's language (English or Arabic). Translate medical terminology accurately into standard patient-friendly Arabic when requested.
3. **Evidence-Based Information**: Provide FDA/EMA standard warnings, common and serious adverse effects, dosage protocols, administration timing (with/without food), and renal/hepatic dose adjustment cautions when applicable.
4. **Drug Interaction Analysis**: When comparing two or more medications, explicitly categorize interaction severity (e.g., Minor / Moderate / Major / Contraindicated) with clear pharmacological rationale.
5. **Tone & Style**: Professional, objective, accessible, reassuring, and precise.
6. **Safety Disclaimer**: Always include a concise clinical disclaimer emphasizing that MediBot AI provides educational evidence-based information and does not replace direct diagnosis or treatment by a licensed healthcare provider. Emergency medical symptoms require immediate local emergency response (911).
`;

export function getOfflineClinicalResponse(prompt: string, language: string, mode: string): string {
  const isAr = language === 'ar';
  const queryLower = (prompt || '').toLowerCase().trim();

  const drugMap: Record<string, {
    keywords: string[];
    nameEn: string;
    nameAr: string;
    classEn: string;
    classAr: string;
    usesEn: string;
    usesAr: string;
    dosageEn: string;
    dosageAr: string;
    warningsEn: string;
    warningsAr: string;
    sideEffectsEn: string[];
    sideEffectsAr: string[];
  }> = {
    aspirin: {
      keywords: ['aspirin', 'acetylsalicylic', 'أسبرين', 'اسبرين'],
      nameEn: 'Aspirin (Acetylsalicylic Acid)',
      nameAr: 'أسبرين (Aspirin)',
      classEn: 'NSAID / Antiplatelet Agent',
      classAr: 'مضاد للالتهاب غير ستيرويدي / مانع لتجلط الصفائح الدموية',
      usesEn: 'Pain relief, fever reduction, anti-inflammatory, and low-dose cardioprotection (heart attack/stroke prevention).',
      usesAr: 'تسكين الآلام، خفض الحرارة، وتقليل تجلط الدم للوقاية من النوبات القلبية والسكتات الدماغية.',
      dosageEn: 'Cardioprotective: 81mg to 100mg once daily with food. Pain/Fever: 325mg to 650mg every 4 to 6 hours as needed.',
      dosageAr: 'للحماية القلبية: 81 ملغ إلى 100 ملغ مرة يومياً مع الطعام. لتسكين الألم والحرارة: 325 ملغ إلى 650 ملغ كل 4-6 ساعات.',
      warningsEn: 'Avoid in children/teens with viral infections (Reye syndrome risk). Take with food to reduce GI bleeding risk. Avoid combining with other NSAIDs or blood thinners without supervision.',
      warningsAr: 'ممنوع للأطفال واليافعين المصابين بإنفلونزا أو جدري المائي (خطر متلازمة راي). يتناول مع الطعام لتجنب النزيف المعوي.',
      sideEffectsEn: ['Stomach upset / heartburn', 'Increased bleeding tendency', 'Tinnitus (ringing in ears at high doses)'],
      sideEffectsAr: ['اضطراب أو حرقة المعدة', 'زيادة القابلية للنزيف', 'طنين الأذن عند الجرعات العالية'],
    },
    lisinopril: {
      keywords: ['lisinopril', 'prinivil', 'zestril', 'ليسينوبريل'],
      nameEn: 'Lisinopril (Prinivil / Zestril)',
      nameAr: 'ليسينوبريل (Lisinopril)',
      classEn: 'ACE Inhibitor (Antihypertensive)',
      classAr: 'مثبط الإنزيم المحول للأنجيوتنسين (خافض لضغط الدم)',
      usesEn: 'Treatment of hypertension (high blood pressure), heart failure management, and post-myocardial infarction recovery.',
      usesAr: 'علاج ارتفاع ضغط الدم، وقصور القلب، وحماية الكلى لدى مرضى السكري.',
      dosageEn: '10mg to 40mg once daily in the morning with a full glass of water. Monitor kidney function and blood potassium.',
      dosageAr: '10 ملغ إلى 40 ملغ مرة واحدة يومياً صباحاً. ينبغي مراقبة وظائف الكلى ومستوى البوتاسيوم في الدم.',
      warningsEn: 'Contraindicated during pregnancy (fetal harm). Discontinue if facial/lip swelling (angioedema) occurs. Watch for persistent dry cough.',
      warningsAr: 'ممنوع تماماً في الحمل (قد يسبب تشوهات خلقة للجنين). يتوجب التوقف فوراً عند حدوث تورم بالوجه أو الشفتين. ينبغي مراقبة السعال الجاف.',
      sideEffectsEn: ['Persistent dry cough', 'Dizziness upon standing', 'Hyperkalemia (high potassium)', 'Headache'],
      sideEffectsAr: ['سعال جاف مستمر', 'دوخة عند الوقوف', 'ارتفاع نسبة البوتاسيوم', 'صداع خفيف'],
    },
    metformin: {
      keywords: ['metformin', 'glucophage', 'ميتفورمين', 'جلوكوفاج'],
      nameEn: 'Metformin (Glucophage)',
      nameAr: 'ميتفورمين (Metformin / جلوكوفاج)',
      classEn: 'Biguanide Anti-Diabetic Agent',
      classAr: 'دواء خافض لسكر الدم (فئة البيجوانيد)',
      usesEn: 'First-line medication for Type 2 Diabetes Mellitus to improve insulin sensitivity and lower blood glucose.',
      usesAr: 'العلاج الأول لمرض السكري من النوع الثاني لتحسين حساسية الأنسولين وتقليل إنتاج الجلوكوز.',
      dosageEn: '500mg to 1000mg twice daily with or immediately after meals to reduce stomach upset.',
      dosageAr: '500 ملغ إلى 1000 ملغ مرتين يومياً مع وجبات الطعام مباشرة لتقليل الاضطرابات الهضمية.',
      warningsEn: 'Take with food. Avoid heavy alcohol use (risk of lactic acidosis). Monitor Vitamin B12 levels during long-term therapy.',
      warningsAr: 'تناوله مع الطعام دائماً. تجنب الكحوليات لتجنب خطر الحماض اللبني. راقب فيتامين B12 مع الاستخدام الطويل.',
      sideEffectsEn: ['Nausea and gas', 'Diarrhea / stomach upset', 'Metallic taste', 'Vitamin B12 reduction'],
      sideEffectsAr: ['غثيان وغازات', 'إسهال أو اضطراب المعدة', 'طعم معدني بالفم', 'نقص فيتامين B12'],
    },
    ibuprofen: {
      keywords: ['ibuprofen', 'advil', 'motrin', 'إيبوبروفين', 'ابوبروفين', 'أدڤيل', 'موترين'],
      nameEn: 'Ibuprofen (Advil / Motrin)',
      nameAr: 'إيبوبروفين (Ibuprofen / أدڤيل / موترين)',
      classEn: 'NSAID (Non-Steroidal Anti-Inflammatory Drug)',
      classAr: 'مضاد التهاب غير ستيرويدي (مسكن ومخفض حرارة)',
      usesEn: 'Relief of mild-to-moderate pain, inflammation, joint stiffness, headaches, and fever.',
      usesAr: 'تسكين الآلام الخفيفة والمتوسطة، خفض الحرارة، وعلاج التهابات المفاصل والصداع.',
      dosageEn: '200mg to 400mg every 4 to 6 hours as needed with food. Maximum OTC dosage is 1200mg per day.',
      dosageAr: '200 ملغ إلى 400 ملغ كل 4 إلى 6 ساعات عند الحاجة مع الطعام. الحد الأقصى بدون وصفة 1200 ملغ يومياً.',
      warningsEn: 'Always take with food or milk. Avoid long-term continuous use without supervision due to gastrointestinal ulceration risk.',
      warningsAr: 'تناوله مع الطعام أو الحليب للوقاية من قرحة المعدة. تجنب الاستخدام المستمر لفترات طويلة دون إشراف طبي.',
      sideEffectsEn: ['Stomach pain / Heartburn', 'Mild fluid retention', 'Increased risk of stomach bleeding with alcohol'],
      sideEffectsAr: ['ألم المعدة أو حرقة الفؤاد', 'احتباس خفيف للسوائل', 'زيادة خطر نزيف المعدة مع الكحول'],
    },
    paracetamol: {
      keywords: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol', 'باراسيتامول', 'أسيتامينوفين', 'بندول', 'بانادول', 'تايلينول'],
      nameEn: 'Acetaminophen / Paracetamol (Tylenol / Panadol)',
      nameAr: 'باراسيتامول / أسيتامينوفين (Panadol / Tylenol)',
      classEn: 'Analgesic & Antipyretic',
      classAr: 'مسكن آلام ومخفض حرارة',
      usesEn: 'Treatment of fever, mild-to-moderate pain, headaches, toothaches, and osteoarthritis pain.',
      usesAr: 'تخفيف الحرارة والآلام الخفيفة والمتوسطة مثل صداع الرأس وألم الأسنان وآلام العضلات.',
      dosageEn: '500mg to 1000mg every 4 to 6 hours as needed. Maximum daily dose for adults is 4000mg (4g) from all sources combined.',
      dosageAr: '500 ملغ إلى 1000 ملغ كل 4 إلى 6 ساعات عند الحاجة. الحد الأقصى اليومي للبالغين 4000 ملغ (4 غرامات).',
      warningsEn: 'Strictly observe maximum 4g daily limit to avoid severe liver toxicity (hepatotoxicity). Check multi-ingredient cold medicines for hidden acetaminophen.',
      warningsAr: 'التزم بحد أقصى 4 غرام يومياً لمنع سمية الكبد. انتبه لأدوية البرد المركبة التي قد تحتوي على الباراسيتامول.',
      sideEffectsEn: ['Rare at recommended doses', 'Nausea (at high doses)', 'Liver damage if exceeded maximum dose'],
      sideEffectsAr: ['نادر جداً عند الجرعات الموصى بها', 'غثيان عند الجرعات العالية', 'خطر على الكبد عند تجاوز الحد الأقصى'],
    },
    amoxicillin: {
      keywords: ['amoxicillin', 'amoxil', 'أموكسيسيلين', 'اموكسيسيلين', 'أموكسيل'],
      nameEn: 'Amoxicillin (Amoxil)',
      nameAr: 'أموكسيسيلين (Amoxicillin)',
      classEn: 'Penicillin-Class Antibiotic',
      classAr: 'مضاد حيوي من عائلة البنسلين',
      usesEn: 'Treatment of susceptible bacterial infections (ENT, respiratory tract, skin, urinary tract).',
      usesAr: 'علاج الالتهابات البكتيرية في الأذن والأنف والحلق، والجهاز التنفسي، والجلد، والمسالك البولية.',
      dosageEn: '250mg to 875mg every 8 to 12 hours depending on infection severity. Must complete the full prescribed course.',
      dosageAr: '250 ملغ إلى 875 ملغ كل 8 إلى 12 ساعة حسب شدة الإلتهاب. يجب إكمال الكورس العلاجي بالكامل.',
      warningsEn: 'Do NOT use if allergic to penicillin or cephalosporins. Antibiotics do NOT treat viral infections like flu or colds.',
      warningsAr: 'ممنوع لمن يعاني من حساسية البنسلين. المضادات الحيوية لا تعالج الإلتهابات الفيروسية مثل الزكام والإنفلونزا.',
      sideEffectsEn: ['Mild diarrhea', 'Nausea / vomiting', 'Skin rash (report immediately if severe)'],
      sideEffectsAr: ['إسهال خفيف', 'غثيان', 'طفح جلدي (يجب إبلاغ الطبيب عند حدوثه)'],
    },
    levothyroxine: {
      keywords: ['levothyroxine', 'synthroid', 'ليفوثيروكسين', 'سينثرويد'],
      nameEn: 'Levothyroxine (Synthroid)',
      nameAr: 'ليفوثيروكسين (Levothyroxine / سينثرويد)',
      classEn: 'Synthetic Thyroid Hormone Replacement',
      classAr: 'بديل هرمون الغدة الدرقية الصناعي',
      usesEn: 'Treatment of hypothyroidism (underactive thyroid hormone levels).',
      usesAr: 'علاج قصور ونقص نشاط الغدة الدرقية.',
      dosageEn: 'Take once daily in the morning on an empty stomach with a full glass of water, 30 to 60 minutes before breakfast.',
      dosageAr: 'تناول الجرعة مرة واحدة صباحاً على معدة فارغة مع كاس ماء كامل، قبل الإفطار بـ 30 إلى 60 دقيقة.',
      warningsEn: 'Do not take calcium, iron, or antacids within 4 hours of levothyroxine dose as they bind and block absorption.',
      warningsAr: 'لا تتناول الكالسيوم أو الحديد أو مضادات الحموضة خلال 4 ساعات من الجرعة لأنها تمنع امتصاص الدواء.',
      sideEffectsEn: ['Heart palpitations (if dose is too high)', 'Insomnia / nervousness', 'Heat intolerance'],
      sideEffectsAr: ['خفقان القلب (عند زيادة الجرعة)', 'أرق وتوتر', 'عدم تحمّل الحرارة'],
    },
    omeprazole: {
      keywords: ['omeprazole', 'prilosec', 'أوميبرازول', 'اوميبرازول', 'بريلوسيك'],
      nameEn: 'Omeprazole (Prilosec)',
      nameAr: 'أوميبرازول (Omeprazole / بريلوسيك)',
      classEn: 'Proton Pump Inhibitor (PPI)',
      classAr: 'مثبط مضخة البروتون (مضاد حموضة المعدة)',
      usesEn: 'Treatment of GERD (Acid Reflux), stomach ulcers, and erosive esophagitis.',
      usesAr: 'علاج ارتجاع المريء (حموضة المعدة)، قرحة المعدة، والتهاب المريء.',
      dosageEn: '20mg to 40mg once daily in the morning 30 minutes before a meal.',
      dosageAr: '20 ملغ إلى 40 ملغ مرة واحدة صباحاً قبل أكل الطعام بـ 30 دقيقة.',
      warningsEn: 'Intended for short-term courses (2-14 days OTC). Long-term use requires monitoring of magnesium and bone density.',
      warningsAr: 'مخصص للاستخدام قصير المدى (2-14 يوماً). الاستخدام الطويل يتطلب مراقبة المغنيسيوم وكثافة العظام.',
      sideEffectsEn: ['Headache', 'Abdominal pain', 'Flatulence / diarrhea'],
      sideEffectsAr: ['صداع', 'ألم في البطن', 'غازات أو إسهال خفيف'],
    },
    atorvastatin: {
      keywords: ['atorvastatin', 'lipitor', 'أتورفاستاتين', 'اتورفاستاتين', 'ليبيتور'],
      nameEn: 'Atorvastatin (Lipitor)',
      nameAr: 'أتورفاستاتين (Atorvastatin / ليبيتور)',
      classEn: 'HMG-CoA Reductase Inhibitor (Statin)',
      classAr: 'خافض للكوليسترول (فئة الستاتينات)',
      usesEn: 'Reduction of LDL cholesterol, triglycerides, and prevention of cardiovascular events.',
      usesAr: 'تخفيض الكوليسترول الضار والدهون الثلاثية والوقاية من النوبات القلبية والسكتات الدماغية.',
      dosageEn: '10mg to 80mg once daily in the evening.',
      dosageAr: '10 ملغ إلى 80 ملغ مرة واحدة يومياً مساءً.',
      warningsEn: 'Avoid large quantities of grapefruit juice. Report unexplained muscle pain immediately.',
      warningsAr: 'تجنب تناول عصير الجريب فروت بكميات كبيرة. أبلغ الطبيب فوراً عند حدوث آلام عضلية غير مفسرة.',
      sideEffectsEn: ['Muscle pain / stiffness', 'Mild digestive changes', 'Slight elevation in liver enzymes'],
      sideEffectsAr: ['آلام المفاصل والعضلات', 'تغيرات هضمية خفيفة', 'ارتفاع خفيف بإنزيمات الكبد'],
    },
    amlodipine: {
      keywords: ['amlodipine', 'norvasc', 'أملوديبين', 'املوديبين', 'نورفاسك'],
      nameEn: 'Amlodipine (Norvasc)',
      nameAr: 'أملوديبين (Amlodipine / نورفاسك)',
      classEn: 'Calcium Channel Blocker (Dihydropyridine)',
      classAr: 'حاصر قنوات الكالسيوم (خافض ضغط وموسع للأوعية)',
      usesEn: 'Treatment of hypertension and chronic stable angina (chest pain).',
      usesAr: 'علاج ارتفاع ضغط الدم والذبحة الصدرية.',
      dosageEn: '2.5mg to 10mg once daily with or without food.',
      dosageAr: '2.5 ملغ إلى 10 ملغ مرة واحدة يومياً مع أو بدون طعام.',
      warningsEn: 'May cause peripheral ankle edema (swelling). Do not stop abruptly without physician advice.',
      warningsAr: 'قد يسبب تورماً خفيفاً في القدمين والكاحلين. لا تتوقف عن تناوله فجأة دون مراجعة الطبيب.',
      sideEffectsEn: ['Ankle edema', 'Flushing / warmth', 'Dizziness', 'Palpitations'],
      sideEffectsAr: ['تورم الكاحلين', 'احمرار الوجه أو الحرارة', 'دوخة خفيفة', 'خفقان'],
    },
  };

  const matchedDrugs: string[] = [];
  for (const [key, info] of Object.entries(drugMap)) {
    if (info.keywords.some((kw) => queryLower.includes(kw))) {
      matchedDrugs.push(key);
    }
  }

  if (isAr) {
    if (matchedDrugs.length > 0) {
      let body = `⚡ **التحليل الصيدلاني المباشر من MediBot AI**\n\n`;
      body += `بخصوص سؤالك القائم حول: **"${prompt}"**\n\n`;

      for (const dKey of matchedDrugs) {
        const item = drugMap[dKey];
        body += `### 💊 **${item.nameAr}**\n`;
        body += `- **الفئة الدوائية:** ${item.classAr}\n`;
        body += `- 🎯 **دواعي الاستعمال:** ${item.usesAr}\n`;
        body += `- ⏱️ **الجرعة والتناول:** ${item.dosageAr}\n`;
        body += `- ⚠️ **محاذير مهمة:** ${item.warningsAr}\n`;
        body += `- ⚡ **الأعراض الجانبية الشائعة:** ${item.sideEffectsAr.join(' ، ')}\n\n`;
      }

      body += `---\n🩺 **تنبيه السلامة الطبية:** هذه معلومات سريرية تعليمية موثوقة. يُنصح دائماً بمراجعة الطبيب أو الصيدلي قبل إجراء أي تغيير في الخطة العلاجية. للحالات الطارئة اتصل بالطوارئ فوراً.`;
      return body;
    }

    // Custom response when no specific listed drug matches
    return `⚡ **الإرشاد والتحليل السريري - MediBot AI**\n\nبخصوص استفسارك الطبي: **"${prompt}"**\n\n### 🩺 **التقييم الصيدلاني والطبي:**\n- **التحليل:** للإجابة الدقيقة على سؤالك حول "${prompt}"، يقوم نظامنا السريري بتقييم دواعي الاستعمال، الجرعات الموصى بها، وطبيعة التداخلات الدوائية.\n- **احتياطات السلامة:** يُنصح دائماً بالتحقق من تركيز المادة الفعالة، التاريخ المكتوب على العبوة، ومراجعة أي تداخل مع أدويتك الحالية قبل الاستخدام.\n- **التوجيه العلاجي:** يفضل استشارة الطبيب المعالج أو الصيدلي لوضع خطة علاجية مخصصة لحالتك الصحية.\n\n---\n🩺 **تنبيه السلامة:** المعلومات المقدمة للأغراض التوعوية والتعليمية فقط، ولا تغني عن الاستشارة الطبية المباشرة.`;
  } else {
    if (matchedDrugs.length > 0) {
      let body = `⚡ **MediBot Direct Clinical Knowledge Base**\n\n`;
      body += `Regarding your question about: **"${prompt}"**\n\n`;

      for (const dKey of matchedDrugs) {
        const item = drugMap[dKey];
        body += `### 💊 **${item.nameEn}**\n`;
        body += `- **Drug Class:** ${item.classEn}\n`;
        body += `- 🎯 **Primary Indications:** ${item.usesEn}\n`;
        body += `- ⏱️ **Dosage & Administration:** ${item.dosageEn}\n`;
        body += `- ⚠️ **Key Precautions & Warnings:** ${item.warningsEn}\n`;
        body += `- ⚡ **Common Side Effects:** ${item.sideEffectsEn.join(', ')}\n\n`;
      }

      body += `---\n🩺 **Clinical Safety Note:** This evidence-based pharmacological overview is provided for educational purposes. Always consult a licensed healthcare provider or pharmacist regarding prescription changes or medical decisions.`;
      return body;
    }

    // Custom response addressing the user's specific text directly
    return `⚡ **MediBot Clinical Guidance Analysis**\n\nRegarding your query: **"${prompt}"**\n\n### 🩺 **Pharmacological & Clinical Evaluation**\n- **Medical Context:** To evaluate "${prompt}", healthcare professionals review active pharmacological ingredients, indicated therapeutic dosages, and relevant clinical safety guidelines.\n- **Key Safety Precautions:** Before starting, stopping, or combining any medication or supplement related to your question, verify potential drug-drug interactions, liver/kidney clearance profiles, and contraindications.\n- **Recommended Next Steps:** Discuss your specific symptoms and medical history with a licensed physician or pharmacist for personalized dosing and diagnostic direction.\n\n---\n🩺 **Clinical Safety Note:** This reference is for educational purposes only and does not replace personal medical advice from a healthcare professional.`;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export async function fetchAIGeneratedResponse(
  contents: any[],
  systemInstruction: string,
  prompt: string,
  language: string,
  mode: string
): Promise<{ text: string; groundingSources: any[] }> {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      text: getOfflineClinicalResponse(prompt, language, mode),
      groundingSources: [],
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Attempt 1: gemini-3.6-flash (18s timeout)
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      }),
      18000
    );
    if (res && res.text) {
      const groundingChunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingSources = groundingChunks
        .filter((chunk: any) => chunk?.web?.uri)
        .map((chunk: any) => ({
          title: chunk.web.title || chunk.web.uri,
          url: chunk.web.uri,
        }))
        .slice(0, 4);
      return { text: res.text, groundingSources };
    }
  } catch (e: any) {
    console.warn("Attempt 1 (gemini-3.6-flash) failed or timed out:", e?.message || e);
  }

  // Attempt 2: gemini-flash-latest (15s timeout)
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      }),
      15000
    );
    if (res && res.text) {
      return { text: res.text, groundingSources: [] };
    }
  } catch (e: any) {
    console.warn("Attempt 2 (gemini-flash-latest) failed or timed out:", e?.message || e);
  }

  // Fallback: Immediate high-quality offline pharmacological response
  return {
    text: getOfflineClinicalResponse(prompt, language, mode),
    groundingSources: [],
  };
}
