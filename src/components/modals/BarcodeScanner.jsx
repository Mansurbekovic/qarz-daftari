import React, { useState, useEffect, useRef } from 'react';
import { playBeep } from '../../utils/helpers';
import { useToast } from '../../contexts/ToastContext';

export default function BarcodeScanner({ onScan, onClose }) {
  const { toast } = useToast();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const isScanningRef = useRef(true);

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      try {
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        // Check if torch/flashlight is supported
        const track = mediaStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }

        // Initialize Barcode Detector if available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix']
          });

          const interval = setInterval(async () => {
            if (!isScanningRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && isScanningRef.current) {
                const code = barcodes[0].rawValue;
                isScanningRef.current = false;
                playBeep('success');
                if (navigator.vibrate) navigator.vibrate(100);
                toast(`Skanerlandi: ${code}`);
                onScan(code);
                clearInterval(interval);
                onClose();
              }
            } catch (err) {
              // frame detection error ignore
            }
          }, 250);

          return () => clearInterval(interval);
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        setCameraError('Kameraga ulanib bo\'lmadi. Ruxsat berilganligini tekshiring yoki kodni qo\'lda kiriting.');
      }
    }

    startCamera();

    return () => {
      isScanningRef.current = false;
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onScan, onClose, toast]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (e) {
      toast('Chiroqni yoqish imkoni bo\'lmadi', 'warning');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeep('success');
    toast(`Kod kiritildi: ${manualCode.trim()}`);
    onScan(manualCode.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal scanner-modal" style={{ maxWidth: '520px', width: '95%' }}>
        <div className="modal-head">
          <h3>📷 Shtrix-kod Skaneri</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '16px' }}>
          {cameraError ? (
            <div className="camera-error-box" style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷⚠️</div>
              <p style={{ color: 'var(--rust, #D9534F)', fontSize: '14px', marginBottom: '16px' }}>
                {cameraError}
              </p>
            </div>
          ) : (
            <div className="scanner-viewfinder-container">
              <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
              <div className="scanner-overlay">
                <div className="scanner-frame">
                  <div className="scanner-laser"></div>
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <div className="scanner-instruction">
                  Shtrix-kod yoki QR kodni ramka ichiga to'g'rilang
                </div>
              </div>

              {hasTorch && (
                <button
                  type="button"
                  className={`btn-torch ${torchOn ? 'on' : ''}`}
                  onClick={toggleTorch}
                  title="Chiroq (Flashlight)"
                >
                  {torchOn ? '⚡ O\'chirish' : '💡 Chiroq'}
                </button>
              )}
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-sec)', marginBottom: '6px' }}>
              Yoki shtrix-kod raqamini qo'lda kiriting:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                placeholder="Masalan: 4780012345678"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                autoFocus={Boolean(cameraError)}
              />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                Qo'llash
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
