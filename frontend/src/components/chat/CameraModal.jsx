import { useEffect, useRef, useState } from 'react';
import { Camera, SwitchCamera, X } from 'lucide-react';
import Button from '../Button.jsx';
import StatusMessage from '../StatusMessage.jsx';

const ERRORS = {
  NotAllowedError:  'Permiso de cámara denegado. Actívalo en la configuración del navegador para este sitio e inténtalo de nuevo.',
  NotFoundError:    'No se encontró ninguna cámara en este dispositivo.',
  NotReadableError: 'La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.',
};

export default function CameraModal({ open, onCapture, onClose, toDataUrl }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    let stream;
    let active = true;
    setReady(false);
    setError(null);

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false })
      .then(s => {
        if (!active) return s.getTracks().forEach(t => t.stop());
        stream = s;
        video.srcObject = s;
      })
      .catch(e => { if (active) setError(ERRORS[e.name] ?? 'No se pudo abrir la cámara.'); });

    return () => {
      active = false;
      stream?.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    };
  }, [open, facingMode]);

  function capture() {
    const video = videoRef.current;
    onCapture(toDataUrl(video, video.videoWidth, video.videoHeight));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="camera-modal-title"
      onCancel={e => { e.preventDefault(); onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-panel border border-white/60 bg-surface p-0 text-text shadow-2xl
        backdrop:bg-black/30 backdrop:backdrop-blur-sm"
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id="camera-modal-title" className="font-semibold text-text">Tomar foto</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 text-text-muted hover:bg-black/5 hover:text-text">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-control bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setReady(true)}
            className={`max-h-[60vh] w-full object-contain ${facingMode === 'user' ? '-scale-x-100' : ''}`}
          />
        </div>
        {!ready && !error && <p className="mt-2 text-xs text-text-muted">Abriendo la cámara… Si el navegador lo pide, permite el acceso.</p>}
        {error && <div className="mt-3"><StatusMessage error={error} /></div>}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={() => setFacingMode(m => (m === 'environment' ? 'user' : 'environment'))} disabled={!ready}>
            <SwitchCamera size={16} /> Cambiar cámara
          </Button>
          <Button variant="primary" onClick={capture} disabled={!ready}>
            <Camera size={16} /> Capturar
          </Button>
        </div>
      </div>
    </dialog>
  );
}
