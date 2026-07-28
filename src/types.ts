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
  brandNames: string[];
  class: string;
  primaryUse: string;
  typicalDosage: string;
  keyWarnings: string;
  commonSideEffects: string[];
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
