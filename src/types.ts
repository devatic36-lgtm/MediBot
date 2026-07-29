export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  imageAttachment?: string; // base64 or URL
  groundingSources?: GroundingSource[];
  mode?: 'chat' | 'interaction' | 'pill' | 'dosage' | 'side_effects';
  rating?: 'helpful' | 'unhelpful';
  isStreaming?: boolean;
}

export interface MedicationQuickRef {
  id: string;
  name: string;
  nameAr?: string;
  brandNames: string[];
  class: string;
  classAr?: string;
  categoryKey: string;
  primaryUse: string;
  primaryUseAr?: string;
  typicalDosage: string;
  typicalDosageAr?: string;
  keyWarnings: string;
  keyWarningsAr?: string;
  commonSideEffects: string[];
  commonSideEffectsAr?: string[];
  form?: string;
  formAr?: string;
  type?: 'Rx' | 'OTC';
  pillColor?: string;
}

export interface SavedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribingReason?: string;
  notes?: string;
  dateAdded: string;
}

export interface InteractionCheckInput {
  drugs: string[];
}

export interface PillVisionInput {
  imageBase64: string;
  additionalNotes?: string;
}
