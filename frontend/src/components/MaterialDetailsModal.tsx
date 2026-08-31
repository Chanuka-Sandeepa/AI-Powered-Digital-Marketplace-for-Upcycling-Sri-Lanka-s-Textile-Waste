import React, { useState } from 'react';
import { X, MapPin, User as UserIcon, MessageSquare, AlertCircle } from 'lucide-react';
import API from '../services/api.js';
import type { Material, User } from '../types/index.js';

interface MaterialDetailsModalProps {
  material: Material | null;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginPrompt: () => void;
}

const MaterialDetailsModal: React.FC<MaterialDetailsModalProps> = ({ material, user, isOpen, onClose, onLoginPrompt }) => {
  const [inquiryText, setInquiryText] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !material) return null;

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      onLoginPrompt();
      return;
    }

    if (!inquiryText.trim()) {
      setError('Please enter a brief message for the seller.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post(`/materials/${material._id}/inquire`, { message: inquiryText });
      setSuccess(response.data?.message || 'Inquiry submitted successfully!');
      setInquiryText('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit your inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-zinc-600 shadow-sm backdrop-blur-sm hover:bg-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Left Column: Image */}
          <div className="relative h-64 md:h-full min-h-[300px] bg-zinc-100">
            <img
              src={material.imageUrl}
              alt={material.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-zinc-900 uppercase tracking-wider shadow-sm">
              {material.category}
            </div>
          </div>

          {/* Right Column: Info & Action */}
          <div className="flex flex-col p-6 max-h-[90vh] overflow-y-auto">
            {/* Tag Badge */}
            <div>
              <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                {material.condition}
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-lg font-bold text-zinc-950 leading-tight">
              {material.title}
            </h3>

            {/* Location & Seller Info */}
            <div className="mt-4 flex flex-col gap-2 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-300" />
                {material.location}
              </span>
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-zinc-300" />
                Listed by: <span className="font-semibold text-zinc-800">{material.sellerName}</span>
              </span>
            </div>

            {/* Metrics */}
            <div className="mt-6 grid grid-cols-2 rounded-xl border border-gray-100 bg-zinc-50/50 p-3.5 text-xs text-zinc-500">
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Quantity</p>
                <p className="font-bold text-zinc-900 text-sm mt-0.5">{material.quantity.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Price</p>
                <p className="font-bold text-zinc-900 text-sm mt-0.5">LKR {material.price}/kg</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</h4>
              <p className="mt-2 text-xs leading-relaxed text-zinc-650">
                {material.description}
              </p>
            </div>

            {/* Inquiry Box */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              <h4 className="text-xs font-bold text-zinc-900 mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>Contact Seller</span>
              </h4>

              {success && (
                <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 mb-4">
                  {success}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-650 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3">
                <textarea
                  required
                  rows={2}
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="I am interested in purchasing this. Please provide packing and sample details..."
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-xs bg-white focus:outline-none focus:border-emerald-500"
                />

                {user ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-zinc-950 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onLoginPrompt}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
                  >
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>Login to Contact Seller</span>
                  </button>
                )}
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default MaterialDetailsModal;
