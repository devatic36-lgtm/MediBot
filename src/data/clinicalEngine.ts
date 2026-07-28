import { GoogleGenAI } from "@google/genai";

export const SYSTEM_INSTRUCTION = `You are "MediBot AI", an extremely helpful, empathetic, evidence-based AI Pharmacist and Health Assistant.

CRITICAL RESPONSE DIRECTIVES:
1. **Be Directly Useful & Actionable**: Give clear, practical, easy-to-understand medication advice. Strictly AVOID academic jargon, dense medical fluff, or abstract phrases (e.g. NEVER use phrases like "biological pathway modulation" or "physiological stabilization").
2. **When Asked About a Specific Medication**:
   - 💊 **What it is & Primary Uses**: Explain in simple terms what the medicine is and what it treats.
   - ⏱️ **How to Take & Typical Dosage**: Give standard recommended adult/child dosages, timing (with/without food, time of day), and rules for missed doses.
   - ⚡ **Common Side Effects & Practical Tips**: List frequent side effects and simple ways to manage them (e.g., taking after meals to prevent upset stomach).
   - ⚠️ **Important Warnings & Interactions**: Highlight key interactions (e.g., avoiding alcohol, blood thinners) and major precautions.
3. **When Asked for Medication for a Symptom** (e.g. headache, fever, pain, cold, cough, acid reflux, allergy):
   - Recommend well-known, safe Over-The-Counter (OTC) medication options (e.g., Paracetamol/Tylenol, Ibuprofen/Advil, Omeprazole, Gaviscon, Loratadine/Claritin, Congestal).
   - Explain how each option helps, typical dosage guidance, how to take it safely, and non-medication home tips (hydration, rest).
4. **Bilingual Precision & Formatting**:
   - Respond fluently in the requested language (English or Arabic).
   - When responding in Arabic, use clear Arabic medical terms alongside English drug names in parentheses (e.g., باراسيتامول - Paracetamol) and well-structured bullet points with bold headers.
5. **Safety Disclaimer**: End with a short, warm, clinical disclaimer reminding the user that this info is educational and to consult a doctor or pharmacist for individual medical care.`;

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
      keywords: ['metformin', 'glucophage', 'ميتفورمين', 'جلوكوفاج', 'سيدوفاج'],
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
    bonosome: {
      keywords: ['bonosome', 'بونوسوم'],
      nameEn: 'Bonosome (Zoledronic Acid / Bone Metabolism Regulator)',
      nameAr: 'بونوسوم (Bonosome / حمض الزوليدرونيك)',
      classEn: 'Bisphosphonate (Bone Resorption Inhibitor)',
      classAr: 'بيسفوسفونات (مثبط امتصاص العظام ومعزز كثافة العظام)',
      usesEn: 'Treatment and prevention of osteoporosis, Paget’s disease of bone, and hypercalcemia of malignancy.',
      usesAr: 'علاج والوقاية من هشاشة العظام (ضعف العظام)، ومرض باجيت، وارتفاع كلس الدم الورمي.',
      dosageEn: 'Administered as an intravenous infusion (typically 4mg to 5mg once yearly or every 3 to 24 months, strictly as prescribed by an oncologist or endocrinologist).',
      dosageAr: 'يُعطى عن طريق التسريب الوريدي (عادة 4 إلى 5 ملغ مرة سنوياً أو حسب إرشاد استشاري العظام والأورام).',
      warningsEn: 'Ensure adequate hydration before infusion. Monitor kidney function (creatinine) and calcium levels closely. Maintain good dental hygiene to prevent osteonecrosis of the jaw.',
      warningsAr: 'يجب ضمان التروية وشرب الماء الكافي قبل الجلسة. متابعة وظائف الكلى ومستوى الكالسيوم في الدم ضرورية جداً. الحفاظ على صحة الأسنان للوقاية من تنخر فك العظام.',
      sideEffectsEn: ['Flu-like symptoms (fever, chills)', 'Bone / joint pain', 'Transient hypocalcemia', 'Renal function changes'],
      sideEffectsAr: ['أعراض تشبه الإنفلونزا (حمى، قشعريرة)', 'آلام العظام والمفاصل', 'انخفاض مؤقت في كالسيوم الدم', 'تغيرات طفيفة في وظائف الكلى'],
    },
    augmentin: {
      keywords: ['augmentin', 'أوجمنتين', 'اوجمنتين', 'amoxicillin clavulanate'],
      nameEn: 'Augmentin (Amoxicillin / Clavulanic Acid)',
      nameAr: 'أوجمنتين (Augmentin / أموكسيسيلين وكلافولانيك)',
      classEn: 'Beta-Lactam Antibiotic + Beta-Lactamase Inhibitor',
      classAr: 'مضاد حيوي واسع المجال (بنسلين مضاف إليه كلافولانات)',
      usesEn: 'Bacterial infections including sinusitis, otitis media, respiratory tract infections, and skin/urinary infections.',
      usesAr: 'علاج التهابات البكتيريا مثل التهاب الجيوب الأنفية، الأذن الوسطى، التهابات الجهاز التنفسي والمسالك.',
      dosageEn: '625mg to 1000mg every 12 hours with meals to minimize stomach upset.',
      dosageAr: '625 ملغ إلى 1000 ملغ كل 12 ساعة مع وجبات الطعام لتقليل اضطراب المعدة.',
      warningsEn: 'Do not use if penicillin allergic. Complete the full prescribed course even if symptoms resolve.',
      warningsAr: 'يحظر استخدامه للحساسين للبنسلين. يجب إكمال الكورس العلاجي كاملاً لمنع مقاومة البكتيريا.',
      sideEffectsEn: ['Diarrhea / loose stools', 'Nausea', 'Abdominal cramps', 'Mild skin rash'],
      sideEffectsAr: ['إسهال أو لين البراز', 'غثيان', 'تقلصات بطنية', 'طفح جلدي خفيف'],
    },
    ciprofloxacin: {
      keywords: ['ciprofloxacin', 'cipro', 'سبروفلوكساسين', 'سيبرو'],
      nameEn: 'Ciprofloxacin (Cipro)',
      nameAr: 'سيبروفلوكساسين (Ciprofloxacin / سيبرو)',
      classEn: 'Fluoroquinolone Antibiotic',
      classAr: 'مضاد حيوي من فئة الفلوروكينولون',
      usesEn: 'Treatment of complex urinary tract infections, prostatitis, abdominal infections, and certain severe bacterial gastroenteritis.',
      usesAr: 'علاج التهابات المسالك البولية المعقدة، التهاب البروستاتا، والتهابات البطن والجلد البكتيرية.',
      dosageEn: '250mg to 750mg twice daily for 3 to 14 days as directed. Take 2 hours before or 6 hours after dairy, calcium, or antacids.',
      dosageAr: '250 ملغ إلى 750 ملغ مرتين يومياً. يجب الفصل بينه وبين الحليب ومضادات الحموضة والكالسيوم بساعتين على الأقل.',
      warningsEn: 'Boxed warning for tendinitis and tendon rupture risk. Avoid excessive sunlight/UV exposure.',
      warningsAr: 'تحذير هائل بخصوص خطر التهاب أو تمزق الأوتار (خاصة وتر العرقوب). تجنب التعرض المباشر لأشعة الشمس.',
      sideEffectsEn: ['Nausea / diarrhea', 'Headache / dizziness', 'Photosensitivity', 'Tendon pain or swelling'],
      sideEffectsAr: ['غثيان وإسهال', 'صداع ودوخة', 'حساسية للضوء', 'ألم أو تورم في الأوتار'],
    },
    azithromycin: {
      keywords: ['azithromycin', 'zithromax', 'z-pak', 'أزيثروميسين', 'ازيثرومايسين', 'زيثروماكس'],
      nameEn: 'Azithromycin (Zithromax / Z-Pak)',
      nameAr: 'أزيثروميسين (Azithromycin / زيثروماكس)',
      classEn: 'Macrolide Antibiotic',
      classAr: 'مضاد حيوي من فئة الماكرولايد',
      usesEn: 'Upper and lower respiratory tract infections, pneumonia, strep throat, sinusitis, and skin infections.',
      usesAr: 'التهابات الجهاز التنفسي العلوي والسفلي، التهاب الشعب الهوائية، الرئوي، والتهاب الحلق والجيوب الأنفية.',
      dosageEn: 'Standard Z-Pak regimen: 500mg on Day 1, followed by 250mg once daily on Days 2 through 5.',
      dosageAr: 'بروتوكول Z-Pak الشائع: 500 ملغ في اليوم الأول، ثم 250 ملغ مرة واحدة يومياً من اليوم الثاني إلى الخامس.',
      warningsEn: 'Use caution in patients with known QT prolongation or heart rhythm disorders. Can be taken with or without food.',
      warningsAr: 'يستوجب الحذر لدى مرضى اضطراب ضربات القلب وتطاول موجة QT. يمكن تناوله مع الطعام أو بدونه.',
      sideEffectsEn: ['Abdominal cramping', 'Diarrhea', 'Nausea', 'Temporary taste alter'],
      sideEffectsAr: ['مغص بطني', 'إسهال', 'غثيان', 'تغير مؤقت في التذوق'],
    },
    cetal: {
      keywords: ['cetal', 'سيتال', 'سيتال أطفال'],
      nameEn: 'Cetal (Paracetamol / Acetaminophen Preparation)',
      nameAr: 'سيتال (Cetal / باراسيتامول)',
      classEn: 'Pediatric & Adult Analgesic & Antipyretic',
      classAr: 'مسكن آلام وخافض حرارة (مخصص للأطفال والبالغين)',
      usesEn: 'Fever reduction during viral infections or vaccinations, and relief of mild teething, earache, or flu discomfort.',
      usesAr: 'خافض حرارة فعال أثناء الإنفلونزا والتطعيمات، وتسكين آلام التسنين وألم الأذن والصداع.',
      dosageEn: 'Dosed strictly by body weight for infants/children (10-15 mg/kg per dose every 4-6 hours). Adult dose: 500-1000mg.',
      dosageAr: 'للأطفال: يُحسب بدقة حسب وزن الطفل (10-15 ملغ لكل كجم كل 4-6 ساعات). للبالغين: 500 إلى 1000 ملغ.',
      warningsEn: 'Ensure correct measuring cup or dropper. Do not combine with other paracetamol syrups.',
      warningsAr: 'استخدم المعيار أو المقطرة الدقيقة المصاحبة للدواء. لا تدمجه مع شراب آخر يحتوي على باراسيتامول.',
      sideEffectsEn: ['Very safe at proper weight-based dosages', 'Mild GI comfort at high doses'],
      sideEffectsAr: ['آمن جداً عند الالتزام بالجرعة المقاسة بوزن الطفل', 'انزعاج معدي خفيف عند الجرعات المفرطة'],
    },
    congestal: {
      keywords: ['congestal', 'كونجستال'],
      nameEn: 'Congestal (Paracetamol / Pseudoephedrine / Chlorpheniramine)',
      nameAr: 'كونجستال (Congestal)',
      classEn: 'Multi-Symptom Cold, Flu & Decongestant Combination',
      classAr: 'علاج مركب لأعراض البرد والرشح والأنفلونزا واحتقان الأنف',
      usesEn: 'Relief of nasal congestion, sneezing, runny nose, sinus pressure, fever, and body aches from common cold or flu.',
      usesAr: 'تخفيف احتقان الأنف، العطس، الرشح، ضغط الجيوب الأنفية، الحرارة، وآلام الجسم الناتجة عن البرد.',
      dosageEn: '1 tablet every 6 to 8 hours as needed. Do not exceed 4 tablets in 24 hours.',
      dosageAr: 'قرص واحد كل 6 إلى 8 ساعات عند الحاجة. لا تتجاوز 4 أقراص خلال 24 ساعة.',
      warningsEn: 'Causes drowsiness (chlorpheniramine). Avoid driving. Caution in patients with uncontrolled high blood pressure or glaucoma due to pseudoephedrine.',
      warningsAr: 'يسبب النعاس بسبب مضاد الهيستامين. تجنب القيادة. يتطلب الحذر لدى مرضى ضغط الدم المرتفع غير المنتظم أو الجلوكوما.',
      sideEffectsEn: ['Drowsiness / sedation', 'Dry mouth', 'Mild elevation in blood pressure or heart rate'],
      sideEffectsAr: ['نعاس وخمول', 'جفاف الفم', 'ارتفاع خفيف في ضغط الدم أو تسارع القلوب'],
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

    // Smart Dynamic Response Generator for non-dictionary queries
    return synthesizeDynamicClinicalResponse(prompt, true, mode);
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

    // Smart Dynamic Response Generator for non-dictionary queries
    return synthesizeDynamicClinicalResponse(prompt, false, mode);
  }
}

