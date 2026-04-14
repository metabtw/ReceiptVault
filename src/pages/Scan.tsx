import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { extractReceiptDataFromImage, inferWarrantyPeriod } from '../lib/gemini';
import { Button } from '../components/ui/Button';
import { Camera, Image as ImageIcon, X, Loader2, Edit2 } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

export default function Scan() {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const [step, setStep] = useState<'capture' | 'processing' | 'review'>('capture');
  const [formData, setFormData] = useState<any>({});
  
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) setImageSrc(imageSrc);
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!imageSrc || !user) return;
    setStep('processing');
    setError(null);

    try {
      const extractedData = await extractReceiptDataFromImage(imageSrc);
      
      let pDate = extractedData?.purchaseDate || new Date().toISOString().split('T')[0];
      // Fallback if AI still returns future date
      if (new Date(pDate) > new Date()) {
        pDate = new Date().toISOString().split('T')[0];
      }

      setFormData({
        merchantName: extractedData?.merchantName || '',
        purchaseDate: pDate,
        totalAmount: extractedData?.totalAmount || 0,
        currency: extractedData?.currency || 'USD',
        category: extractedData?.category || 'Other',
        rawOcrText: extractedData?.rawOcrText || '',
      });
      
      setStep('review');
    } catch (err: any) {
      console.error(err);
      // Fallback to manual entry
      setFormData({
        merchantName: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        totalAmount: 0,
        currency: 'USD',
        category: 'Other',
        rawOcrText: '',
      });
      setStep('review');
    }
  };

  const handleSave = async () => {
    if (!imageSrc || !user) return;
    setStep('processing');
    try {
      // Infer warranty based on reviewed data
      const warrantyData = await inferWarrantyPeriod(
        formData.merchantName || 'Unknown Product', 
        formData.category
      );

      const receiptData = {
        userId: user.uid,
        merchantName: formData.merchantName || 'Unknown Merchant',
        purchaseDate: formData.purchaseDate,
        totalAmount: Number(formData.totalAmount) || 0,
        currency: formData.currency,
        category: formData.category,
        imageUrl: imageSrc,
        rawOcrText: formData.rawOcrText,
        createdAt: new Date().toISOString(),
      };

      const receiptRef = await addDoc(collection(db, 'users', user.uid, 'receipts'), receiptData);

      if (warrantyData) {
        const warrantyItemData = {
          receiptId: receiptRef.id,
          userId: user.uid,
          productName: formData.merchantName || 'Unknown Product',
          warrantyStart: receiptData.purchaseDate,
          warrantyEnd: warrantyData.warrantyEnd,
          warrantySource: 'inferred',
          notes: warrantyData.reasoning,
          notified30d: false,
          notified7d: false,
          notified1d: false,
        };
        await addDoc(collection(db, 'users', user.uid, 'warranty_items'), warrantyItemData);
      }

      navigate(`/receipt/${receiptRef.id}`);
    } catch (err: any) {
      setError(err.message);
      setStep('review');
    }
  };

  if (step === 'processing') {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-semibold">Analyzing Receipt...</h2>
        <p className="text-gray-400 mt-2">Extracting merchant, total, and warranty info.</p>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 flex justify-between items-center">
          <button onClick={() => setStep('capture')} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Review Details</h1>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start gap-2">
            <Edit2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Please review the extracted information. You can edit any incorrect fields before saving.</p>
          </div>

          <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
              <input 
                type="text" 
                value={formData.merchantName} 
                onChange={e => setFormData({...formData, merchantName: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input 
                type="date" 
                value={formData.purchaseDate} 
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.totalAmount} 
                  onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input 
                  type="text" 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  maxLength={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </main>

        <div className="p-4 bg-white border-t border-gray-200">
          <Button className="w-full py-3 text-lg" onClick={handleSave}>
            Save Receipt
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-white rounded-full bg-black/20 backdrop-blur-md">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt="Captured receipt" className="w-full h-full object-contain" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay Guide */}
        {!imageSrc && (
          <div className="absolute inset-0 pointer-events-none border-[2px] border-white/30 m-8 rounded-2xl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 text-sm font-medium">
              Align receipt within frame
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-black pb-8 pt-6 px-6">
        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {imageSrc ? (
          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => setImageSrc(null)}>
              Retake
            </Button>
            <Button className="flex-1" onClick={processImage}>
              Analyze
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />

            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"
            >
              <div className="w-16 h-16 bg-white rounded-full active:scale-90 transition-transform" />
            </button>

            <div className="w-12 h-12" /> {/* Spacer for centering */}
          </div>
        )}
      </div>
    </div>
  );
}
