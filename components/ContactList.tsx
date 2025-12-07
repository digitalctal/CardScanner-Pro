import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, Phone, Mail, Trash2, Download, UserPlus, MapPin, MessageCircle, Share2, Image as ImageIcon } from 'lucide-react';
import { Contact, BeforeInstallPromptEvent } from '../types';

interface ContactListProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onDelete: (id: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onSelect, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanNumber = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleShare = async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    const shareData = {
      title: contact.name,
      text: `Contact Info:\n${contact.name}\n${contact.jobTitle} at ${contact.company}\nPhone: ${contact.phone}\nEmail: ${contact.email}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Contact details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleDownloadImage = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (!contact.photoData) {
      alert("No saved card image available for this contact.");
      return;
    }

    const link = document.createElement('a');
    link.href = contact.photoData;
    link.download = `${contact.name.replace(/\s+/g, '_')}_Card.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVcf = async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    
    let photoBlock = '';
    // Priority: Saved Data -> Web Data (we can't easily export web data to VCF without downloading it first, so we prioritize saved)
    if (contact.photoData) {
      const base64Clean = contact.photoData.replace(/^data:image\/[a-z]+;base64,/, "");
      photoBlock = `PHOTO;ENCODING=b;TYPE=JPEG:${base64Clean}\n`;
    }

    const vcard = `BEGIN:VCARD
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

    try {
      const file = new File([vcard], `${contact.name.replace(/\s+/g, '_')}.vcf`, { type: 'text/vcard' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: contact.name,
          text: 'Contact Card'
        });
        return;
      }
    } catch (err) {
      console.log("Native file share not supported", err);
    }

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 active:bg-blue-100 transition-colors"
            >
              <Download size={14} />
              Install
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <User size={48} className="mb-2 opacity-20" />
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredContacts.map(contact => {
              // Logic: Use saved photo -> Use Web Avatar (Email) -> Use Placeholder
              const avatarSource = contact.photoData 
                ? contact.photoData 
                : contact.email 
                  ? `https://unavatar.io/${contact.email}` 
                  : null;

              return (
                <div 
                  key={contact.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors group relative"
                  onClick={() => onSelect(contact)}
                >
                   {/* Top Middle Avatar Section */}
                   <div className="pt-6 pb-2 flex flex-col items-center justify-center relative">
                      <div className="w-20 h-20 rounded-full bg-gray-100 ring-4 ring-white shadow-md flex items-center justify-center overflow-hidden mb-3 relative z-10">
                        {avatarSource ? (
                          <img 
                            src={avatarSource} 
                            alt={contact.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If unavatar fails, fallback to icon
                              e.currentTarget.style.display = 'none'; 
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        {/* Fallback Icon (hidden if image loads successfully) */}
                        <div className={`flex items-center justify-center w-full h-full text-gray-400 bg-gray-200 ${avatarSource ? 'hidden' : ''}`}>
                          <User size={32} />
                        </div>
                      </div>
                      
                      <div className="text-center px-4 w-full">
                        <h3 className="font-bold text-gray-800 text-lg truncate">{contact.name}</h3>
                        <p className="text-sm text-gray-500 font-medium truncate">{contact.jobTitle}</p>
                        {contact.company && <p className="text-xs text-blue-600 font-medium mt-0.5 truncate">{contact.company}</p>}
                      </div>
                   </div>

                   {/* Action Bar */}
                   <div className="px-4 pb-4 mt-2">
                     <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-50">
                        {/* Quick Primary Actions */}
                        {contact.phone && (
                          <a 
                            href={`tel:${contact.phone}`} 
                            onClick={e => e.stopPropagation()} 
                            className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                            title="Call"
                          >
                             <Phone size={18} /> 
                          </a>
                        )}
                        {contact.phone && (
                            <button
                              onClick={(e) => handleWhatsApp(e, contact.phone)}
                              className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200"
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                        )}
                        
                        {contact.email && (
                          <a 
                            href={`mailto:${contact.email}`} 
                            onClick={e => e.stopPropagation()} 
                            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Email"
                          >
                             <Mail size={18} /> 
                          </a>
                        )}

                        {contact.address && (
                          <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()} 
                            className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center hover:bg-orange-100"
                            title="Map"
                          >
                              <MapPin size={18} />
                          </a>
                        )}

                        <div className="w-px h-6 bg-gray-200 mx-1"></div>

                        {/* Secondary Actions */}
                        <button 
                          onClick={(e) => handleExportVcf(e, contact)}
                          className="w-8 h-8 text-gray-400 hover:text-indigo-600 flex items-center justify-center"
                          title="Sync to Contacts"
                        >
                          <UserPlus size={18} />
                        </button>
                        
                        <button 
                          onClick={(e) => handleShare(e, contact)}
                          className="w-8 h-8 text-gray-400 hover:text-orange-600 flex items-center justify-center"
                          title="Share"
                        >
                          <Share2 size={18} />
                        </button>

                         {contact.photoData && (
                          <button 
                            onClick={(e) => handleDownloadImage(e, contact)}
                            className="w-8 h-8 text-gray-400 hover:text-purple-600 flex items-center justify-center"
                            title="Download Scan"
                          >
                            <ImageIcon size={18} />
                          </button>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                          className="w-8 h-8 text-gray-400 hover:text-red-500 flex items-center justify-center"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="h-20"></div> {/* Spacer for bottom nav */}
      </div>
    </div>
  );
};

export default ContactList;