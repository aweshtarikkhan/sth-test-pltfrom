import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If it's iOS and not in standalone mode, we can show a custom prompt immediately
    if (isIosDevice && !localStorage.getItem('pwaPromptDismissed')) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // Android / Desktop Chrome PWA standard prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwaPromptDismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100000] p-4 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border border-gray-100 dark:border-slate-700 p-5 w-full max-w-md mx-auto relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b00] to-[#ff8c00] rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Download className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-[17px]">Install AassayBiz</h3>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Use it full-screen like a native app!</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
            <p className="text-[13px] text-[#0a192f] dark:text-blue-100 font-medium leading-relaxed">
              To install, tap the <Share className="w-4 h-4 inline-block mx-1 -mt-1 text-blue-500" /> <b>Share</b> button at the bottom of your screen, then scroll down and tap <b>"Add to Home Screen"</b>.
            </p>
          </div>
        ) : (
          <Button 
            onClick={handleInstallClick} 
            className="w-full h-12 bg-[#0a192f] hover:bg-[#0d213b] text-white rounded-xl font-bold shadow-md"
          >
            Add to Home Screen
          </Button>
        )}
      </div>
    </div>
  );
}
