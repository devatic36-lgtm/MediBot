import React, { useState, useRef } from 'react';
import { Camera, Upload, X, ImageIcon, Sparkles, AlertCircle } from 'lucide-react';

interface PillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeImage: (imageBase64: string) => void;
  language?: 'en' | 'ar';
}

const PRESET_SAMPLES = [
  {
    title: 'Oval White Pill (M367)',
    description: 'Hydrocodone / Acetaminophen 10mg/325mg sample',
    imprint: 'M367',
    colorShape: 'White / Oval',
    sampleType: 'M367'
  },
  {
    title: 'Round Yellow Pill (IP 109)',
    description: 'Hydrocodone / Acetaminophen 5mg/325mg sample',
    imprint: 'IP 109',
    colorShape: 'Yellow / Round',
    sampleType: 'IP109'
  }
];

export const PillScannerModal: React.FC<PillScannerModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeImage,
  language = 'en',
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please upload an image file instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  const generateSamplePillImage = (imprint: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#05070A';
    ctx.fillRect(0, 0, 400, 300);

    ctx.strokeStyle = 'rgba(0, 209, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 400; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 300);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0, 209, 255, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 4;

    if (imprint === 'M367') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(120, 100, 160, 100, 50);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(200, 110);
      ctx.lineTo(200, 190);
      ctx.stroke();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M367', 200, 150);
    } else {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(200, 150, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('IP 109', 200, 150);
    }
    ctx.restore();

    return canvas.toDataURL('image/jpeg');
  };

  const handleSelectSample = (imprint: string, color: string) => {
    const sampleBase64 = generateSamplePillImage(imprint, color);
    setSelectedImage(sampleBase64);
  };

  const handleAnalyze = () => {
    if (!selectedImage) return;
    onAnalyzeImage(selectedImage);
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel-glow rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-xl border border-slate-200 relative overflow-hidden max-h-[92dvh] flex flex-col justify-between bg-white text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse min-w-0">
            <div className="p-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl font-bold shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {language === 'ar' ? 'الماسح الضوئي لأقراص الدواء' : 'AI Pill Photo Identifier'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                {language === 'ar' ? 'قم برفع صورة الدواء للتحليل بالرؤية الحاسوبية' : 'Upload a pill photo or Rx label for instant vision verification'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (stopCamera(), onClose())}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-3 sm:py-4 overflow-y-auto space-y-3 sm:space-y-4">
          {/* Camera View / Image Preview / Dropzone */}
          {isCameraActive ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-5 py-2.5 bg-teal-600 text-white font-bold rounded-full text-xs shadow-lg hover:bg-teal-700 flex items-center space-x-1.5 min-h-[44px] touch-manipulation"
              >
                <Camera className="w-4 h-4" />
                <span>{language === 'ar' ? 'التقاط الصورة' : 'Snap Photo'}</span>
              </button>
            </div>
          ) : selectedImage ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-56 sm:max-h-64 flex items-center justify-center">
              <img src={selectedImage} alt="Pill preview" className="max-h-56 sm:max-h-64 object-contain" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 bg-slate-900/80 text-white hover:bg-rose-600 rounded-full transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Change Image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-teal-200 rounded-2xl p-5 sm:p-8 text-center bg-teal-50/30 hover:bg-teal-50/60 transition">
              <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {language === 'ar' ? 'اختر أو التقط صورة لقرص الدواء أو العبوة' : 'Upload a photo of your pill or bottle label'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 mb-3">PNG, JPG, WEBP up to 10MB</p>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <label className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl cursor-pointer shadow-xs inline-flex items-center space-x-1.5 min-h-[44px] touch-manipulation">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>{language === 'ar' ? 'تصفح الملفات' : 'Choose File'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center space-x-1.5 min-h-[44px] touch-manipulation"
                >
                  <Camera className="w-4 h-4" />
                  <span>{language === 'ar' ? 'استخدام الكاميرا' : 'Use Camera'}</span>
                </button>
              </div>
            </div>
          )}

          {!selectedImage && !isCameraActive && (
            <div>
              <span className="text-xs font-semibold text-slate-600 block mb-2">Or test with a sample pill image:</span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample.imprint, sample.colorShape)}
                    className="p-2.5 bg-slate-50 border border-slate-200 hover:border-teal-500 rounded-xl text-left text-xs hover:bg-teal-50/40 transition"
                  >
                    <span className="font-bold text-slate-900 block">{sample.title}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Safety Note:</strong> Visual identification is an aid. Always confirm unknown medications with a licensed pharmacist before taking.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2 rtl:space-x-reverse">
          <button
            type="button"
            onClick={() => (stopCamera(), onClose())}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[42px] touch-manipulation"
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedImage}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 rtl:space-x-reverse shadow-xs min-h-[42px] touch-manipulation ${
              selectedImage
                ? 'bg-teal-600 hover:bg-teal-700 text-white font-extrabold shadow-sm active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{language === 'ar' ? 'تحليل بواسطة MediBot' : 'Analyze with MediBot'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

