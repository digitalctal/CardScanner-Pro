import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Unable to access camera. Please allow camera permissions or use the upload button.");
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]); // Removed 'stream' from deps to avoid loop, though cleanup handles it.

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Stop stream before proceeding
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
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
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        onCapture(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onCancel} className="text-white p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <X size={24} />
        </button>
        <h2 className="text-white font-medium">Scan Visiting Card</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-6">
            <p className="mb-4 text-red-400">{error}</p>
            <label className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center gap-2">
              <Upload size={20} />
              Upload Image Instead
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 md:w-80 md:h-48 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black p-6 pb-8 flex justify-around items-center">
        <label className="text-white/80 flex flex-col items-center gap-1 text-xs cursor-pointer">
           <div className="p-3 bg-gray-800 rounded-full">
            <Upload size={24} />
           </div>
           <span>Upload</span>
           <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        <button 
          onClick={handleCapture}
          disabled={!!error || !hasPermission}
          className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center ${error ? 'opacity-50 grayscale' : 'opacity-100'}`}
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>

        <button onClick={startCamera} className="text-white/80 flex flex-col items-center gap-1 text-xs">
          <div className="p-3 bg-gray-800 rounded-full">
            <RefreshCw size={24} />
          </div>
          <span>Retake</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
