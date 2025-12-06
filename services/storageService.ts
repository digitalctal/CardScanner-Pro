import { Contact } from '../types';

const STORAGE_KEY = 'cardscanner_contacts';

export const getContacts = (): Contact[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load contacts", e);
    return [];
  }
};

export const saveContact = (contact: Contact): void => {
  const contacts = getContacts();
  // Check if updating existing
  const index = contacts.findIndex(c => c.id === contact.id);
  if (index >= 0) {
    contacts[index] = contact;
  } else {
    contacts.unshift(contact);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
};

export const deleteContact = (id: string): void => {
  const contacts = getContacts();
  const filtered = contacts.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
