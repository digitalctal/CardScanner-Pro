import React, { useState } from 'react';
import { Save, ArrowLeft, User, Briefcase, Building, Phone, Mail, Globe, MapPin, FileText } from 'lucide-react';
import { Contact, ScannedData } from '../types';

interface ContactFormProps {
  initialData?: Partial<Contact>;
  scannedImage?: string;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ initialData, scannedImage, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Contact>>(initialData || {});

  const handleChange = (field: keyof Contact, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        {scannedImage && (
           <div className="w-full h-48 bg-gray-200 rounded-xl overflow-hidden shadow-inner mb-6 relative group">
             <img src={scannedImage} alt="Scanned Card" className="w-full h-full object-contain" />
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-white text-sm">Original Scan</span>
             </div>
           </div>
        )}

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
