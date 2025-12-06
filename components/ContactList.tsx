import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, ChevronRight, Phone, Mail, Trash2, Download } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-gray-800">My Contacts</h1>
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 active:bg-blue-100 transition-colors"
            >
              <Download size={14} />
              Install App
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
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                 <div className="flex-1 cursor-pointer" onClick={() => onSelect(contact)}>
                    <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                    <p className="text-sm text-gray-500">{contact.jobTitle} {contact.company && `• ${contact.company}`}</p>
                    
                    <div className="flex items-center gap-3 mt-2">
                       {contact.phone && (
                         <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors">
                            <Phone size={14} />
                         </a>
                       )}
                       {contact.email && (
                         <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                            <Mail size={14} />
                         </a>
                       )}
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight size={20} className="text-gray-300" />
                 </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default ContactList;