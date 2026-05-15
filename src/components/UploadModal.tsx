import { useState, useCallback, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { auth } from '../lib/firebase';
import { dbService } from '../services/db';
import { Photo, Badge } from '../types';
import { X, Image as ImageIcon, Loader2, Plus, MessageSquare, Calendar, FolderHeart, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  badges: Badge[];
  isDarkMode: boolean;
}

export default function UploadModal({ isOpen, onClose, coupleId, badges, isDarkMode }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [dateTaken, setDateTaken] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[acceptedFiles.length - 1] || acceptedFiles[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    multiple: false 
  } as any);

  const handleUpload = async () => {
    if (!file || !auth.currentUser) return;
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${auth.currentUser.uid}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Compression and conversion logic - Optimized for maximum browser compatibility
      const processFile = async (imgFile: File): Promise<string> => {
        if (!imgFile || imgFile.size === 0) {
          throw new Error('Il file selezionato è vuoto o non accessibile.');
        }

        let fileToProcess = imgFile;

        // Support for HEIC/HEIF with improved detection
        const isHEIC = imgFile.name.toLowerCase().endsWith('.heic') || 
                       imgFile.name.toLowerCase().endsWith('.heif') ||
                       imgFile.type === 'image/heic' || 
                       imgFile.type === 'image/heif';

        if (isHEIC) {
          try {
            const heic2any = (await import('heic2any')).default;
            const blob = await heic2any({
              blob: imgFile,
              toType: 'image/jpeg',
              quality: 0.6
            });
            fileToProcess = new File([Array.isArray(blob) ? blob[0] : blob], imgFile.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg'
            });
          } catch (e) {
            console.warn('[Upload] HEIC conversion skipped or failed:', e);
          }
        }

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Il caricamento sta impiegando troppo tempo. Prova ad usare una foto meno pesante o apri il sito in Safari/Chrome.'));
          }, 25000);

          const processImage = (img: HTMLImageElement) => {
            clearTimeout(timeout);
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1000;

            if (width > height && width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            } else if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { 
              alpha: false,
              willReadFrequently: false
            });
            
            if (!ctx) {
              reject(new Error('Problema di memoria del browser. Chiudi altre schede e riprova.'));
              return;
            }
            
            // Draw with smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Use toBlob instead of toDataURL for better memory efficiency on mobile
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Errore nella compressione della foto.'));
                return;
              }

              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                if (!base64) {
                  reject(new Error('Errore nella conversione finale.'));
                  return;
                }
                resolve(base64);
              };
              reader.onerror = () => reject(new Error('Errore durante la lettura del file compresso.'));
              reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.6);
          };

          // Primary method: URL.createObjectURL (Most memory efficient for mobile)
          let url: string | null = null;
          try {
            url = URL.createObjectURL(fileToProcess);
          } catch (e) {
            console.error('[Upload] URL.createObjectURL failed:', e);
          }

          const loadImage = (source: string, isFallback: boolean = false) => {
            const img = new Image();
            img.onload = () => {
              if (url) URL.revokeObjectURL(url);
              processImage(img);
            };
            img.onerror = () => {
              if (url) URL.revokeObjectURL(url);
              
              if (!isFallback) {
                // Fallback to FileReader if URL.createObjectURL fails to load the image
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (e.target?.result) {
                    loadImage(e.target.result as string, true);
                  }
                };
                reader.readAsDataURL(fileToProcess);
              } else {
                const isInApp = /Instagram|FBAN|FBAV|WhatsApp|Messenger/i.test(navigator.userAgent);
                if (isInApp) {
                  reject(new Error('Il browser di questa app sta bloccando l\'accesso alle foto. Tocca i tre puntini in alto a destra e seleziona "Apri in Chrome/Safari".'));
                } else {
                  reject(new Error('Formato immagine non supportato dal browser. Prova a scattare una nuova foto o usa lo screenshot.'));
                }
              }
            };
            img.src = source;
          };

          if (url) {
            loadImage(url);
          } else {
            // If createObjectURL failed immediately, try FileReader
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                loadImage(e.target.result as string, true);
              }
            };
            reader.onerror = () => reject(new Error('Impossibile accedere alla foto sul dispositivo.'));
            reader.readAsDataURL(fileToProcess);
          }
        });
      };

      const base64Content = await processFile(file);

      const response = await fetch('/api/upload-to-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          content: base64Content,
          coupleId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Errore durante l\'invio a GitHub');
      }

      const { url } = await response.json();

      const date = new Date(dateTaken);
      const photo: Photo = {
        id: fileName,
        coupleId,
        url,
        description,
        dateTaken: date.toISOString(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        badges: selectedBadges,
        uploaderUid: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await dbService.addPhoto(photo);
      
      // Reset state BEFORE closing to avoid issues if component unmounts
      setFile(null);
      setPreview(null);
      setDescription('');
      setSelectedBadges([]);
      setUploading(false);
      
      onClose();
    } catch (e: any) {
      console.error('Upload failed', e);
      alert(e.message || 'Errore durante il caricamento.');
      setUploading(false);
    }
  };

  const toggleBadge = (id: string) => {
    setSelectedBadges(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      console.log("[UploadModal] File manually selected:", f.name, f.type, f.size);
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/60'}`}
              onClick={() => {
                if (!uploading) onClose();
              }}
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`relative w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}
            >
              <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className={`text-3xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Nuovo Ricordo</h2>
                  <p className="text-sm text-slate-400 font-light italic">Aggiungi un momento alla galleria</p>
                </div>
                <button 
                  onClick={onClose}
                  disabled={uploading}
                  className={`p-3 rounded-2xl shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-400'} disabled:opacity-50`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 pt-4 space-y-8 overflow-y-auto no-scrollbar">
                {/* Photo Dropzone */}
                {preview ? (
                  <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden group shadow-lg">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {!uploading && (
                      <button 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-4 right-4 p-3 bg-black/40 text-white backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div 
                    {...getRootProps()}
                    className={`aspect-[4/3] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group shadow-sm hover:shadow-md ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50' : 'bg-white border-slate-200 hover:border-pink-200'}`}
                  >
                    <input {...getInputProps()} />
                    <div className={`p-5 rounded-[1.8rem] transition-all mb-4 ${isDarkMode ? 'bg-pink-900/30 text-pink-400 group-hover:bg-pink-900/50' : 'bg-pink-50 text-pink-400 group-hover:bg-pink-100'}`}>
                      <ImageIcon size={32} />
                    </div>
                    <span className={`font-medium font-serif italic text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-400'}`}>Scegli una foto speciale</span>
                    <span className={`text-[10px] uppercase tracking-widest mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`}>{isDragActive ? 'Rilascia qui!' : 'Trascinala qui o clicca'}</span>
                  </div>
                )}

                {/* Form */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1 flex items-center gap-2">
                      <MessageSquare size={12} />
                      Il vostro racconto (opzionale)
                    </label>
                    <textarea 
                      placeholder="Cosa stava succedendo? Scrivi un breve ricordo..."
                      className={`input w-full h-32 resize-none py-4 text-sm lowercase italic ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-600' : ''}`}
                      disabled={uploading}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1 flex items-center gap-2">
                        <Calendar size={12} />
                        Data dello scatto
                      </label>
                      <input 
                        type="datetime-local" 
                        disabled={uploading}
                        className={`input w-full text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-600 [color-scheme:dark]' : ''}`}
                        value={dateTaken}
                        onChange={e => setDateTaken(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1 flex items-center gap-2">
                        <FolderHeart size={12} />
                        Aggiungi Badge
                      </label>
                      <div className="w-full overflow-hidden">
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1 touch-pan-x snap-x scroll-smooth">
                          {badges.map(b => (
                            <button
                              key={b.id}
                              disabled={uploading}
                              onClick={() => toggleBadge(b.id)}
                              className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 border-2 snap-start ${selectedBadges.includes(b.id) ? 'scale-110 shadow-lg' : 'opacity-30 border-transparent hover:opacity-100'} disabled:opacity-20`}
                              style={{ 
                                backgroundColor: b.color,
                                borderColor: selectedBadges.includes(b.id) ? (isDarkMode ? '#334155' : 'white') : 'transparent',
                                boxShadow: selectedBadges.includes(b.id) ? `0 8px 16px -4px ${b.color}88` : 'none'
                              }}
                              title={b.name}
                            >
                              <Tag size={18} className="text-white" />
                            </button>
                          ))}
                          {badges.length === 0 && <span className="text-[10px] text-slate-300 italic px-2">Crea dei badge per iniziare</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className={`btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl mt-4 ${isDarkMode ? 'bg-pink-600 hover:bg-pink-700 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span className="uppercase tracking-widest text-sm font-bold">Salvataggio del momento...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        <span className="uppercase tracking-widest text-sm font-bold">Custodisci Ricordo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

  );
}
