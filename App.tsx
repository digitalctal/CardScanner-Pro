import React, { useState, useEffect } from 'react';
import { Camera, Plus, Users, Sparkles, ScanLine } from 'lucide-react';
import { AppView, Contact } from './types';
import CameraCapture from './components/CameraCapture';
import ContactForm from './components/ContactForm';
import ContactList from './components/ContactList';
import AiAssistant from './components/AiAssistant';
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

  // Views that should show the bottom navigation
  const showBottomNav = view === AppView.LIST || view === AppView.AI_ASSISTANT;

  return (
    // Use 100dvh for proper mobile height including browser bars
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-white overflow-hidden relative shadow-2xl flex flex-col">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === AppView.LIST && (
            <ContactList 
              contacts={contacts} 
              onSelect={handleSelectContact} 
              onDelete={handleDeleteContact}
            />
        )}

        {view === AppView.AI_ASSISTANT && (
          <AiAssistant contacts={contacts} />
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

      {/* Floating Add Manual Button (Only on List View) */}
      {view === AppView.LIST && (
         <button 
          onClick={handleAddNewManual}
          className="absolute bottom-24 right-6 w-12 h-12 rounded-full bg-white text-blue-600 shadow-lg border border-blue-100 flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
          title="Add Manually"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <div className="bg-white border-t border-gray-200 pb-safe-bottom z-30">
          <div className="flex justify-around items-center h-16">
            <button 
              onClick={() => setView(AppView.LIST)}
              className={`flex flex-col items-center gap-1 w-16 ${view === AppView.LIST ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <Users size={24} strokeWidth={view === AppView.LIST ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Contacts</span>
            </button>

            {/* Center Scan Button */}
            <div className="relative -top-5">
              <button 
                onClick={() => setView(AppView.CAMERA)}
                className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <ScanLine size={28} />
              </button>
            </div>

            <button 
              onClick={() => setView(AppView.AI_ASSISTANT)}
              className={`flex flex-col items-center gap-1 w-16 ${view === AppView.AI_ASSISTANT ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <Sparkles size={24} strokeWidth={view === AppView.AI_ASSISTANT ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Ask AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;