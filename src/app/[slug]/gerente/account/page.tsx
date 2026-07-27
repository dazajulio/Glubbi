'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Upload, AlertCircle, Camera, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AccountConfigPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState('');
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [businessType, setBusinessType] = useState<'formal' | 'informal' | ''>('');
  const [kycStatus, setKycStatus] = useState('unverified');
  
  // KYC Files (For MVP, we just store strings as mock URLs or upload them)
  const [doc1, setDoc1] = useState<File | null>(null);
  const [doc2, setDoc2] = useState<File | null>(null);
  const [livenessImage, setLivenessImage] = useState<string | null>(null);
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
    });
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (data) {
        setRestaurant(data);
        setKycStatus(data.kyc_status || 'unverified');
        setBusinessType(data.business_type || '');
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const startCamera = async () => {
    setShowCamera(true);
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied or not available", err);
      setCameraError(true);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setLivenessImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    // Fake upload for MVP. In real life, we would use Supabase Storage to upload doc1, doc2, livenessImage
    const supabase = createClient();
    
    // Simulate updating the DB
    await supabase.from('restaurants').update({
      business_type: businessType,
      kyc_status: 'pending_review',
      kyc_documents: {
        doc1: 'uploaded_doc1.pdf',
        doc2: 'uploaded_doc2.jpg',
        liveness: livenessImage ? 'captured_liveness.jpg' : null
      }
    }).eq('id', restaurant.id);
    
    setKycStatus('pending_review');
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Cargando...</div>;
  }

  // QR Code URL if PC has no camera
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://glubbi.app/kyc-mobile/${restaurant?.id}`)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-orange-500" /> Configuración y Seguridad de la Cuenta
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Para garantizar la seguridad de nuestra comunidad y proteger tu marca contra el fraude, requerimos validar tu identidad antes de encender tus ventas públicas.
        </p>
      </div>

      {kycStatus === 'verified' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-3xl flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div>
            <h3 className="font-bold text-green-900">Cuenta Verificada Exitosamente</h3>
            <p className="text-sm text-green-700">Tu restaurante ya es público y puede recibir pedidos.</p>
          </div>
        </div>
      )}

      {kycStatus === 'pending_review' && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <div>
            <h3 className="font-bold text-amber-900">Validación en Progreso</h3>
            <p className="text-sm text-amber-700">El equipo de Glubbi está revisando tus documentos. Te notificaremos en menos de 24 horas.</p>
          </div>
        </div>
      )}

      {kycStatus === 'unverified' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-8">
          
          {/* Step 1: Business Type */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">1. Tipo de Negocio</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button 
                onClick={() => setBusinessType('formal')}
                className={`p-4 rounded-xl border text-left transition-all ${businessType === 'formal' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-orange-200'}`}
              >
                <div className="font-bold text-gray-900">Empresa Formal Registrada</div>
                <div className="text-xs text-gray-500 mt-1">Tengo registro mercantil, RIF/RUT comercial.</div>
              </button>
              <button 
                onClick={() => setBusinessType('informal')}
                className={`p-4 rounded-xl border text-left transition-all ${businessType === 'informal' ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20' : 'border-gray-200 hover:border-orange-200'}`}
              >
                <div className="font-bold text-gray-900">Emprendedor / Dark Kitchen</div>
                <div className="text-xs text-gray-500 mt-1">Soy persona natural operando un negocio.</div>
              </button>
            </div>
          </div>

          {/* Step 2: Documents */}
          {businessType && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900">2. Carga de Documentos</h3>
              
              {businessType === 'formal' ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <div className="text-sm font-bold text-gray-700">Acta Constitutiva (PDF)</div>
                    <input type="file" onChange={(e) => setDoc1(e.target.files?.[0] || null)} className="text-xs" />
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <div className="text-sm font-bold text-gray-700">RIF / RUT Empresa</div>
                    <input type="file" onChange={(e) => setDoc2(e.target.files?.[0] || null)} className="text-xs" />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <div className="text-sm font-bold text-gray-700">Cédula o Pasaporte</div>
                    <input type="file" onChange={(e) => setDoc1(e.target.files?.[0] || null)} className="text-xs" />
                  </div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                    <div className="text-sm font-bold text-gray-700">Recibo de Servicio / Prueba de Local</div>
                    <input type="file" onChange={(e) => setDoc2(e.target.files?.[0] || null)} className="text-xs" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Liveness */}
          {businessType && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-gray-900">3. Prueba de Vida (Liveness)</h3>
              <p className="text-xs text-gray-500">Necesitamos una selfie en tiempo real del representante legal para validar la identidad.</p>
              
              {!livenessImage ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                  {showCamera ? (
                    <div className="flex flex-col items-center space-y-4">
                      <video ref={videoRef} autoPlay playsInline className="w-64 h-64 object-cover rounded-full shadow-lg border-4 border-white"></video>
                      <button onClick={takePhoto} className="bg-orange-500 text-white font-bold py-2 px-6 rounded-full">
                        Tomar Foto
                      </button>
                    </div>
                  ) : cameraError ? (
                    <div className="flex flex-col md:flex-row items-center gap-6 justify-center text-center md:text-left">
                      <div className="space-y-2">
                        <XCircle className="w-8 h-8 text-red-500 mx-auto md:mx-0" />
                        <h4 className="font-bold text-gray-900">No se detectó cámara web</h4>
                        <p className="text-xs text-gray-500 max-w-xs">Escanea este código QR con tu celular para tomarte la foto. Se sincronizará automáticamente aquí.</p>
                      </div>
                      <img src={qrUrl} alt="QR Code" className="w-32 h-32 rounded-xl shadow-sm border border-gray-200" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                      <Camera className="w-12 h-12 text-gray-300" />
                      <button onClick={startCamera} className="bg-slate-900 text-white font-bold py-2 px-6 rounded-full">
                        Activar Cámara
                      </button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-green-50 p-4 rounded-xl border border-green-200">
                  <img src={livenessImage} alt="Selfie" className="w-16 h-16 rounded-full object-cover border-2 border-green-500" />
                  <div>
                    <h4 className="font-bold text-green-900">Selfie capturada con éxito</h4>
                    <button onClick={() => setLivenessImage(null)} className="text-xs text-green-700 underline">Volver a tomar</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          {businessType && doc1 && doc2 && livenessImage && (
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSubmit}
                className="bg-orange-500 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 hover:bg-orange-600 transition-colors"
              >
                Enviar a Validación <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
