import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, User, Briefcase, Building, Phone, Mail, Globe, MapPin, FileText, RefreshCw, Image as ImageIcon, Loader2, Palette, Check } from 'lucide-react';
import { Contact, ScannedData } from '../types';

interface ContactFormProps {
  initialData?: Partial<Contact>;
  scannedImage?: string;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

const COLORS = [
  { hex: '#ffffff', name: 'Default' },
  { hex: '#fecaca', name: 'Urgent' }, // Red-200
  { hex: '#bfdbfe', name: 'Work' },   // Blue-200
  { hex: '#bbf7d0', name: 'Personal' }, // Green-200
  { hex: '#fef08a', name: 'Pending' }, // Yellow-200
  { hex: '#e9d5ff', name: 'VIP' },     // Purple-200
  { hex: '#fed7aa', name: 'Orange' },  // Orange-200
];

const ContactForm: React.FC<ContactFormProps> = ({ initialData, scannedImage, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Contact>>(initialData || {});
  // Initialize active image: prioritize new scan, then existing photo
  const [activeImage, setActiveImage] = useState<string | undefined>(scannedImage || initialData?.photoData);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // If a new scan comes in via props, ensure it's set
    if (scannedImage) {
      setActiveImage(scannedImage);
    }
  }, [scannedImage]);

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchAvatar = async (email: string) => {
    if (!email) return;
    setIsSyncing(true);
    try {
      // unavatar.io aggregates Gravatar, Clearbit, etc.
      const response = await fetch(`https://unavatar.io/${email}?fallback=false`);
      
      if (!response.ok) {
        throw new Error("No public profile photo found");
      }

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setActiveImage(base64);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      // Silent fail on auto-fetch, specific alert on manual click
      console.log("Could not auto-fetch avatar");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailBlur = () => {
    // Auto-fetch if no image is currently set and we have an email
    if (!activeImage && formData.email) {
      fetchAvatar(formData.email);
    }
  };

  const handleSyncPhoto = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Please enter an email address to search for a profile photo.");
      return;
    }
    
    // Manual click gives feedback
    setIsSyncing(true);
    try {
       await fetchAvatar(formData.email);
    } catch(e) {
       alert("Could not find a public profile photo for this email.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    
    const newContact: Contact = {
      id: formData.id || `contact_${now}`,
      name: formData.name || 'Unknown',
      jobTitle: formData.jobTitle || '',
      company: formData.company || '',
      phone: formData.phone || '',
      email: formData.email || '',
      website: formData.website || '',
      address: formData.address || '',
      notes: formData.notes || '',
      photoData: activeImage, // Use the currently active image (scan or synced)
      color: formData.color || '#ffffff',
      createdAt: formData.createdAt || now,
    };
    onSave(newContact);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={onCancel} className="text-gray-600 p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {formData.id ? 'Edit Contact' : 'New Contact'}
        </h1>
        <button 
          onClick={handleSubmit} 
          className="text-blue-600 font-medium px-2 py-1 rounded hover:bg-blue-50"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Photo Area */}
        <div className="w-full relative group">
           <div className={`w-full h-56 rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 flex items-center justify-center relative ${!activeImage ? 'bg-gradient-to-br from-gray-100 to-gray-200' : ''}`}>
             {activeImage ? (
               <img 
                 src={activeImage} 
                 alt="Contact" 
                 className="w-full h-full object-contain bg-black/5" 
               />
             ) : (
               <div className="flex flex-col items-center text-gray-400">
                 <ImageIcon size={48} className="mb-2 opacity-50" />
                 <span className="text-xs font-medium">No Photo</span>
                 <span className="text-[10px] text-gray-400 mt-1">Add email to auto-sync</span>
               </div>
             )}

             {/* Photo Actions Overlay */}
             <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={handleSyncPhoto}
                  disabled={isSyncing}
                  className="bg-white/90 hover:bg-white text-blue-600 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm flex items-center gap-2 active:scale-95 transition-all"
                >
                  {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  Sync from Web
                </button>
             </div>
           </div>
           {activeImage && (
              <p className="text-[10px] text-center mt-1 text-gray-400">
                {scannedImage === activeImage ? "Original Scanned Card" : "Synced Profile Photo"}
              </p>
           )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personal Info</h2>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <User size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <Briefcase size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Job Title"
                value={formData.jobTitle || ''}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Building size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Company"
                value={formData.company || ''}
                onChange={(e) => handleChange('company', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Color Priority Picker */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
             <div className="flex items-center gap-2 mb-3">
               <Palette size={18} className="text-gray-400" />
               <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority / Color Tag</h2>
             </div>
             <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
               {COLORS.map((color) => (
                 <button
                   key={color.hex}
                   type="button"
                   onClick={() => handleChange('color', color.hex)}
                   className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                     (formData.color || '#ffffff') === color.hex 
                       ? 'scale-110 shadow-md ring-2 ring-blue-500 ring-offset-2' 
                       : 'border-gray-100 hover:scale-105'
                   }`}
                   style={{ backgroundColor: color.hex }}
                   title={color.name}
                 >
                   {(formData.color || '#ffffff') === color.hex && (
                     <Check size={16} className="text-black/50" />
                   )}
                 </button>
               ))}
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Details</h2>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <Phone size={20} className="text-gray-400 shrink-0" />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <Mail size={20} className="text-gray-400 shrink-0" />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={handleEmailBlur} // Trigger auto-fetch on blur
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
              <Globe size={20} className="text-gray-400 shrink-0" />
              <input
                type="url"
                placeholder="Website"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <MapPin size={20} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 mb-2">
               <FileText size={18} className="text-blue-500" />
               <h2 className="text-sm font-semibold text-gray-700">Comments / Notes</h2>
            </div>
            <textarea
              placeholder="Add personal notes, meeting context, or reminders here..."
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full h-32 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-gray-700 placeholder-gray-400 outline-none resize-none focus:ring-2 focus:ring-yellow-200 transition-shadow"
            />
          </div>

        </form>
        {/* Spacer for bottom save button visibility on small screens */}
        <div className="h-20"></div>
      </div>
      
      <div className="p-4 bg-white border-t border-gray-200 md:hidden sticky bottom-0">
          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Contact
          </button>
      </div>
    </div>
  );
};

export default ContactForm;