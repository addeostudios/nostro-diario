import { useState, useEffect, useRef } from 'react';
import { Photo, Badge } from '../types';
import { X, Calendar, MessageSquare, Download, Trash2, Clock, ChevronLeft, ChevronRight, Maximize2, Heart, AlertCircle, Loader2, HeartCrack } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoDetailModalProps {
  allPhotos: Photo[];
  initialIndex: number;
  badges: Badge[];
  onClose: () => void;
  onDelete: (photo: Photo) => void;
  isDarkMode: boolean;
}

export default function PhotoDetailModal({ allPhotos, initialIndex, badges, onClose, onDelete, isDarkMode }: PhotoDetailModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  const photo = allPhotos[currentIndex];
  const photoBadges = badges.filter(b => photo?.badges?.includes(b.id));

  const handleNext = () => {
    if (currentIndex < allPhotos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowConfirm(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowConfirm(false);
    }
  };

  // Keep bottom preview centered on current image
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeElement) {
        scrollRef.current.scrollTo({
          left: activeElement.offsetLeft - scrollRef.current.offsetWidth / 2 + activeElement.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex]);

  const handleDownload = async () => {
    try {
      setDownloadStatus('loading');
      // Create a temporary link and fetch the blob to force download
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = photo.url.split('.').pop()?.split('?')[0] || 'jpg';
      link.download = `ricordo-${format(parseISO(photo.dateTaken), 'yyyy-MM-dd')}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 2500);
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadStatus('error');
      setTimeout(() => setDownloadStatus('idle'), 2500);
    }
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden">
      {/* Blurred Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={`bg-${photo.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            src={photo.url}
            alt=""
            className="w-full h-full object-cover blur-[80px] scale-125"
          />
        </AnimatePresence>
        <div 
          className={`absolute inset-0 backdrop-blur-sm cursor-pointer ${isDarkMode ? 'bg-black/80' : 'bg-slate-950/60'}`}
          onClick={onClose}
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative w-full max-w-6xl shadow-2xl transition-all duration-500 flex flex-col ${isFullScreen ? 'h-full rounded-none' : 'h-[90vh] md:h-[85vh] rounded-[2.5rem] overflow-hidden m-4'} ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className={`p-3 backdrop-blur-md rounded-2xl text-white pointer-events-auto transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-900/20 hover:bg-slate-900/30'}`}
            >
              <X size={24} />
            </button>
          </div>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`p-3 backdrop-blur-md rounded-2xl text-white pointer-events-auto transition-all ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-900/20 hover:bg-slate-900/30'}`}
          >
            <Maximize2 size={22} className={isFullScreen ? 'rotate-180' : ''} />
          </button>
        </div>

        <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">
          {/* Image Display */}
          <div className={`relative flex-grow bg-slate-900 flex items-center justify-center overflow-hidden group/image ${isFullScreen ? 'w-full' : 'md:w-2/3'}`}>
            <AnimatePresence mode="wait">
              <motion.img 
                key={photo.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                src={photo.url} 
                alt={photo.description} 
                className={`w-full h-full select-none cursor-pointer ${isFullScreen ? 'object-contain' : 'object-cover'}`}
                onClick={() => setIsFullScreen(!isFullScreen)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 100) handlePrev();
                  else if (info.offset.x < -100) handleNext();
                }}
              />
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 opacity-0 group-hover/image:opacity-100 transition-opacity pointer-events-none">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white pointer-events-auto transition-all ${currentIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'}`}
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={handleNext}
                disabled={currentIndex === allPhotos.length - 1}
                className={`p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white pointer-events-auto transition-all ${currentIndex === allPhotos.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/20 hover:scale-110'}`}
              >
                <ChevronRight size={32} />
              </button>
            </div>
          </div>

          {/* Info Sidebar (Hidden in full screen on mobile, sidebar on desktop) */}
          {(!isFullScreen || (isFullScreen && window.innerWidth >= 768)) && (
            <div className={`w-full ${isFullScreen ? 'md:w-80' : 'md:w-1/3'} p-6 sm:p-8 md:p-10 space-y-6 overflow-y-auto backdrop-blur-xl relative border-l ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/30 border-slate-100'}`}>
              <header className="space-y-4">
                <div className="flex items-center space-x-3 text-pink-500 mb-2">
                  <Calendar size={18} />
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Il nostro Ricordo</span>
                </div>
                <h2 className={`text-3xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {format(parseISO(photo.dateTaken), 'd MMMM yyyy', { locale: it })}
                </h2>
                
                <div className="flex flex-wrap gap-2">
                  {photoBadges.map(b => (
                    <div 
                      key={b.id} 
                      className="px-4 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-sm"
                      style={{ backgroundColor: b.color }}
                    >
                      {b.name}
                    </div>
                  ))}
                </div>
              </header>

              {photo.description && (
                <div className={`space-y-3 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/50 border-white/50'}`}>
                  <div className="flex items-center space-x-2 text-slate-400">
                     <MessageSquare size={16} />
                     <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Il nostro Racconto</span>
                  </div>
                  <p className={`leading-relaxed text-lg font-light italic ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
                    "{photo.description}"
                  </p>
                </div>
              )}

              <div className="pt-8 flex flex-col space-y-6">
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">
                  <Clock size={12} />
                  <span>Aggiunta il {format(parseISO(photo.createdAt), "d MMM 'alle' HH:mm", { locale: it })}</span>
                </div>

                <div className="flex space-x-3">
                   <button 
                    onClick={handleDownload}
                    disabled={downloadStatus !== 'idle'}
                    className={`btn-secondary flex-grow flex items-center justify-center space-x-3 py-4 disabled:opacity-50 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : ''}`}
                   >
                    {downloadStatus === 'loading' ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {downloadStatus === 'loading' ? 'Salvataggio...' : 'Salva'}
                    </span>
                   </button>
                   <button 
                    onClick={() => setShowConfirm(true)}
                    className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                   >
                    <Trash2 size={20} />
                   </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Preview Track */}
        {!isFullScreen && (
          <div className={`h-28 border-t flex items-center px-10 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-50'}`}>
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth w-full py-4"
            >
              {allPhotos.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => { setCurrentIndex(idx); setShowConfirm(false); }}
                  className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-300 ${currentIndex === idx ? 'border-pink-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Download Feedback Overlay */}
        <AnimatePresence>
          {(downloadStatus === 'success' || downloadStatus === 'error') && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-md ${isDarkMode ? 'bg-slate-950/60' : 'bg-white/40'}`}
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className={`p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-4 max-w-xs text-center border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white/50'}`}
              >
                <div className={`p-6 rounded-full ${downloadStatus === 'success' ? 'bg-pink-500/10 text-pink-500' : 'bg-red-500/10 text-red-500'}`}>
                  {downloadStatus === 'success' ? (
                    <Heart size={64} fill="currentColor" className="animate-pulse" />
                  ) : (
                    <AlertCircle size={64} />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className={`text-xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {downloadStatus === 'success' ? 'Ricordo Salvato!' : 'Ops, Errore'}
                  </h3>
                  <p className="text-sm text-slate-400 font-light italic leading-tight">
                    {downloadStatus === 'success' 
                      ? 'Il tuo ricordo è stato salvato con successo sul tuo dispositivo' 
                      : 'Non è stato possibile salvare il ricordo in questo momento'
                    }
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Delete Confirmation Overlay */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 z-[110] flex items-center justify-center backdrop-blur-md p-6 ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-900/40'}`}
              onClick={() => setShowConfirm(false)}
            >
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className={`p-10 sm:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full text-center border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white/50'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-red-500/10 text-red-500 shadow-red-900/20' : 'bg-red-50 text-red-500 shadow-red-100/50'}`}>
                  <HeartCrack size={48} className="animate-bounce" />
                </div>
                <div className="space-y-3">
                  <h3 className={`text-3xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Sei sicuro?</h3>
                  <p className="text-slate-400 font-light italic leading-relaxed">
                    Questo ricordo verrà rimosso per sempre dal nostro album.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3 pt-2">
                  <button 
                    onClick={() => { onDelete(photo); onClose(); }} 
                    className={`btn-primary bg-red-500 hover:bg-red-600 w-full py-5 uppercase tracking-[0.2em] text-[10px] font-bold shadow-xl ${isDarkMode ? 'shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : 'shadow-red-200'}`}
                  >
                    Sì, elimina ora
                  </button>
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className={`btn-secondary w-full py-5 uppercase tracking-[0.2em] text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : ''}`}
                  >
                    Annulla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

