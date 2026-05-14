import { useState } from 'react';
import { Badge } from '../types';
import { dbService } from '../services/db';
import { X, Plus, Trash2, Tag, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BadgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  badges: Badge[];
  isDarkMode: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
  '#F06292', '#BA68C8', '#4DB6AC', '#FFD54F', '#7986CB',
  '#90A4AE', '#AED581', '#A1887F', '#FF8A65'
];

export default function BadgeManager({ isOpen, onClose, coupleId, badges, isDarkMode }: BadgeManagerProps) {
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const badge: Badge = {
      id: 'badge-' + Math.random().toString(36).substring(2, 9),
      coupleId,
      name: newName.trim(),
      color: selectedColor
    };
    await dbService.addBadge(badge);
    setNewName('');
  };

  const handleDelete = async (id: string) => {
    try {
      await dbService.deleteBadge(id);
      setDeletingId(null);
    } catch (e: any) {
      console.error('Delete badge failed', e);
      alert('Errore eliminazione badge. Verifica la connessione.');
      setDeletingId(null);
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
              className={`relative w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 sm:p-12 pb-6 flex items-start justify-between shrink-0 relative">
                <header className="space-y-2">
                  <div className="flex items-center space-x-3 text-pink-500 mb-2">
                    <Tag size={18} />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Organizzazione</span>
                  </div>
                  <h2 className={`text-4xl sm:text-5xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>I nostri Tag</h2>
                  <p className="text-slate-400 font-light italic">Categorizzate i vostri ricordi speciali.</p>
                </header>
                <button 
                  onClick={onClose}
                  className={`p-4 rounded-2xl shadow-sm text-slate-400 transition-all sm:mt-1 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="px-8 sm:px-12 pb-12 space-y-12 overflow-y-auto no-scrollbar scroll-smooth">
                {/* Create Section */}
                <section className="space-y-8 pt-4">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1">
                        Nuovo Badge
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-grow group">
                          <input 
                            type="text" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="es. vacanza, casa..."
                            className={`w-full border-none rounded-2xl px-6 py-5 text-lg lowercase italic shadow-sm focus:shadow-md transition-all outline-none ${isDarkMode ? 'bg-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 text-slate-900 placeholder:text-slate-300'}`}
                          />
                          <motion.div className="absolute bottom-0 left-6 right-6 h-0.5 bg-pink-500 scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left" />
                        </div>
                        <button 
                          onClick={handleAdd}
                          disabled={!newName.trim()}
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-20 disabled:grayscale transition-all shadow-xl active:scale-90 ${isDarkMode ? 'bg-pink-600 text-white shadow-pink-900/20' : 'bg-slate-900 text-white'}`}
                        >
                          <Plus size={28} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1 flex items-center gap-2">
                        <Palette size={12} className="text-pink-400" />
                        Scegli il Colore
                      </label>
                      <div className="grid grid-cols-7 gap-3 sm:gap-4 px-1">
                        {COLORS.map(color => (
                          <button 
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`aspect-square rounded-2xl transition-all duration-300 relative group flex items-center justify-center hover:scale-110 active:scale-95`}
                            style={{ backgroundColor: color }}
                          >
                            {selectedColor === color && (
                              <motion.div 
                                layoutId="activeColor"
                                className={`absolute inset-0 rounded-2xl ring-4 ring-offset-2 shadow-lg ${isDarkMode ? 'ring-slate-700' : 'ring-white'}`}
                                style={{ ringColor: color }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* List Section */}
                <section className="space-y-6">
                  <div className="flex items-center space-x-3 text-slate-400 px-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold">
                      Badge Attivi ({badges.length})
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                      {badges.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`text-center py-12 rounded-[2.5rem] border-2 border-dashed ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}
                        >
                          <p className="text-slate-400 font-light italic">Ancora nessun tag creato...</p>
                        </motion.div>
                      ) : (
                        badges.map(badge => (
                          <motion.div 
                            key={badge.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={`p-4 pl-6 rounded-[2rem] flex items-center justify-between group transition-all border border-transparent overflow-hidden relative ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 hover:border-slate-600' : 'bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-100'}`}
                          >
                            <div className="flex items-center space-x-5">
                              <div 
                                className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-md shadow-inner"
                                style={{ backgroundColor: badge.color, color: 'white' }}
                              >
                                <Tag size={20} />
                              </div>
                              <span className={`text-xl font-serif italic ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{badge.name}</span>
                            </div>
                            <button 
                              onClick={() => setDeletingId(badge.id)}
                              className={`w-12 h-12 flex items-center justify-center transition-all ${isDarkMode ? 'text-slate-600 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                            >
                              <Trash2 size={20} />
                            </button>

                            {/* Inline confirmation for badge delete */}
                            <AnimatePresence>
                              {deletingId === badge.id && (
                                <motion.div 
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  className={`absolute inset-0 z-20 flex items-center justify-between px-8 rounded-2xl border-2 ${isDarkMode ? 'bg-slate-900 border-red-900/20' : 'bg-white/95 border-red-50'}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-0.5">Eliminare il tag?</span>
                                    <span className="text-[10px] text-slate-400 italic">Le foto perderanno questo badge</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleDelete(badge.id)}
                                      className={`px-6 py-2.5 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all ${isDarkMode ? 'bg-red-600 shadow-red-900/40' : 'bg-red-500 shadow-red-200'}`}
                                    >
                                      Sì
                                    </button>
                                    <button 
                                      onClick={() => setDeletingId(null)}
                                      className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                      No
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
