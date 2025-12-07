import { Contact } from '../types';

export const generateVCardString = (contact: Contact): string => {
  let photoBlock = '';
  // Clean base64 for VCF
  if (contact.photoData) {
    const base64Clean = contact.photoData.replace(/^data:image\/[a-z]+;base64,/, "");
    photoBlock = `PHOTO;ENCODING=b;TYPE=JPEG:${base64Clean}\n`;
  }

  return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
ORG:${contact.company}
TITLE:${contact.jobTitle}
TEL;TYPE=CELL:${contact.phone}
EMAIL:${contact.email}
URL:${contact.website}
ADR;TYPE=WORK:;;${contact.address};;;;
NOTE:${contact.notes}
${photoBlock}END:VCARD`;
};

export const parseVCardString = (vcard: string): Partial<Contact> => {
  const result: Partial<Contact> = {};
  
  // Helper regexes
  const extract = (key: string) => {
    const regex = new RegExp(`^${key}(?:;[^:]*)*:(.*)$`, 'm');
    const match = vcard.match(regex);
    return match ? match[1].trim() : '';
  };

  result.name = extract('FN') || extract('N').split(';').reverse().join(' ').trim();
  result.company = extract('ORG');
  result.jobTitle = extract('TITLE');
  result.phone = extract('TEL');
  result.email = extract('EMAIL');
  result.website = extract('URL');
  
  // Address might be semicolon separated
  const rawAddr = extract('ADR');
  result.address = rawAddr.replace(/;/g, ' ').trim();
  
  result.notes = extract('NOTE');

  return result;
};