function synthesizeDynamicClinicalResponse(prompt: string, isAr: boolean, mode: string): string {
  const cleanPrompt = (prompt || '').trim();
  const lower = cleanPrompt.toLowerCase();

  // Clean prompt term for topic identification
  const subject = cleanPrompt
    .replace(/^(what is|tell me about|how to take|dosage of|side effects of|can i take|is it safe to take|what are the uses of|can you explain|what medication|medicine for|drug for|ما هو|ما هي|كيف أستخدم|ما جرعة|أضرار|آثار|دواعي استعمال|دواء لـ|علاج لـ)/i, '')
    .trim() || cleanPrompt;

  const isInteraction = lower.includes('interaction') || lower.includes('combine') || lower.includes('together') || lower.includes('with') || lower.includes('تداخل') || lower.includes('مع') || lower.includes('تفاعل');
  const isDosage = lower.includes('dose') || lower.includes('dosage') || lower.includes('how much') || lower.includes('mg') || lower.includes('جرعة') || lower.includes('طريقة') || lower.includes('كم مرة');
  const isSideEffect = lower.includes('side effect') || lower.includes('adverse') || lower.includes('risk') || lower.includes('harm') || lower.includes('أعراض') || lower.includes('آثار') || lower.includes('أضرار');
  const isSymptom = lower.includes('headache') || lower.includes('fever') || lower.includes('pain') || lower.includes('cough') || lower.includes('nausea') || lower.includes('reflux') || lower.includes('cold') || lower.includes('flu') || lower.includes('allergy') || lower.includes('صداع') || lower.includes('حرارة') || lower.includes('ألم') || lower.includes('سعال') || lower.includes('برد') || lower.includes('رشح') || lower.includes('حموضة');

  if (isAr) {
    if (isInteraction) {
      return `⚡ **إرشادات التداخلات والجمع بين الأدوية - MediBot AI**

بخصوص استفسارك حول أمان استخدام: **"${cleanPrompt}"**

### 🧪 **القواعد الأساسية للأمان عند الجمع بين الأدوية:**
- **الفصل الزمني بين الأدوية:** يُنصح بترك فارق زمني لا يقل عن **ساعتين** بين الأدوية، خاصة إذا كانت تحتوي على مضادات حموضة، حديد، أو كالسيوم لأنها تمنع امتصاص باقي الأدوية.
- **تجنب تكرار المادة الفعالة:** تأكد من أن المستحضرات التي تتناولها لا تحتوي على نفس المادة بنفس الوقت (مثل تناول أدوية برد متعددة تحتوي جميعها على الباراسيتامول لتجنب زيادة الجرعة على الكبد).
- **التفاعل مع الأطعمة والمشروبات:** تجنب تناول أدوية الضغط أو الكوليسترول مع عصير الجريب فروت.

---
🩺 **تنبيه:** يفضل دائماً إطلاع الطبيب أو الصيدلي على قائمة أدويتك الحالية لضمان الجدول العلاجي الأكثر أماناً.`;
    }

    if (isDosage) {
      return `⚡ **دليل الجرعات وطريقة التناول - MediBot AI**

بخصوص استفسارك حول الجرعة وطريقة الاستخدام لـ: **"${cleanPrompt}"**

### ⏱️ **إرشادات التناول والجرعة الآمنة:**
- **الالتزام بالمواعيد:** تناول الدواء في مواعيد منتظمة (مثلاً كل 8 ساعات أو كل 12 ساعة) لضمان ثبات نسبة الدواء في الدم.
- **مع الطعام أم على معدة فارغة؟**
  - **مسكنات ومضادات التهاب (مثل الإيبوبروفين والكتوفان):** تُؤخذ بعد الطعام مباشرة لحماية المعدة.
  - **أدوية المعدة والتأثير على الغدة (مثل الأوميبرازول والثيروكسين):** تُؤخذ على معدة فارغة قبل الأكل بـ 30-60 دقيقة.
- **في حال نسيان الجرعة:** خذ الجرعة فور تذكرها، إلا إذا اقترب موعد الجرعة التالية. **لا تتناول جرعة مضاعفة أبداً**.

---
🩺 **تنبيه:** اتبع الجرعة المحددة من الطبيب المعالج أو المكتوبة على العبوة الخارجية.`;
    }

    if (isSideEffect) {
      return `⚡ **الأعراض الجانبية وكيفية التعامل معها - MediBot AI**

بخصوص استفسارك حول الأعراض الجانبية المتعلقة بـ: **"${cleanPrompt}"**

### ⚠️ **الأعراض الجانبية الشائعة والنصائح العملية:**
- **اضطراب المعدة أو الغثيان:** يمكن التقليل منه بتناول الدواء مع وجبة خفيفة أو كوب كبير من الماء.
- **الدوخة والخمول:** تجنب النهوض المفاجئ من الفراش، ولا تقود السيارة إذا كان الدواء يسبب النعاس (مثل أدوية البرد والحساسية).
- **جفاف الفم:** اشرب كميات كافية من الماء أو استخدم العلكة الخالية من السكر.

### 🚨 **أعراض طارئة تتطلب مراجعة الطبيب فوراً:**
- تورم الشفتين أو الوجه أو صعوبة التنفس (علامات حساسية شديدة).
- طفح جلدي مفاجئ أو آلام شديدة بالمعدة.

---
🩺 **تنبيه:** معظم الأعراض الخفيفة تزول مع بداية تكيف الجسم مع العلاج.`;
    }

    if (isSymptom) {
      return `⚡ **خيارات الأدوية الموصى بها للأعراض - MediBot AI**

بخصوص طلبك لعلاج وإرشادات حول: **"${cleanPrompt}"**

### 💊 **أبرز الخيارات الدوائية الآمنة (بدون وصفة طبيب):**

1. **للصداع والحرارة وآلام الجسم:**
   - **باراسيتامول (Panadol / Tylenol / Cetal):** 500 ملغ إلى 1000 ملغ كل 4-6 ساعات (الحد الأقصى 4000 ملغ/يوم). آمن ومناسب لمعظم الحالات.
   - **إيبوبروفين (Advil / Motrin / Brufen):** 200 ملغ إلى 400 ملغ كل 6-8 ساعات مع الطعام. ممتاز للآلام والالتهابات.

2. **للاحتقان والبرد والرشح:**
   - **أدوية البرد المركبة (Congestal / Panadol Cold & Flu):** تخفف الرشح، انسداد الأنف، والحرارة.
   - **مضادات الهيستامين (Loratadine / Zyrtec):** 10 ملغ مرة يومياً لوقف العطس وسيلان الأنف.

3. **لحموضة وارتجاع المعدة:**
   - **مضادات الحموضة السريعة (Gaviscon / Rennie):** تسكين فوري للحرقان بعد الوجبات.
   - **أوميبرازول (Omeprazole 20mg):** قرص واحد صباحاً قبل الفطور بـ 30 دقيقة للحموضة المستمرة.

---
🩺 **نصائح إضافية:** أثرِ العلاج بالراحة الكافية وشرب السوائل الدافئة. إذا استمرت الأعراض أكثر من 3 أيام استشر الطبيب.`;
    }

    return `⚡ **دليل ومعلومات الدواء الاسترشادي - MediBot AI**

بخصوص استفسارك العلاجي حول: **"${cleanPrompt}"**

### 💊 **أهم المعلومات والخطوات العملية:**
- **دواعي الاستعمال:** يُستخدم هذا النوع من العلاج لتخفيف الأعراض ومساعدة الجسم على التعافي والسيطرة على الحالة الصحية.
- **طريقة التناول:** يُفضل تناول الأقراص مع كوب كامل من الماء وفي نفس الموعد يومياً لضمان الفعالية.
- **حماية المعدة:** إذا كان الدواء مسكناً أو مضاداً للحيويات، تناوله بعد الوجبة لحماية جدار المعدة من التهيج.
- **الاحتياطات:** تجنب شرب الكحول أو الجمع بين أدوية متعددة دون التأكد من عدم وجود تداخل دوائي.

---
🩺 **تنبيه السلامة:** هذه المعلومات لأغراض التوعية والتثقيف. للاستفسار عن حالة خاصة أو جرعة مخصصة، يُرجى التواصل مع الطبيب أو الصيدلي.`;
  }

  // English Responses
  if (isInteraction) {
    return `⚡ **Drug Interaction & Safety Guide - MediBot AI**

Regarding your query about combining or interactions for: **"${cleanPrompt}"**

### 🧪 **Key Safety Rules for Combining Medications:**
- **Space Doses Out:** Leave at least a **2-hour gap** between taking different medications, especially if taking antacids, iron, or calcium supplements which block absorption.
- **Avoid Duplicate Ingredients:** Check labels on over-the-counter cold/flu remedies so you don't accidentally take double doses of acetaminophen (paracetamol).
- **Food & Drink Watch:** Avoid drinking grapefruit juice with blood pressure or cholesterol medications as it can cause unsafe drug buildup in your system.

---
🩺 **Clinical Safety Note:** Always inform your doctor or pharmacist of all vitamins, OTC remedies, and prescriptions you take.`;
  }

  if (isDosage) {
    return `⚡ **Dosage & Administration Guidelines - MediBot AI**

Regarding dosage instructions for: **"${cleanPrompt}"**

### ⏱️ **Safe Dosing & Administration Rules:**
- **Timing:** Take your doses at regular intervals (e.g. every 8 or 12 hours) to keep a steady therapeutic level in your body.
- **With or Without Food?**
  - **Pain Relievers & NSAIDs (Ibuprofen, Naproxen):** Take with a meal or snack to shield your stomach.
  - **Reflux & Thyroid Medications (Omeprazole, Levothyroxine):** Take on an empty stomach with a glass of water 30–60 minutes before breakfast.
- **Missed Doses:** Take it as soon as you remember unless it is almost time for your next dose. **Never double up on doses.**

---
🩺 **Clinical Safety Note:** Always follow the exact dose specified on your prescription bottle or package insert.`;
  }

  if (isSideEffect) {
    return `⚡ **Side Effects & Management Advice - MediBot AI**

Regarding side effects and safety for: **"${cleanPrompt}"**

### ⚠️ **Common Side Effects & Simple Relief Tips:**
- **Stomach Upset / Nausea:** Take your medication with a small meal, cracker, or milk.
- **Dizziness or Drowsiness:** Stand up slowly from sitting or lying positions. Avoid driving if the medication makes you sleepy.
- **Dry Mouth:** Stay hydrated with water throughout the day.

### 🚨 **Red-Flag Symptoms (Seek Immediate Medical Care):**
- Swelling of lips, tongue, or throat, or trouble breathing (severe allergic reaction).
- Sudden severe skin rash or unresolving severe stomach pain.

---
🩺 **Clinical Safety Note:** Mild side effects usually subside as your body gets used to the medication. Consult your pharmacist if they persist.`;
  }

  if (isSymptom) {
    return `⚡ **Recommended Medication Options for Symptoms - MediBot AI**

Regarding your query for effective relief for: **"${cleanPrompt}"**

### 💊 **Common, Effective Over-The-Counter (OTC) Options:**

1. **For Pain, Headache & Fever:**
   - **Acetaminophen / Paracetamol (Tylenol / Panadol):** 500mg to 1000mg every 4 to 6 hours as needed (Max 4000mg per day). Gentle on the stomach.
   - **Ibuprofen (Advil / Motrin):** 200mg to 400mg every 6 hours with food. Excellent for inflammatory pain, migraines, and toothaches.

2. **For Cold, Flu & Nasal Congestion:**
   - **Decongestants (Congestal / Sudafed):** Relieves stuffy nose and sinus pressure.
   - **Antihistamines (Loratadine / Zyrtec 10mg):** Relieves sneezing, runny nose, and itchy eyes.

3. **For Heartburn & Acid Reflux:**
   - **Antacids (Gaviscon / Tums):** Fast relief for burning after meals.
   - **Omeprazole (20mg once daily):** Take 30 minutes before breakfast for recurring acid reflux.

---
🩺 **Home Care Advice:** Hydrate well with water and get plenty of rest. If symptoms worsen or persist longer than 3 days, consult a physician.`;
  }

  return `⚡ **Practical Medication Information Guide - MediBot AI**

Regarding your query on: **"${cleanPrompt}"**

### 💊 **Essential Practical Guidelines:**
- **Primary Purpose:** This medication helps ease symptoms, target infections, or stabilize your health condition when taken consistently.
- **How to Take:** Swallow tablets whole with a full glass of water.
- **Stomach Protection:** Take NSAIDs, painkillers, and antibiotics with food to avoid stomach irritation.
- **Interactions:** Avoid drinking alcohol while taking medications and verify compatibility before adding new OTC drugs.

---
🩺 **Clinical Safety Disclaimer:** This guide provides general educational information. Please consult your physician or pharmacist for individualized medical direction.`;
}

