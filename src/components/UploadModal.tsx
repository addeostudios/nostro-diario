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
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Content = await base64Promise;

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
      onClose();
      // Reset
      setFile(null);
      setPreview(null);
      setDescription('');
      setSelectedBadges([]);
    } catch (e: any) {
      console.error('Upload failed', e);
      alert(e.message || 'Errore durante il caricamento.');
    } finally {
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
              onClick={onClose}
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
                  className={`p-3 rounded-2xl shadow-sm transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-100 text-slate-400'}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 pt-4 space-y-8 overflow-y-auto no-scrollbar">
                {/* Photo Dropzone */}
                {preview ? (
                  <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden group shadow-lg">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="absolute top-4 right-4 p-3 bg-black/40 text-white backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div 
                    {...getRootProps()}
                    className={`aspect-[4/3] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group shadow-sm hover:shadow-md ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-pink-500/50' : 'bg-white border-slate-200 hover:border-pink-200'}`}
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
                      Il vostro racconto
                    </label>
                    <textarea 
                      placeholder="Cosa stava succedendo? Scrivi un breve ricordo..."
                      className={`input w-full h-32 resize-none py-4 text-sm lowercase italic ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-600' : ''}`}
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
                              onClick={() => toggleBadge(b.id)}
                              className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center shrink-0 border-2 snap-start ${selectedBadges.includes(b.id) ? 'scale-110 shadow-lg' : 'opacity-30 border-transparent hover:opacity-100'}`}
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
                    disabled={!file || !description || uploading}
                    className={`btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-xl mt-4 ${isDarkMode ? 'bg-pink-600 hover:bg-pink-700 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : ''}`}
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
