import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

export function CreatePlaylistModal({ isOpen, onClose, onSubmit }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Nouvelle Playlist</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="playlist-name" className="block text-sm font-medium text-white/70 mb-2">
                Nom de la playlist
              </label>
              <input
                id="playlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ma super playlist..."
                className="w-full bg-[#0B0B0B] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#FFBF00] focus:ring-1 focus:ring-[#FFBF00] transition-colors"
                autoFocus
                required
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-white hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                className="px-5 py-2.5 bg-[#FFBF00] hover:bg-[#F2A900] text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? 'Création...' : 'Créer la playlist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
