import { MedicationQuickRef } from '../types';

export const COMMON_MEDICATIONS: MedicationQuickRef[] = [
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    class: 'ACE Inhibitor',
    primaryUse: 'High blood pressure (Hypertension) & Heart Failure',
    typicalDosage: '10mg - 40mg once daily',
    keyWarnings: 'Do not take during pregnancy. Watch for dry cough or swelling of face/lips.',
    commonSideEffects: ['Dry cough', 'Dizziness', 'Headache', 'Elevated potassium levels']
  },
  {
    id: 'metformin',
    name: 'Metformin',
    brandNames: ['Glucophage', 'Fortamet'],
    class: 'Biguanide Anti-diabetic',
    primaryUse: 'Type 2 Diabetes Mellitus',
    typicalDosage: '500mg - 1000mg twice daily with meals',
    keyWarnings: 'Take with food to minimize upset stomach. Avoid excessive alcohol intake.',
    commonSideEffects: ['Nausea', 'Upset stomach / Diarrhea', 'Metallic taste', 'Vitamin B12 deficiency (long-term)']
  },
  {
    id: 'amoxicillin',
    name: 'Amoxicillin',
    brandNames: ['Amoxil'],
    class: 'Penicillin Antibiotic',
    primaryUse: 'Bacterial infections (ear, nose, throat, skin, UTI)',
    typicalDosage: '250mg - 875mg every 8-12 hours for 7-10 days',
    keyWarnings: 'Complete full course even if feeling better. Verify penicillin allergy status.',
    commonSideEffects: ['Mild diarrhea', 'Nausea', 'Rash (report severe rash to doctor)']
  },
  {
    id: 'atorvastatin',
    name: 'Atorvastatin',
    brandNames: ['Lipitor'],
    class: 'HMG-CoA Reductase Inhibitor (Statin)',
    primaryUse: 'High Cholesterol & Cardiovascular risk reduction',
    typicalDosage: '10mg - 80mg once daily (usually evening)',
    keyWarnings: 'Avoid excessive grapefruit juice. Report unexplained muscle weakness or pain.',
    commonSideEffects: ['Muscle aches / Joint pain', 'Mild elevated liver enzymes', 'Diarrhea']
  },
  {
    id: 'levothyroxine',
    name: 'Levothyroxine',
    brandNames: ['Synthroid', 'Levoxyl'],
    class: 'Thyroid Hormone Replacement',
    primaryUse: 'Hypothyroidism (Underactive thyroid)',
    typicalDosage: '25mcg - 150mcg once daily in morning',
    keyWarnings: 'Must be taken on empty stomach with full glass of water, 30-60 mins before breakfast.',
    commonSideEffects: ['Heart palpitations (if dose too high)', 'Insomnia', 'Heat sensitivity']
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole',
    brandNames: ['Prilosec'],
    class: 'Proton Pump Inhibitor (PPI)',
    primaryUse: 'Acid Reflux / GERD & Stomach Ulcers',
    typicalDosage: '20mg - 40mg once daily before a meal',
    keyWarnings: 'Intended for short-term course unless directed by physician.',
    commonSideEffects: ['Headache', 'Abdominal pain', 'Gas / Constipation']
  },
  {
    id: 'sertraline',
    name: 'Sertraline',
    brandNames: ['Zoloft'],
    class: 'SSRI Antidepressant',
    primaryUse: 'Depression, Anxiety, Panic Disorders, OCD',
    typicalDosage: '25mg - 200mg once daily',
    keyWarnings: 'Do not stop abruptly without doctor supervision. Watch for increased anxiety in initial weeks.',
    commonSideEffects: ['Nausea', 'Drowsiness or insomnia', 'Dry mouth', 'Sexual side effects']
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    brandNames: ['Advil', 'Motrin'],
    class: 'NSAID (Non-steroidal anti-inflammatory)',
    primaryUse: 'Pain relief, fever reduction, inflammation',
    typicalDosage: '200mg - 400mg every 4-6 hours as needed (Max 1200mg OTC / 3200mg RX per day)',
    keyWarnings: 'Take with food or milk to prevent stomach bleeding. Avoid long-term continuous use without advice.',
    commonSideEffects: ['Stomach upset', 'Heartburn', 'Mild fluid retention']
  }
];

export const PRESET_PROMPTS = [
  {
    icon: 'ShieldAlert',
    title: 'Interaction Check',
    prompt: 'Check for potential interactions between Ibuprofen, Acetaminophen, and Lisinopril.',
    mode: 'interaction'
  },
  {
    icon: 'Pill',
    title: 'Side Effects Analysis',
    prompt: 'What are the key side effects and warning signs of Metformin?',
    mode: 'side_effects'
  },
  {
    icon: 'Clock',
    title: 'Dosage & Administration',
    prompt: 'How should Levothyroxine be taken for optimal absorption, and what food/supplements should I avoid near the dose?',
    mode: 'dosage'
  },
  {
    icon: 'Camera',
    title: 'Pill Identification Help',
    prompt: 'I have an oval white pill marked "M367". Can you help me identify what medication this likely is?',
    mode: 'pill'
  }
];
