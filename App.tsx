import React, { useState, useEffect } from 'react';
import { Camera, Plus } from 'lucide-react';
import { AppView, Contact } from './types';
import CameraCapture from './components/CameraCapture';
import ContactForm from './components/ContactForm';
import ContactList from './components/ContactList';
import { extractContactInfo } from './services/geminiService';
import { getContacts, saveContact, deleteContact } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Partial<Contact> | undefined>(undefined);
  const [scannedImage, setScannedImage] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  const refreshContacts = () => {
    setContacts(getContacts());
  };

  const handleCapture = async (imageData: string) => {
    setScannedImage(imageData);
    setIsProcessing(true);
    setView(AppView.EDIT); 
    
    try {
      const extractedData = await extractContactInfo(imageData);
      setCurrentContact({
        ...extractedData,
        notes: '', // Initialize notes
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to read card. Please try again or enter details manually.");
      setCurrentContact({});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveContact = (contact: Contact) => {
    saveContact(contact);
    refreshContacts();
    setView(AppView.LIST);
    setCurrentContact(undefined);
    setScannedImage(undefined);
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteContact(id);
      refreshContacts();
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setCurrentContact(contact);
    setView(AppView.EDIT);
    setScannedImage(undefined);
  };

  const handleAddNewManual = () => {
    setCurrentContact({});
    setScannedImage(undefined);
    setView(AppView.EDIT);
  };

  return (
    // Use 100dvh for proper mobile height including browser bars
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-white overflow-hidden relative shadow-2xl flex flex-col">
      
      {view === AppView.LIST && (
        <>
          <ContactList 
            contacts={contacts} 
            onSelect={handleSelectContact} 
            onDelete={handleDeleteContact}
          />
          {/* Floating Action Button */}
          <div className="absolute bottom-8 right-6 flex flex-col gap-4">
             <button 
              onClick={handleAddNewManual}
              className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 shadow-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
              title="Add Manually"
            >
              <Plus size={24} />
            </button>
            <button 
              onClick={() => setView(AppView.CAMERA)}
              className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Camera size={28} />
            </button>
          </div>
        </>
      )}

      {view === AppView.CAMERA && (
        <CameraCapture 
          onCapture={handleCapture} 
          onCancel={() => setView(AppView.LIST)} 
        />
      )}

      {view === AppView.EDIT && (
        isProcessing ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 space-y-4">
             <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="text-gray-500 font-medium animate-pulse">Analyzing Business Card...</p>
             <p className="text-xs text-gray-400">Powered by Gemini AI</p>
          </div>
        ) : (
          <ContactForm 
            initialData={currentContact} 
            scannedImage={scannedImage}
            onSave={handleSaveContact}
            onCancel={() => {
              setView(AppView.LIST);
              setScannedImage(undefined);
              setCurrentContact(undefined);
            }}
          />
        )
      )}
    </div>
  );
};

export default App;