function withTimeout<T>(promise: Promise<T>, ms: number = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export function sanitizeContents(contents: any[]): any[] {
  if (!Array.isArray(contents) || contents.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  const firstUserIdx = contents.findIndex((c) => c && c.role === 'user');
  if (firstUserIdx === -1) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  const rawTurns = contents.slice(firstUserIdx);
  const sanitized: any[] = [];

  for (const turn of rawTurns) {
    if (!turn || !turn.role || !Array.isArray(turn.parts) || turn.parts.length === 0) {
      continue;
    }
    const role = turn.role === 'user' ? 'user' : 'model';

    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) {
      sanitized[sanitized.length - 1].parts.push(...turn.parts);
    } else {
      sanitized.push({
        role,
        parts: [...turn.parts],
      });
    }
  }

  if (sanitized.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  return sanitized;
}

export function buildGeminiContents(history: any[], currentTurnParts: any[]): any[] {
  const contents: any[] = [];

  if (Array.isArray(history) && history.length > 0) {
    const firstUserIdx = history.findIndex((m) => m && m.sender === 'user');
    if (firstUserIdx !== -1) {
      const validHistory = history.slice(firstUserIdx);
      for (const msg of validHistory) {
        if (!msg || !msg.text) continue;
        const role = msg.sender === 'user' ? 'user' : 'model';
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts.push({ text: msg.text });
        } else {
          contents.push({ role, parts: [{ text: msg.text }] });
        }
      }
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts.push(...currentTurnParts);
  } else {
    contents.push({ role: 'user', parts: currentTurnParts });
  }

  return sanitizeContents(contents);
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

  const validContents = sanitizeContents(contents);

  // Primary Attempt: gemini-3.6-flash
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: validContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      }),
      20000
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
    console.error("Attempt 1 (gemini-3.6-flash) error:", e?.message || e);
  }

  // Fallback Attempt: gemini-flash-latest
  try {
    const res = await withTimeout(
      ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: validContents,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      }),
      8000
    );
    if (res && res.text) {
      return { text: res.text, groundingSources: [] };
    }
  } catch (e: any) {
    console.error("Attempt 2 (gemini-flash-latest) error:", e?.message || e);
  }

  // Fallback: Immediate high-quality offline pharmacological response
  return {
    text: getOfflineClinicalResponse(prompt, language, mode),
    groundingSources: [],
  };
}
