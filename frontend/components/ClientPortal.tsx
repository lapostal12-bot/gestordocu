import React, { useState, useRef } from 'react';
import { Client, AppDocument } from '../types';
import { 
  UploadCloud, 
  Camera, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ShieldCheck,
  X,
  LogOut,
  Lock
} from 'lucide-react';

interface ClientPortalProps {
  client: Client;
  documents: AppDocument[];
  onUploadDocument: (newDoc: Omit<AppDocument, 'id' | 'uploadedAt' | 'auditLogs'>) => Promise<void>;
  onLogout: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  client,
  documents,
  onUploadDocument,
  onLogout
}) => {
  const [selectedEstablishment, setSelectedEstablishment] = useState(client.establishments[0] || 'Principal');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Estados de cámara en vivo
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Filtrado estricto: el cliente SOLO ve sus propios documentos recibidos
  const myDocs = documents.filter(d => d.clientId === client.id);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      alert('No se pudo acceder a la cámara. Por favor comprueba los permisos de tu navegador o dispositivo.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();

    setIsUploading(true);
    try {
      await onUploadDocument({
        clientId: client.id,
        clientName: client.commercialName,
        establishment: selectedEstablishment,
        uploadedBy: client.contactPerson,
        originalFilename: `foto_albaran_${new Date().toISOString().substring(0, 10)}_${Math.floor(100 + Math.random() * 900)}.jpg`,
        fileType: 'image/jpeg',
        fileSize: 1024 * 450,
        status: 'PENDING_REVIEW',
        docType: 'ALBARAN',
        fileData: base64Image
      });
      setUploadSuccessMessage('¡Foto del albarán enviada con éxito! Está en cola de revisión.');
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    } catch (err) {
      alert('Error al subir el documento.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        await onUploadDocument({
          clientId: client.id,
          clientName: client.commercialName,
          establishment: selectedEstablishment,
          uploadedBy: client.contactPerson,
          originalFilename: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          status: 'PENDING_REVIEW',
          docType: 'ALBARAN',
          fileData: base64
        });
      }
      setUploadSuccessMessage(`¡${files.length} documento(s) subido(s) correctamente!`);
      setTimeout(() => setUploadSuccessMessage(null), 5000);
    } catch (err) {
      alert('Error en el procesamiento de la subida.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner de Bienvenida del Cliente */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Espacio Privado Autenticado
              </span>
              <span className="text-xs text-slate-300 font-mono">{client.internalCode}</span>
            </div>
            <h1 className="text-2xl font-bold mt-1">{client.commercialName}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Envía tus albaranes y notas de entrega a la oficina central. Custodiamos cada archivo original.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Solo selecciona entre SUS PROPIOS establecimientos */}
            <div className="flex flex-col items-start sm:items-end gap-1 text-xs">
              <span className="text-slate-300">Tu establecimiento emisor:</span>
              <select
                value={selectedEstablishment}
                onChange={e => setSelectedEstablishment(e.target.value)}
                className="bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-1.5 text-white font-semibold text-xs focus:ring-2 focus:ring-emerald-400"
              >
                {client.establishments.map(est => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="mt-1 sm:mt-0 px-3 py-1.5 bg-slate-800/90 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {uploadSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Visor de Cámara en Vivo */}
      {cameraActive && (
        <div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700 text-center space-y-4">
          <div className="flex items-center justify-between text-white text-xs px-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              Enfoca el albarán en plano recto con buena iluminación
            </span>
            <button
              type="button"
              onClick={stopCamera}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black max-h-[460px] flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-[460px] object-cover" />
            <div className="absolute inset-4 border-2 border-emerald-400/50 border-dashed rounded-lg pointer-events-none"></div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Hacer Fotografía y Enviar</span>
            </button>
          </div>
        </div>
      )}

      {/* Zona de Envíos: Botones de Captura y Subida */}
      {!cameraActive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opción 1: Cámara Smartphone o Webcam */}
          <div 
            onClick={startCamera}
            className="p-6 bg-white rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all cursor-pointer shadow-sm text-center space-y-3 group"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hacer una Fotografía</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Usa la cámara de tu móvil o tablet para capturar el albarán al recibir el género.
              </p>
            </div>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              Abrir Cámara
            </span>
          </div>

          {/* Opción 2: Subir archivo o fotos existentes */}
          <label className="p-6 bg-white rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all cursor-pointer shadow-sm text-center space-y-3 group block">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Seleccionar Archivo o Galería</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admite PDF, JPG, PNG, CSV o Excel. Posibilidad de seleccionar varios archivos a la vez.
              </p>
            </div>
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
              Explorar Dispositivo
            </span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {isUploading && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center text-xs text-indigo-800 font-semibold animate-pulse">
          Subiendo y registrando documento en servidor seguro... Por favor espera.
        </div>
      )}

      {/* Historial de Documentos Recibidos de este cliente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Estado de Recepción de tus Documentos
            </h2>
            <p className="text-xs text-slate-500">
              Comprueba el estado de procesamiento de tus archivos.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {myDocs.length} archivo(s) entregados
          </span>
        </div>

        {myDocs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Aún no has enviado documentos desde este establecimiento. Utiliza los botones superiores para enviar tu primer albarán.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myDocs.map(doc => (
              <div key={doc.id} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{doc.originalFilename}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {doc.docType}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] flex items-center gap-3">
                    <span>Enviado: {doc.uploadedAt}</span>
                    <span>•</span>
                    <span>Local: {doc.establishment || 'Principal'}</span>
                    <span>•</span>
                    <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                  </div>
                </div>

                <div>
                  {doc.status === 'CONFIRMED' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Validado por Oficina
                    </span>
                  ) : doc.status === 'PENDING_REVIEW' ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Recibido (En revisión)
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs">
                      {doc.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota de confidencialidad */}
      <div className="p-4 bg-slate-100 rounded-xl text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Tus archivos están custodiados en un espacio privado. Ningún otro cliente puede acceder a tus documentos.</span>
      </div>
    </div>
  );
};
