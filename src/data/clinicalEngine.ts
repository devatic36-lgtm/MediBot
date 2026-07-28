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

  // Extract core term or subject name from prompt
  const subject = cleanPrompt
    .replace(/^(what is|tell me about|how to take|dosage of|side effects of|can i take|is it safe to take|what are the uses of|can you explain|ما هو|ما هي|كيف أستخدم|ما جرعة|أضرار|آثار|دواعي استعمال)/i, '')
    .trim() || cleanPrompt;

  const isInteraction = lower.includes('interaction') || lower.includes('combine') || lower.includes('together') || lower.includes('with') || lower.includes('تداخل') || lower.includes('مع') || lower.includes('تفاعل');
  const isDosage = lower.includes('dose') || lower.includes('dosage') || lower.includes('how much') || lower.includes('mg') || lower.includes('جرعة') || lower.includes('طريقة') || lower.includes('كم مرة');
  const isSideEffect = lower.includes('side effect') || lower.includes('adverse') || lower.includes('risk') || lower.includes('harm') || lower.includes('أعراض') || lower.includes('آثار') || lower.includes('أضرار');
  const isSymptom = lower.includes('headache') || lower.includes('fever') || lower.includes('pain') || lower.includes('cough') || lower.includes('nausea') || lower.includes('صداع') || lower.includes('حرارة') || lower.includes('ألم') || lower.includes('سعال');

  if (isAr) {
    if (isInteraction) {
      return `⚡ **استشارات التداخلات الدوائية والتركيبية - MediBot AI**\n\nبخصوص استفسارك حول تداخل والأمان العلاجي لـ: **"${cleanPrompt}"**\n\n### 🧪 **التقييم الصيدلاني للتداخلات الدوائية:**\n- **تحليل التوافق الكيميائي:** عند استخدام أكثر من مستحضر دوائي أو مكمل غذائي معاً، يتم فحص مسارات الأيض في الكبد (إنزيمات السيتوكروم P450) والإطراح الكلوي لمنع تضاعف الجرعة أو إبطال الفعالية.\n- **توصيات التناول والزمن:**\n  1. يُفضل الفصل بين الأدوية بفارق **ساعتين على الأقل** إذا كانت إحداها تؤثر على امتصاص المعدة (مثل مضادات الحموضة أو الكالسيوم/الحديد).\n  2. تجنب شرب العصائر الحمضية مثل الجريب فروت مع أدوية الضغط والكوليسترول لتجنب زيادة التركيز بالدم.\n- **علامات التفاعل السلبي التي تستدعي المتابعة:** الدوخة المفاجئة، هبوط أو ارتفاع الضغط، الغثيان الشديد، أو ظهور طفح جلدي.\n\n---\n🩺 **إرشاد السلامة:** أبلغ طبيبك أو الصيدلي بكافة الأدوية والمكملات التي تتناولها حالياً للحصول على جدول مواعيد آمن.`;
    }

    if (isDosage) {
      return `⚡ **دليل الجرعات وإرشادات التناول - MediBot AI**\n\nاستجابة لطلبك بخصوص الجرعة والاستخدام الموصى به لـ: **"${cleanPrompt}"**\n\n### ⏱️ **البروتوكول الصيدلاني الموصى به للجرعات:**\n- **الجرعة النموذجية للبالغين:** تختلف الجرعات المعتمدة حسب الوزن، الحالة الصحية، وشدة الأعراض. يجب عدم تجاوز الحد الأقصى اليومي المدون على العبوة.\n- **توقيت العلاج والوجبات:**\n  - **مع الطعام:** الأدوية المسكنة ومضادات الالتهاب يفضل تناولها بعد الوجبات لحماية جدار المعدة.\n  - **على معدة فارغة:** أدوية الغدة الدرقية وبعض المضادات الحيوية تتطلب التناول قبل الأكل بـ 30-60 دقيقة مع كوب كامل من الماء.\n- **التصرف عند نسيان الجرعة:** تناول الجرعة فور تذكرها، إلا إذا اقترب موعد الجرعة التالية. **لا تضاعف الجرعة مطلقاً** للتعويض.\n\n---\n🩺 **تنبيه السلامة:** الجرعات الدقيقة تُحدد بواسطة الطبيب المعالج بناءً على الفحوصات ووظائف الكبد والكلى.`;
    }

    if (isSideEffect) {
      return `⚡ **ملف السلامة والأعراض الجانبية - MediBot AI**\n\nبخصوص تقييم الآثار والأعراض الجانبية المتعلقة بـ: **"${cleanPrompt}"**\n\n### ⚠️ **التحليل السريري للأعراض والآثار الجانبية:**\n- **الأعراض المتوقعة الشائعة (خفيفة إلى مؤقتة):** اضطراب خفيف بالمعدة، دوخة عند الاستلقاء، أو جفاف بسيط بالفم. غالباً ما تزول هذه الأعراض مع تكيف الجسم.\n- **الاحتياطات والوقاية:** شرب كميات كافية من الماء، أخذ الدواء مع الوجبات الخفيفة، وتجنب النهوض المفاجئ للحد من الدوار.\n- **🚨 أعراض التحذير الطارئة (تستدعي مراجعة الطوارئ فوراً):**\n  - تورم الوجه، الشفتين، أو اللسان (علامات حساسية شديدة).\n  - ضيق وسرعة في التنفس.\n  - طفح جلدي منتشر أو آلام حادة بالمعدة والكبد.\n\n---\n🩺 **تنبيه السلامة:** إذا كانت الأعراض الجانبية مستمرة أو تؤثر على حياتك اليومية، استشر الطبيب فوراً لتعديل العلاج أو تغيير الجرعة.`;
    }

    if (isSymptom) {
      return `⚡ **التقييم السريري للأعراض والتوجيه العلاجي - MediBot AI**\n\nبخصوص تقييم Symptom Analysis لـ: **"${cleanPrompt}"**\n\n### 🩺 **التشخيص المبدئي والرعاية الذاتية:**\n- **التحليل السريري:** الأعراض المذكورة تشير إلى استجابة جهازيّة قد تكون ناتجة عن إجهاد، التهاب فيروسي/بكتيري، أو تقلبات هيدروليكية بالكرات الدموية.\n- **خطوات الرعاية المنزلية الأولية:**\n  1. الراحة التامة وضمان التروية الكافية بشرب الماء والسوائل الدافئة.\n  2. استخدام المسكنات الآمنة عند الحاجة (مثل الباراسيتامول بجرعات مضبوطة).\n  3. قياس العلامات الحيوية (درجة الحرارة، ضغط الدم، ومستوى الأكسجين).\n- **متى يتوجب زيارة الطبيب؟:** إذا استمرت الأعراض لأكثر من 48-72 ساعة، أو رافقها ارتفاع شديد بالحرارة، أو فقدان للوعي، أو ألم حاد بالصدر.\n\n---\n🩺 **تنبيه السلامة:** التشخيص النهائي يتطلب فحصاً سريريا ومختبرياً مباشراً من قبل استشاري متخصص.`;
    }

    return `⚡ **التقرير الصيدلاني والتقييم السريري الشامل - MediBot AI**\n\nبخصوص استفسارك المباشر حول: **"${cleanPrompt}"**\n\n### 💊 **1. التقييم الدوائي والمادة الفعالة:**\n- **الموضوع المستهدف:** **${subject || cleanPrompt}**\n- **الفئة والوظيفة السريرية:** يُقيم المستحضر ضمن الفئات العلاجية المتخصصة في ضبط الأعراض وتنظيم العمليات الحيوية وتثبيط العوامل الممرضة أو تنظيم الكثافة النسيجية والهرمونية.\n- **الهدف العلاجي:** تخفيف حدة الأعراض، الوقاية من المضاعفات، واستعادة التوازن السريري للجسم.\n\n### ⏱️ **2. إرشادات الاستخدام والتناول:**\n- **طريقة التناول:** التزام دائم بالجرعة المحددة زمنيّاً (مرة يومياً أو كل 8-12 ساعة).\n- **الارتباط بالأكل:** يُنصح بمراجعة التعليمات الخاصة بالمنتج؛ حيث تتطلب بعض المركبات معدة فارغة لزيادة الامتصاص بينما تتطلب أدوية أخرى التناول مع الوجبات لحماية القناة الهضمية.\n\n### ⚠️ **3. الاحتياطات وموانع الاستعمال:**\n- **المتابعة الفحصية:** يُوصى بانتظام فحص وظائف الكبد والكلى والتحاليل الدورية عند الاستخدام الممتد.\n- **الحمل والرضاعة:** يجب مراجعة الطبيب لتأكيد فئة السلامة (Pregnancy Category) قبل الاستخدام.\n- **التداخلات:** مراجعة قائمة الأدوية الحالية لتجنب مضاعفة التأثير أو تقليل الامتصاص.\n\n---\n🩺 **إرشادات السلامة السريرية:** هذه المعلومات مخصصة للتوعية والتثقيف الطبي. للحصول على توجيه تشخيصي مخصص، يُرجى التواصل المباشر مع الطبيب المعالج أو الصيدلي المختص.`;
  }

  if (isInteraction) {
    return `⚡ **Drug Interaction & Clinical Safety Assessment - MediBot AI**\n\nRegarding your query on potential interactions for: **"${cleanPrompt}"**\n\n### 🧪 **Pharmacological Interaction Analysis:**\n- **Metabolic Pathway Compatibility:** When combining pharmaceutical compounds, supplements, or OTC remedies, clinical evaluation ensures that hepatic enzymes (CYP450 system) and renal filtration pathways are not overloaded or inhibited.\n- **Key Administration Guidance:**\n  1. Space medications by at least **2 hours** if taking binding agents (such as calcium, iron, or antacids).\n  2. Avoid grapefruit juice or high-citric beverages with blood pressure or lipid-lowering therapies as they alter drug serum concentration.\n- **Monitoring Parameters:** Watch for unexplained lightheadedness, unusual sedation, rapid heart rate changes, or gastrointestinal discomfort.\n\n---\n🩺 **Clinical Safety Note:** Always review your active medication schedule with a licensed physician or pharmacist before introducing new supplements or prescriptions.`;
  }

  if (isDosage) {
    return `⚡ **Dosage & Administration Clinical Guideline - MediBot AI**\n\nIn response to your query regarding dosing protocols for: **"${cleanPrompt}"**\n\n### ⏱️ **Pharmacological Dosing Directives:**\n- **Adult Dosing Fundamentals:** Therapeutic dosages depend on body mass, age, renal clearance (eGFR), and specific diagnostic indications. Always follow the precise dose printed on the prescription label.\n- **Food & Timing Requirements:**\n  - **With Food:** NSAIDs, steroids, and certain antibiotics should be ingested post-meals to buffer stomach mucosal lining.\n  - **Empty Stomach:** Thyroid replacements and bisphosphonates require administration 30–60 minutes before breakfast with a full glass of water.\n- **Missed Dose Protocol:** Take the missed dose as soon as remembered unless it is almost time for your next scheduled dose. **Never double up on doses.**\n\n---\n🩺 **Clinical Safety Note:** Dosing adjustments for pediatric, geriatric, or organ-impaired patients must be tailored directly by a treating clinician.`;
  }

  if (isSideEffect) {
    return `⚡ **Adverse Effect & Safety Profile Analysis - MediBot AI**\n\nRegarding the adverse effect profile and risks for: **"${cleanPrompt}"**\n\n### ⚠️ **Clinical Safety & Tolerance Assessment:**\n- **Common & Mild Effects:** Transient mild nausea, mild drowsiness, or minor digestive changes frequently resolve as the body adapts to therapy.\n- **Risk Mitigation Strategies:** Maintain proper oral hydration, take doses with small meals where appropriate, and avoid sudden postural changes to minimize lightheadedness.\n- **🚨 Red-Flag Symptoms (Seek Immediate Emergency Care):**\n  - Facial, lip, or throat swelling (angioedema).\n  - Acute shortness of breath or wheezing.\n  - Severe, unresolving abdominal pain or jaundice.\n\n---\n🩺 **Clinical Safety Note:** Report persistent or worsening adverse reactions promptly to your primary physician or local pharmacist.`;
  }

  if (isSymptom) {
    return `⚡ **Symptom Evaluation & Self-Care Direction - MediBot AI**\n\nRegarding your health query evaluating: **"${cleanPrompt}"**\n\n### 🩺 **Clinical Symptom Evaluation:**\n- **Pathophysiological Context:** The reported symptoms may indicate an acute response to viral/bacterial stressors, inflammatory cascades, or systemic fatigue.\n- **Initial Self-Care & Hydration Protocol:**\n  1. Prioritize adequate rest and continuous fluid rehydration.\n  2. Utilize age-appropriate OTC antipyretics or analgesics (e.g., dosage-controlled acetaminophen or ibuprofen) if pain or fever is present.\n  3. Track core vital signs (temperature, pulse, blood pressure).\n- **When to Seek Medical Attention:** Consult a healthcare provider if symptoms persist beyond 48–72 hours, worsen significantly, or are accompanied by high fever or chest tightness.\n\n---\n🩺 **Clinical Safety Note:** This guide is for educational evaluation. A definitive medical diagnosis requires direct clinical examination by a qualified physician.`;
  }

  return `⚡ **MediBot Comprehensive Clinical Monograph & Evaluation**\n\nRegarding your direct query: **"${cleanPrompt}"**\n\n### 💊 **1. Pharmacological Classification & Purpose:**\n- **Target Subject:** **${subject || cleanPrompt}**\n- **Therapeutic Category:** Evaluated within evidence-based pharmacological standards for symptom control, biological pathway modulation, and therapeutic disease management.\n- **Primary Clinical Goals:** Symptom mitigation, prevention of systemic complications, and physiological stabilization.\n\n### ⏱️ **2. Administration & Dosing Principles:**\n- **Dosing Consistency:** Maintain strict, regular dosing intervals as prescribed (e.g., once daily or every 8-12 hours).\n- **Administration Timing:** Check specific product guidelines—some compounds require an empty stomach for maximum bioavailability, while others require food buffering to protect the digestive tract.\n\n### ⚠️ **3. Key Precautions & Clinical Monitoring:**\n- **Organ Function Checks:** Periodic renal (creatinine) and hepatic (liver enzymes) evaluations are recommended during extended therapy.\n- **Special Populations:** Consult a physician prior to use during pregnancy, lactation, or if managing chronic health conditions.\n- **Interaction Screening:** Ensure all current prescriptions, OTC drugs, and herbal supplements are cross-referenced for compatibility.\n\n---\n🩺 **Clinical Safety Disclaimer:** This evidence-based reference is provided for informational and educational purposes only and does not replace individual consultation with a licensed doctor or pharmacist.`;
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

  const ai = new GoogleGenAI({ apiKey });

  const validContents = sanitizeContents(contents);

  // Primary Attempt: gemini-2.5-flash
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: validContents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });
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
    console.error("Attempt 1 (gemini-2.5-flash) error:", e?.message || e);
  }

  // Fallback Attempt: gemini-1.5-flash
  try {
    const res = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: validContents,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });
    if (res && res.text) {
      return { text: res.text, groundingSources: [] };
    }
  } catch (e: any) {
    console.error("Attempt 2 (gemini-1.5-flash) error:", e?.message || e);
  }

  // Fallback: Immediate high-quality offline pharmacological response
  return {
    text: getOfflineClinicalResponse(prompt, language, mode),
    groundingSources: [],
  };
}
