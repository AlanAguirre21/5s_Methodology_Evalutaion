import { useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, SendHorizontal } from 'lucide-react';
import Avatar from './Avatar.jsx';
import MenuOption from '../MenuOption.jsx';
import CameraModal from './CameraModal.jsx';

const PHOTO_MAX_SIDE = 1280;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function toPhotoDataUrl(source, width, height) {
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

async function fileToPhotoDataUrl(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    return toPhotoDataUrl(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

const canUseCamera = () => Boolean(navigator.mediaDevices?.getUserMedia);

export default function PhotoReply({ onSend, disabled }) {
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  function openCamera() {
    setError(null);
    if (canUseCamera()) return setCameraOpen(true);
    if (!window.isSecureContext) {
      setError('El navegador solo permite abrir la cámara en conexiones seguras (HTTPS). Se abrirá el selector del dispositivo.');
    }
    cameraRef.current.click();
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) return setError('El archivo debe ser una imagen.');
    if (file.size > MAX_FILE_SIZE) return setError('La imagen no puede pesar más de 25 MB.');

    try {
      setPhoto(await fileToPhotoDataUrl(file));
    } catch {
      setError('No se pudo leer la imagen. Prueba con un archivo JPG o PNG.');
    }
  }

  return (
    <div className="flex items-end justify-start gap-2">
      <Avatar size={26} />
      <div className="glass neu-raised min-w-[220px] max-w-[78%] rounded-2xl rounded-bl-sm border border-white/60 bg-white/65 p-1.5">
        {photo ? (
          <>
            <img src={photo} alt="Vista previa de la foto" className="mb-1.5 max-h-64 w-full rounded-xl object-cover" />
            <MenuOption icon={<SendHorizontal size={16} />} color="success" onClick={() => onSend(photo)} disabled={disabled}>
              Enviar foto
            </MenuOption>
            <MenuOption icon={<RotateCcw size={16} />} onClick={() => setPhoto(null)} disabled={disabled}>
              Elegir otra
            </MenuOption>
          </>
        ) : (
          <>
            <MenuOption icon={<Camera size={16} />} onClick={openCamera} disabled={disabled}>
              Tomar foto
            </MenuOption>
            <MenuOption icon={<ImagePlus size={16} />} onClick={() => fileRef.current.click()} disabled={disabled}>
              Subir desde el dispositivo
            </MenuOption>
          </>
        )}
        {error && <p role="alert" className="px-3 pb-1 pt-0.5 text-xs text-danger">{error}</p>}
      </div>

      <CameraModal
        open={cameraOpen}
        toDataUrl={toPhotoDataUrl}
        onClose={() => setCameraOpen(false)}
        onCapture={p => { setPhoto(p); setCameraOpen(false); }}
      />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
    </div>
  );
}
