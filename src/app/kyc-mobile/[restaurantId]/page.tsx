'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, ShieldCheck, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function KycMobilePage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const [restaurantId, setRestaurantId] = useState('');
  const [showCamera, setShowCamera] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    params.then(p => {
      setRestaurantId(p.restaurantId);
      startCamera();
    });
  }, [params]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const takePhotoAndUpload = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        // MVP: Just simulating the upload success
        // In reality: Convert to Blob, upload to Supabase Storage, update restaurant row
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        
        const supabase = createClient();
        await supabase.from('restaurants').update({
          kyc_documents: { liveness: 'uploaded_via_mobile' } // Realtime trigger for PC
        }).eq('id', restaurantId);

        stopCamera();
        setIsSuccess(true);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <CheckCircle2 className="w-20 h-20 text-green-500" />
        <h2 className="text-2xl font-bold text-white">¡Selfie Capturada!</h2>
        <p className="text-gray-400">La imagen ha sido enviada a tu computadora. Puedes cerrar esta pestaña.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4 flex items-center justify-center gap-2 bg-slate-900 border-b border-slate-800">
        <ShieldCheck className="w-5 h-5 text-orange-500" />
        <span className="font-bold text-white">Verificación de Identidad</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        <div className="w-full max-w-sm aspect-[3/4] rounded-full overflow-hidden border-4 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.3)] relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute inset-0 border-[10px] border-black/20 rounded-full pointer-events-none"></div>
        </div>
        
        <p className="text-gray-400 text-sm mt-8 text-center max-w-xs">
          Centra tu rostro en el óvalo y asegúrate de tener buena iluminación.
        </p>

        <button 
          onClick={takePhotoAndUpload}
          className="mt-8 bg-orange-500 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-4 border-orange-200 active:scale-95 transition-transform"
        >
          <Camera className="w-8 h-8" />
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
