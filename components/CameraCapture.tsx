import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Upload, AlertCircle, Loader2, Camera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef<boolean>(true);
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  const stopCamera = useCallback(() => {
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

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    
    stopCamera();
    setError('');
    setIsLoading(true);
    setIsReady(false);

    // 1. Check for Secure Context (HTTPS)
    if (window.location.hostname !== 'localhost' && !window.isSecureContext) {
      setError("Camera requires HTTPS. Please deploy to Vercel/Netlify.");
      setIsLoading(false);
      return;
    }

    // 2. Check Browser Support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera API not supported.");
      setIsLoading(false);
      return;
    }

    try {
      let stream: MediaStream;

      // 3. Attempt simple environment camera (Android compatible)
      // We removed specific width/height constraints as they cause OverconstrainedError on many Androids
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment'
          },
          audio: false
        });
      } catch (err) {
        console.warn("Environment camera failed, falling back...", err);
        // 4. Fallback: Get ANY video device
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        });
      }
      
      if (!mountedRef.current) {
        // Component unmounted while we were asking for camera
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          if (!mountedRef.current) return;
          try {
            await videoRef.current?.play();
            setIsReady(true);
            setIsLoading(false);
          } catch (playError) {
            console.error("Play failed:", playError);
            // Some browsers require user interaction to play video
            setError("Tap 'Retake' to start camera");
            setIsLoading(false);
          }
        };
      }
    } catch (err: any) {
      console.error("Camera Error:", err);
      if (!mountedRef.current) return;
      setIsLoading(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera found.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera in use by another app.");
      } else if (err.name === 'OverconstrainedError') {
        setError("Camera resolution not supported.");
      } else {
        setError("Could not start camera.");
      }
    }
  }, [stopCamera]);

  // Handle Lifecycle
  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && isReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video actual size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        stopCamera();
        onCapture(imageData);
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
        onCapture(result);
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
        <span className="text-white/90 font-medium text-sm tracking-wide px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
          Scan Business Card
        </span>
        <div className="w-10"></div>
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
            
            <label className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-colors mb-3">
              <Upload size={20} />
              Upload Photo Instead
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>

            <button 
              onClick={startCamera}
              className="w-full max-w-xs bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors border border-gray-700"
            >
              <Camera size={20} />
              Try Starting Camera Again
            </button>
          </div>
        ) : (
          /* Video Feed */
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted // Critical for mobile auto-play
              className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Guidelines Overlay */}
            {isReady && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[85%] aspect-[1.586/1] max-w-md border border-white/30 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5 rounded-tl-sm"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5 rounded-tr-sm"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5 rounded-bl-sm"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5 rounded-br-sm"></div>
                </div>
                <div className="absolute bottom-24 text-white/90 text-sm font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm border border-white/10">
                  Align card within frame
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-black/90 p-6 pb-8 pb-safe-bottom flex justify-around items-center backdrop-blur-lg border-t border-white/10 z-10">
        <label className="text-white/60 flex flex-col items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider cursor-pointer active:text-white transition-colors">
           <div className="p-3 bg-white/10 rounded-full mb-1">
            <Upload size={20} />
           </div>
           Upload
           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        <button 
          onClick={handleCapture}
          disabled={!isReady || !!error}
          className={`relative w-20 h-20 rounded-full border-[5px] flex items-center justify-center transition-all duration-200 
            ${(!isReady || error) ? 'border-gray-600 opacity-50 cursor-not-allowed' : 'border-white hover:scale-105 active:scale-95 active:border-blue-400'}`}
        >
          <div className={`w-16 h-16 bg-white rounded-full transition-colors ${(!isReady || error) ? 'bg-gray-500' : 'bg-white'}`}></div>
        </button>

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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;