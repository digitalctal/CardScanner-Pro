
import React, { useState, useEffect } from 'react';
import { Plus, Users, Sparkles, ScanLine } from 'lucide-react';
import { AppView, Contact } from './types';
import CameraCapture from './components/CameraCapture';
import ContactForm from './components/ContactForm';
import ContactList from './components/ContactList';
import AiAssistant from './components/AiAssistant';
import Settings from './components/Settings';
import { extractContactInfo } from './services/geminiService';
import { getContacts, saveContact, deleteContact } from './services/storageService';
import { parseVCardString } from './services/vcardService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIST);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Partial<Contact> | undefined>(undefined);
  const [scannedImage, setScannedImage] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      // Update meta theme-color for mobile browser bars
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#000000');
    } else {
      root.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#ffffff');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  const refreshContacts = () => {
    setContacts(getContacts());
  };

  const handleCapture = async (data: string, type: 'image' | 'qr') => {
    setIsProcessing(true);
    setView(AppView.EDIT);
    
    if (type === 'image') {
      // OCR FLOW
      setScannedImage(data);
      try {
        const extractedData = await extractContactInfo(data);
        setCurrentContact({
          ...extractedData,
          notes: '',
        });
      } catch (error: any) {
        console.error(error);
        alert(error.message || "Failed to read card.");
        setCurrentContact({});
      } finally {
        setIsProcessing(false);
      }
    } else {
      // QR FLOW
      setScannedImage(undefined);
      try {
        const parsedData = parseVCardString(data);
        setCurrentContact(parsedData);
        // Add a slight delay just so the user sees the transition
        setTimeout(() => setIsProcessing(false), 500);
      } catch (e) {
        alert("Invalid QR Code");
        setIsProcessing(false);
        setView(AppView.LIST);
      }
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
    <div className="h-[100dvh] w-full max-w-md mx-auto bg-white dark:bg-black overflow-hidden relative shadow-2xl flex flex-col transition-colors duration-300">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {view === AppView.LIST && (
            <ContactList 
              contacts={contacts} 
              onSelect={handleSelectContact} 
              onDelete={handleDeleteContact}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenSettings={() => setView(AppView.SETTINGS)}
            />
        )}

        {view === AppView.AI_ASSISTANT && (
          <AiAssistant contacts={contacts} />
        )}

        {view === AppView.SETTINGS && (
          <Settings onBack={() => setView(AppView.LIST)} />
        )}

        {view === AppView.CAMERA && (
          <CameraCapture 
            onCapture={handleCapture} 
            onCancel={() => setView(AppView.LIST)} 
          />
        )}

        {view === AppView.EDIT && (
          isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-4">
               <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
               <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Processing...</p>
               <p className="text-xs text-gray-400 dark:text-gray-500">{scannedImage ? "Analyzing with Gemini AI" : "Parsing QR Code"}</p>
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
          className="absolute bottom-24 right-6 w-12 h-12 rounded-full bg-white dark:bg-gray-800 text-blue-600 shadow-lg border border-blue-100 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-20"
          title="Add Manually"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Navigation Bar */}
      {showBottomNav && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe-bottom z-30 transition-colors duration-300">
          <div className="flex justify-around items-center h-16">
            <button 
              onClick={() => setView(AppView.LIST)}
              className={`flex flex-col items-center gap-1 w-16 ${view === AppView.LIST ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
              <Users size={24} strokeWidth={view === AppView.LIST ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Contacts</span>
            </button>

            {/* Center Scan Button */}
            <div className="relative -top-5">
              <button 
                onClick={() => setView(AppView.CAMERA)}
                className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center hover:scale-105 transition-transform border-4 border-white dark:border-black"
              >
                <ScanLine size={28} />
              </button>
            </div>

            <button 
              onClick={() => setView(AppView.AI_ASSISTANT)}
              className={`flex flex-col items-center gap-1 w-16 ${view === AppView.AI_ASSISTANT ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}
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
