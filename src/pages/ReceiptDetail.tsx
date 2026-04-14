import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { ReceiptWithWarranties, Receipt, WarrantyItem } from '../types/database';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Calendar, Trash2, Camera, Home, Download, X } from 'lucide-react';
import { ExpiryCountdown } from '../components/warranty/ExpiryCountdown';
import { CATEGORIES } from '../constants/categories';
import { formatCurrency } from '../lib/currency';

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<ReceiptWithWarranties | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id || !user) return;
      try {
        const receiptRef = doc(db, 'users', user.uid, 'receipts', id);
        const receiptSnap = await getDoc(receiptRef);
        
        if (receiptSnap.exists()) {
          const receiptData = { id: receiptSnap.id, ...receiptSnap.data() } as Receipt;
          
          const warrantiesRef = collection(db, 'users', user.uid, 'warranty_items');
          const q = query(warrantiesRef, where('receiptId', '==', id));
          const wSnapshot = await getDocs(q);
          const warranties = wSnapshot.docs.map(wDoc => ({ id: wDoc.id, ...wDoc.data() } as WarrantyItem));
          
          setReceipt({ ...receiptData, warranty_items: warranties });
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id, user]);

  const handleDelete = async () => {
    if (!receipt || !user) return;
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'receipts', receipt.id));
      navigate('/');
    }
  };

  const handleAddToCalendar = () => {
    if (!receipt || !receipt.warranty_items || receipt.warranty_items.length === 0) {
      alert("No warranty information found to add to calendar.");
      return;
    }
    
    const warranty = receipt.warranty_items[0];
    const title = encodeURIComponent(`${receipt.merchantName} - ${warranty.productName} Warranty Expiry`);
    const details = encodeURIComponent(`Warranty expires for ${warranty.productName} purchased from ${receipt.merchantName}.`);
    
    const date = new Date(warranty.warrantyEnd);
    const start = date.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const end = endDate.toISOString().split('T')[0].replace(/-/g, '');
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
    window.open(url, '_blank');
  };

  const handleDownloadImage = async () => {
    if (!receipt?.imageUrl) return;
    try {
      const response = await fetch(receipt.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.merchantName.replace(/\s+/g, '-').toLowerCase()}-${new Date(receipt.purchaseDate).toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback if fetch fails (e.g., CORS issues)
      window.open(receipt.imageUrl, '_blank');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!receipt) return <div className="p-8 text-center">Receipt not found</div>;

  const category = CATEGORIES.find(c => c.id === receipt.category) || CATEGORIES[CATEGORIES.length - 1];
  const warranty = receipt.warranty_items?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:text-gray-900">
              <Home className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-lg font-bold text-gray-900 truncate px-4">{receipt.merchantName}</h1>
          <button onClick={handleDelete} className="p-2 -mr-2 text-red-500 hover:text-red-600">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        {/* Image */}
        <div 
          className="w-full h-64 bg-gray-200 relative cursor-pointer"
          onClick={() => setIsImageModalOpen(true)}
        >
          <img 
            src={receipt.imageUrl || 'https://picsum.photos/seed/receipt/800/600'} 
            alt="Receipt" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/receipt/800/600';
            }}
          />
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
            Tap to expand
          </div>
        </div>

        <div className="p-4 space-y-6 -mt-6 relative z-10">
          {/* Main Info Card */}
          <Card className="p-6 shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{receipt.merchantName}</h2>
                <p className="text-gray-500 mt-1">{new Date(receipt.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(receipt.totalAmount, receipt.currency)}
              </div>
            </div>
          </Card>

          {/* Warranty Card */}
          {warranty && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Warranty Status</h3>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full uppercase tracking-wider">
                  {warranty.warrantySource}
                </span>
              </div>
              
              <ExpiryCountdown warrantyEnd={warranty.warrantyEnd} />
              
              <div className="mt-6 flex justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
                <div>
                  <div className="font-medium text-gray-900">Starts</div>
                  <div>{new Date(warranty.warrantyStart).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">Ends</div>
                  <div>{new Date(warranty.warrantyEnd).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full gap-2" onClick={handleAddToCalendar}>
              <Calendar className="w-4 h-4" /> Add to Calendar
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Camera className="w-4 h-4" /> Scan Warranty
            </Button>
          </div>
          
          <Button 
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-sm" 
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </main>

      {/* Full Size Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <button 
              onClick={() => setIsImageModalOpen(false)}
              className="p-2 text-white/70 hover:text-white bg-black/50 rounded-full backdrop-blur-md"
            >
              <X className="w-6 h-6" />
            </button>
            <button 
              onClick={handleDownloadImage}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <img 
              src={receipt.imageUrl || 'https://picsum.photos/seed/receipt/800/600'} 
              alt="Receipt Full Size" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
