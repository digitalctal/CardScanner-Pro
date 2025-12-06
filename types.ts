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
  createdAt: number;
}

export type ScannedData = Omit<Contact, 'id' | 'notes' | 'createdAt'>;

export enum AppView {
  LIST = 'LIST',
  CAMERA = 'CAMERA',
  EDIT = 'EDIT',
  DETAILS = 'DETAILS'
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