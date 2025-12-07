import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Upload, AlertCircle, Loader2, Camera, SwitchCamera, QrCode, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';

interface CameraCaptureProps {
  onCapture: (data: string, type: 'image' | 'qr') => void;
  onCancel: () => void;
}

type ScanMode = 'card' | 'qr';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);
  const requestRef = useRef<number>();
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [mode, setMode] = useState<ScanMode>('card');

  const stopCamera = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const scanQRCode = useCallback(() => {
    if (mode !== 'qr' || !videoRef.current || !canvasRef.current || !isReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR Code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          // Vibrate if supported
          if (navigator.vibrate) navigator.vibrate(200);
          stopCamera();
          onCapture(code.data, 'qr');
          return;
        }
      }
    }
    
    requestRef.current = requestAnimationFrame(scanQRCode);
  }, [mode, isReady, onCapture, stopCamera]);

  useEffect(() => {
    if (mode === 'qr' && isReady) {
      requestRef.current = requestAnimationFrame(scanQRCode);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [mode, isReady, scanQRCode]);

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    
    stopCamera();
    setError('');
    setIsLoading(true);
    setIsReady(false);

    // 1. Check for Secure Context
    if (window.location.hostname !== 'localhost' && !window.isSecureContext) {
      setError("App requires HTTPS. Please check your URL.");
      setIsLoading(false);
      return;
    }

    // 2. Check Browser Support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported on this browser.");
      setIsLoading(false);
      return;
    }

    try {
      const constraints = {
        video: { facingMode: facingMode },
        audio: false
      };

      let stream: MediaStream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        console.warn(`Failed with facingMode: ${facingMode}, trying fallback...`, err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (!mountedRef.current) return;
          try {
            await videoRef.current?.play();
            setIsReady(true);
            setIsLoading(false);
          } catch (playError) {
            console.error("Play failed:", playError);
            setError("Tap 'Retake' to enable camera access");
            setIsLoading(false);
          }
        };
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      if (!mountedRef.current) return;
      setIsLoading(false);
      setError("Camera permission denied or not found.");
    }
  }, [facingMode, stopCamera]);

  // Handle Visibility Change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else {
        setTimeout(() => {
            if (mountedRef.current) startCamera();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startCamera, stopCamera]);

  // Initial Mount
  useEffect(() => {
    mountedRef.current = true;
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    if (mode === 'qr') return; // Capture is automatic in QR mode

    if (videoRef.current && canvasRef.current && isReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return; 

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        onCapture(imageData, 'image');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        stopCamera();
        onCapture(result, 'image');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between h-[100dvh]">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onCancel} className="text-white p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 active:bg-white/20">
          <X size={24} />
        </button>
        <button 
          onClick={toggleCamera} 
          className="text-white flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 active:bg-white/20"
        >
          <SwitchCamera size={16} />
          <span className="text-xs font-medium">Flip</span>
        </button>
      </div>

      {/* Main Viewfinder Area */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-20 bg-gray-900">
            <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
            <p>Initializing Camera...</p>
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 p-8 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Camera Issue</h3>
            <p className="text-gray-400 mb-8 max-w-xs text-sm">{error}</p>
            <button 
              onClick={startCamera}
              className="w-full max-w-xs bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-700"
            >
              <Camera size={20} />
              Retry Camera
            </button>
          </div>
        ) : (
          /* Video Feed */
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Guidelines Overlay */}
            {isReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`
                    border border-white/30 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300
                    ${mode === 'card' ? 'w-[85%] aspect-[1.586/1] max-w-md' : 'w-[70%] aspect-square max-w-sm'}
                  `}>
                  {/* Corners */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 -mt-0.5 -ml-0.5 rounded-tl-sm ${mode === 'card' ? 'border-blue-500' : 'border-green-500'}`}></div>
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 -mt-0.5 -mr-0.5 rounded-tr-sm ${mode === 'card' ? 'border-blue-500' : 'border-green-500'}`}></div>
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 -mb-0.5 -ml-0.5 rounded-bl-sm ${mode === 'card' ? 'border-blue-500' : 'border-green-500'}`}></div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 -mb-0.5 -mr-0.5 rounded-br-sm ${mode === 'card' ? 'border-blue-500' : 'border-green-500'}`}></div>
                  
                  {/* QR Scan Line */}
                  {mode === 'qr' && (
                     <div className="absolute left-0 right-0 h-0.5 bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-[scan_2s_ease-in-out_infinite] top-1/2"></div>
                  )}
                </div>
                <div className="absolute bottom-32 text-white/90 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-white/10">
                  {mode === 'card' ? 'Align card within frame' : 'Scan QR Code'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-black/90 p-4 pb-safe-bottom backdrop-blur-lg border-t border-white/10 z-10 flex flex-col gap-4">
        
        {/* Mode Toggle */}
        <div className="flex justify-center">
           <div className="bg-gray-800/80 p-1 rounded-full flex gap-1 border border-white/10">
              <button 
                onClick={() => setMode('card')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${mode === 'card' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                Card Scanner
              </button>
              <button 
                onClick={() => setMode('qr')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${mode === 'qr' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                <QrCode size={14} />
                QR Code
              </button>
           </div>
        </div>

        <div className="flex justify-around items-center px-2 pb-2">
          <label className={`text-white/60 flex flex-col items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider cursor-pointer active:text-white transition-colors ${mode === 'qr' ? 'opacity-0 pointer-events-none' : ''}`}>
             <div className="p-3 bg-white/10 rounded-full mb-1">
              <Upload size={20} />
             </div>
             Upload
             <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={mode === 'qr'} />
          </label>

          {mode === 'card' ? (
            <button 
              onClick={handleCapture}
              disabled={!isReady || !!error}
              className={`relative w-20 h-20 rounded-full border-[5px] flex items-center justify-center transition-all duration-200 
                ${(!isReady || error) ? 'border-gray-600 opacity-50 cursor-not-allowed' : 'border-white hover:scale-105 active:scale-95 active:border-blue-400'}`}
            >
              <div className={`w-16 h-16 bg-white rounded-full transition-colors ${(!isReady || error) ? 'bg-gray-500' : 'bg-white'}`}></div>
            </button>
          ) : (
            <div className="w-20 h-20 flex items-center justify-center">
               <div className="text-white/50 text-xs font-medium text-center">Auto-Scan Active</div>
            </div>
          )}

          <button 
            onClick={startCamera} 
            disabled={isLoading}
            className="text-white/60 flex flex-col items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider active:text-white transition-colors disabled:opacity-50"
          >
            <div className="p-3 bg-white/10 rounded-full mb-1">
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </div>
            Retake
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-50px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  );
};

export default CameraCapture;