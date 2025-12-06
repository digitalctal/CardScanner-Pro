import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, ChevronRight, Phone, Mail, Trash2, Download, UserPlus, MapPin, MessageCircle, Share2 } from 'lucide-react';
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
    // Remove all non-numeric characters for the API
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
        // Fallback for desktop/unsupported browsers
        await navigator.clipboard.writeText(shareData.text);
        alert('Contact details copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleExportVcf = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    
    // Create VCF string
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
END:VCARD`;

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
          <div className="space-y-3">
            {filteredContacts.map(contact => (
              <div 
                key={contact.id} 
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors group"
                onClick={() => onSelect(contact)}
              >
                 <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg">{contact.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{contact.jobTitle} {contact.company && `• ${contact.company}`}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                 </div>

                 {/* Quick Actions - Wrapped to handle multiple buttons */}
                 <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    {/* Primary Actions (Expanded) */}
                    {contact.phone && (
                      <a 
                        href={`tel:${contact.phone}`} 
                        onClick={e => e.stopPropagation()} 
                        className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-green-100 transition-colors min-w-[80px]"
                      >
                         <Phone size={16} /> Call
                      </a>
                    )}
                    
                    {contact.email && (
                      <a 
                        href={`mailto:${contact.email}`} 
                        onClick={e => e.stopPropagation()} 
                        className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-blue-100 transition-colors min-w-[80px]"
                      >
                         <Mail size={16} /> Email
                      </a>
                    )}

                    {/* Secondary Icon Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      {contact.phone && (
                        <button
                          onClick={(e) => handleWhatsApp(e, contact.phone)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          title="WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}

                      {contact.address && (
                         <a 
                           href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           onClick={e => e.stopPropagation()} 
                           className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                           title="Open Map"
                         >
                            <MapPin size={18} />
                         </a>
                      )}

                      <button 
                        onClick={(e) => handleShare(e, contact)}
                        className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                        title="Share Contact"
                      >
                        <Share2 size={18} />
                      </button>

                      <button 
                        onClick={(e) => handleExportVcf(e, contact)}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                        title="Save to Phone Contacts"
                      >
                        <UserPlus size={18} />
                      </button>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-20"></div> {/* Spacer for bottom nav */}
      </div>
    </div>
  );
};

export default ContactList;