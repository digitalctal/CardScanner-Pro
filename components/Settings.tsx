
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, QrCode, Save, Info, Smartphone, Mail, Globe, Building, Briefcase } from 'lucide-react';
import QRCode from 'qrcode';
import { Contact } from '../types';
import { getUserProfile, saveUserProfile } from '../services/storageService';
import { generateVCardString } from '../services/vcardService';

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<Partial<Contact>>({});
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    const saved = getUserProfile();
    setProfile(saved);
  }, []);

  const handleChange = (field: keyof Contact, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveUserProfile(profile);
    alert("Profile Saved Successfully!");
  };

  const handleGenerateQr = async () => {
    if (!profile.name) {
      alert("Please enter at least your name to generate a card.");
      return;
    }
    // Create a dummy complete contact object for the service
    const contactObj = {
      ...profile,
      id: 'me',
      createdAt: Date.now(),
      notes: 'Scanned from Digital VCard'
    } as Contact;

    const vcard = generateVCardString(contactObj);
    try {
      const url = await QRCode.toDataURL(vcard, { width: 300, margin: 2 });
      setQrUrl(url);
      setShowQr(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between transition-colors">
        <button onClick={onBack} className="text-gray-600 dark:text-gray-300 p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Settings & Profile</h1>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Digital Card Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
             <h2 className="text-xl font-bold mb-1">My Digital Card</h2>
             <p className="text-blue-100 text-xs mb-4">Share your contact details instantly</p>
             
             <button 
               onClick={handleGenerateQr}
               className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md active:scale-95 transition-transform"
             >
               <QrCode size={18} />
               Show My QR Code
             </button>
          </div>
          <QrCode className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32" />
        </div>

        {/* Edit Profile Form */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-1">
             <User size={18} className="text-gray-500" />
             <h3 className="font-semibold text-gray-700 dark:text-gray-200">Personal Information</h3>
           </div>
           
           <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name || ''} 
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Your Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Job Title</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      value={profile.jobTitle || ''} 
                      onChange={e => handleChange('jobTitle', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 pl-9 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Title"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Company</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      value={profile.company || ''} 
                      onChange={e => handleChange('company', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 pl-9 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Company"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Phone</label>
                  <div className="relative">
                    <Smartphone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="tel" 
                      value={profile.phone || ''} 
                      onChange={e => handleChange('phone', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 pl-9 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="+1 234..."
                    />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="email" 
                      value={profile.email || ''} 
                      onChange={e => handleChange('email', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 pl-9 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="you@example.com"
                    />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Website</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input 
                      type="url" 
                      value={profile.website || ''} 
                      onChange={e => handleChange('website', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 p-3 pl-9 rounded-lg text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="www.yoursite.com"
                    />
                  </div>
              </div>
              
              <button 
                onClick={handleSave}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Save size={18} />
                Save Profile
              </button>
           </div>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm flex flex-col gap-4">
           <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
             <Info size={18} className="text-gray-500" />
             <h3 className="font-semibold text-gray-700 dark:text-gray-200">About App</h3>
           </div>
           
           <div className="flex justify-between items-center text-sm">
             <span className="text-gray-500">Version</span>
             <span className="text-gray-800 dark:text-gray-200 font-mono">1.2.0</span>
           </div>
           <div className="flex justify-between items-center text-sm">
             <span className="text-gray-500">Author</span>
             <span className="text-gray-800 dark:text-gray-200 font-medium">CardScanner Team</span>
           </div>
           <div className="text-center text-xs text-gray-400 mt-2">
             Powered by Google Gemini AI
           </div>
        </div>
        
        <div className="h-6"></div>
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowQr(false)}>
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-2 text-black">My Digital Card</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">Scan this to add me to your contacts</p>
              
              <div className="p-2 border-2 border-gray-100 rounded-xl mb-6 shadow-inner">
                <img src={qrUrl} className="w-64 h-64 object-contain" />
              </div>

              <button onClick={() => setShowQr(false)} className="text-blue-600 font-medium">
                Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
