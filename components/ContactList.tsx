import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, Phone, Mail, Trash2, Download, UserPlus, MessageCircle, Image as ImageIcon, QrCode, X, Sun, Moon, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { Contact, BeforeInstallPromptEvent } from '../types';
import { generateVCardString } from '../services/vcardService';

interface ContactListProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  onDelete: (id: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onSelect, onDelete, theme, onToggleTheme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [qrModalContact, setQrModalContact] = useState<Contact | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

  const handleShareContact = async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    const vcard = generateVCardString(contact);
    const fileName = `${contact.name.replace(/\s+/g, '_')}.vcf`;
    const shareText = `Contact: ${contact.name}\n${contact.jobTitle ? contact.jobTitle + ' at ' + contact.company + '\n' : ''}${contact.phone}\n${contact.email}`;

    try {
      const file = new File([vcard], fileName, { type: 'text/vcard' });
      
      // 1. Try sharing File (VCF)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: contact.name,
          text: shareText
        });
        return;
      }
      
      // 2. Fallback to Text Share
      if (navigator.share) {
        await navigator.share({
          title: contact.name,
          text: shareText,
          url: contact.website || undefined
        });
        return;
      }
      
      alert("Sharing not supported on this browser.");
    } catch (err) {
      console.log("Share cancelled or failed", err);
    }
  };

  const handleDownloadVcf = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    const vcard = generateVCardString(contact);
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowQR = async (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    const vcard = generateVCardString(contact);
    try {
      const url = await QRCode.toDataURL(vcard, { width: 300, margin: 2 });
      setQrCodeUrl(url);
      setQrModalContact(contact);
    } catch (err) {
      console.error("QR Gen Error", err);
      alert("Could not generate QR code");
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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors duration-300">
      <div className="bg-white dark:bg-gray-900 p-4 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Contacts</h1>
          </div>
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 active:bg-blue-100 dark:active:bg-blue-900/50 transition-colors"
              >
                <Download size={14} />
                Install
              </button>
            )}
            <button 
              onClick={onToggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700 dark:text-gray-200 placeholder-gray-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
            <User size={48} className="mb-2 opacity-20" />
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredContacts.map(contact => {
              const avatarSource = contact.photoData 
                ? contact.photoData 
                : contact.email 
                  ? `https://unavatar.io/${contact.email}` 
                  : null;

              const cardBg = contact.color || '#ffffff';
              const isWhite = cardBg.toLowerCase() === '#ffffff';

              return (
                <div 
                  key={contact.id} 
                  className={`rounded-2xl shadow-sm overflow-hidden active:scale-[0.99] transition-all group relative border ${
                    isWhite 
                      ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: isWhite ? undefined : cardBg }}
                  onClick={() => onSelect(contact)}
                >
                   {/* Top Middle Avatar Section */}
                   <div className="pt-6 pb-2 flex flex-col items-center justify-center relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mb-3 relative z-10 shadow-md ${
                        isWhite 
                          ? 'bg-gray-50 dark:bg-gray-800 ring-4 ring-gray-50 dark:ring-gray-800' 
                          : 'bg-white/50 ring-4 ring-white/30'
                      }`}>
                        {avatarSource ? (
                          <img 
                            src={avatarSource} 
                            alt={contact.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'; 
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`flex items-center justify-center w-full h-full ${avatarSource ? 'hidden' : ''} ${isWhite ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500'}`}>
                          <User size={32} />
                        </div>
                      </div>
                      
                      <div className="text-center px-4 w-full">
                        <h3 className={`font-bold text-lg truncate ${isWhite ? 'text-gray-800 dark:text-white' : 'text-gray-900'}`}>{contact.name}</h3>
                        <p className={`text-sm font-medium truncate ${isWhite ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700/80'}`}>{contact.jobTitle}</p>
                        {contact.company && <p className={`text-xs font-medium mt-0.5 truncate ${isWhite ? 'text-blue-600 dark:text-blue-400' : 'text-blue-800'}`}>{contact.company}</p>}
                      </div>
                   </div>

                   {/* Action Bar */}
                   <div className="px-4 pb-4 mt-2">
                     <div className={`flex items-center justify-center gap-3 pt-4 border-t ${isWhite ? 'border-gray-100 dark:border-gray-800' : 'border-black/5'}`}>
                        {/* Quick Primary Actions */}
                        {contact.phone && (
                          <a 
                            href={`tel:${contact.phone}`} 
                            onClick={e => e.stopPropagation()} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                              isWhite 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30' 
                                : 'bg-white/60 hover:bg-white text-green-700'
                            }`}
                            title="Call"
                          >
                             <Phone size={18} /> 
                          </a>
                        )}
                        {contact.phone && (
                            <button
                              onClick={(e) => handleWhatsApp(e, contact.phone)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                isWhite 
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30' 
                                  : 'bg-white/60 hover:bg-white text-green-700'
                              }`}
                              title="WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </button>
                        )}
                        
                        {contact.email && (
                          <a 
                            href={`mailto:${contact.email}`} 
                            onClick={e => e.stopPropagation()} 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                              isWhite 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                : 'bg-white/60 hover:bg-white text-blue-700'
                            }`}
                            title="Email"
                          >
                             <Mail size={18} /> 
                          </a>
                        )}

                        <div className={`w-px h-6 mx-1 ${isWhite ? 'bg-gray-200 dark:bg-gray-700' : 'bg-black/10'}`}></div>

                        {/* Secondary Actions */}
                        <button 
                          onClick={(e) => handleShareContact(e, contact)}
                          className={`w-8 h-8 flex items-center justify-center ${isWhite ? 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400' : 'text-gray-600 hover:text-blue-700'}`}
                          title="Share"
                        >
                          <Share2 size={18} />
                        </button>

                        <button 
                          onClick={(e) => handleDownloadVcf(e, contact)}
                          className={`w-8 h-8 flex items-center justify-center ${isWhite ? 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white' : 'text-gray-600 hover:text-black'}`}
                          title="Save to Phone"
                        >
                          <UserPlus size={18} />
                        </button>
                        
                        <button 
                          onClick={(e) => handleShowQR(e, contact)}
                          className={`w-8 h-8 flex items-center justify-center ${isWhite ? 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white' : 'text-gray-600 hover:text-black'}`}
                          title="Show QR Code"
                        >
                          <QrCode size={18} />
                        </button>

                         {contact.photoData && (
                          <button 
                            onClick={(e) => handleDownloadImage(e, contact)}
                            className={`w-8 h-8 flex items-center justify-center ${isWhite ? 'text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400' : 'text-gray-600 hover:text-purple-700'}`}
                            title="Download Scan"
                          >
                            <ImageIcon size={18} />
                          </button>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(contact.id); }}
                          className={`w-8 h-8 flex items-center justify-center ${isWhite ? 'text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400' : 'text-gray-600 hover:text-red-600'}`}
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

      {/* QR Code Modal */}
      {qrModalContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-sm" onClick={() => setQrModalContact(null)}>
           <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 relative flex flex-col items-center shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setQrModalContact(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
              
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 overflow-hidden border-2 border-white dark:border-gray-700 shadow-md">
                 {qrModalContact.photoData ? (
                   <img src={qrModalContact.photoData} className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex items-center justify-center h-full text-gray-400"><User size={32} /></div>
                 )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1">{qrModalContact.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{qrModalContact.company}</p>

              <div className="bg-white p-2 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner mb-6">
                <img src={qrCodeUrl} alt="Contact QR Code" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
              </div>

              <p className="text-xs text-center text-gray-400 dark:text-gray-500 max-w-xs">
                Scan with any phone camera to add <strong>{qrModalContact.name.split(' ')[0]}</strong> to contacts instantly.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;