
export interface Contact {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notes: string;
  photoData?: string; // Base64 string of the business card
  color?: string; // Background/Priority color hex
  createdAt: number;
}

export type ScannedData = Omit<Contact, 'id' | 'notes' | 'photoData' | 'createdAt' | 'color'>;

export enum AppView {
  LIST = 'LIST',
  CAMERA = 'CAMERA',
  EDIT = 'EDIT',
  DETAILS = 'DETAILS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  SETTINGS = 'SETTINGS'
}

// PWA Install Prompt Type definition
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
