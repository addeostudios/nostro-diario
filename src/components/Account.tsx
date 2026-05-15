import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Heart, 
  Clock, 
  MapPin, 
  ChevronRight, 
  LogOut,
  Mail,
  Edit2,
  Moon,
  Sun,
  Check,
  Smartphone,
  Info,
  Share as ShareIcon,
  PlusSquare
} from 'lucide-react';
import { Couple, UserProfile } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface AccountProps {
  couple: Couple;
  profile: UserProfile;
  onUpdateCouple: (c: Couple) => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

export default function Account({ couple, profile, onUpdateCouple, isDarkMode, setIsDarkMode }: AccountProps) {
  const [name, setName] = useState(couple.name);
  const [date, setDate] = useState(couple.anniversaryDate || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(couple.id);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const updated = { ...couple, name, anniversaryDate: date };
      await setDoc(doc(db, 'couples', couple.id), updated);
      onUpdateCouple(updated);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const logout = () => signOut(auth);

  return (
    <div className="space-y-10 pb-12 max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="flex items-center space-x-3 text-pink-500 mb-2">
          <UserIcon size={20} strokeWidth={2.5} />
          <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.3em] font-bold">Il Tuo Spazio</span>
        </div>
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Account</h1>
        <p className="text-slate-400 lg:text-lg font-light italic">Gestisci il vostro legame digitale e l'aspetto dell'app.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile & Couple Settings Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-6 relative overflow-hidden flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white/70 backdrop-blur-md'}`}
        >
          <div className="absolute top-0 right-0 p-6 lg:p-8 opacity-[0.03] lg:opacity-[0.05] -rotate-12 translate-x-4 -translate-y-4">
             <Heart className="w-24 h-24 lg:w-36 lg:h-36 text-pink-500" fill="currentColor" />
          </div>

          <div className="relative z-10 space-y-6 lg:space-y-4">
            <div className="flex items-center space-x-4 lg:space-x-5">
              <div className="relative group">
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className={`w-12 h-12 lg:w-20 lg:h-20 rounded-full object-cover shadow-lg lg:shadow-2xl ring-2 lg:ring-4 ${isDarkMode ? 'ring-slate-800' : 'ring-white'}`}
                />
                <div className={`absolute -bottom-1 -right-1 lg:-bottom-1.5 lg:-right-1.5 p-1 lg:p-2 rounded-full shadow-md lg:shadow-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <Heart className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-pink-500 fill-pink-500" />
                </div>
              </div>
              <div className="min-w-0">
                <h3 className={`text-lg lg:text-xl font-serif italic truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{profile.displayName}</h3>
                <div className="flex items-center text-slate-400 text-[10px] lg:text-xs mt-0.5 lg:mt-1">
                  <Mail className="w-3 h-3 lg:w-3 lg:h-3 mr-1.5 lg:mr-1.5 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              </div>
            </div>

            <hr className={`${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`} />
            
            <div className="space-y-4 lg:space-y-3">
              <div className="space-y-1.5 lg:space-y-2">
                <label className="text-[10px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Edit2 className="w-3 h-3 lg:w-3 lg:h-3" />
                  Nome della Coppia
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className={`input w-full text-base lg:text-base lowercase italic placeholder:text-slate-200 py-3 lg:py-3 px-4 lg:px-4 h-11 lg:h-11 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-slate-600' : 'bg-white/50'}`}
                  placeholder="es. noi due..."
                />
              </div>

              <div className="space-y-1.5 lg:space-y-2">
                <label className="text-[10px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Clock className="w-3 h-3 lg:w-3 lg:h-3" />
                  Data Speciale
                </label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className={`input w-full text-base lg:text-base py-3 lg:py-3 px-4 lg:px-4 h-11 lg:h-11 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-600' : 'bg-white/50'}`}
                />
              </div>

              <button 
                onClick={save} 
                disabled={isSaving}
                className={`btn-primary w-full flex items-center justify-center gap-3 py-3 lg:py-3.5 shadow-xl mt-2 lg:mt-2 text-sm lg:text-sm h-11 lg:h-11 ${isDarkMode ? 'bg-pink-600 hover:bg-pink-700 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : 'bg-slate-900 shadow-pink-100'}`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Salva Modifiche</span>
                )}
              </button>
            </div>

          </div>

          <AnimatePresence>
             {showSaved && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 1.1, y: -20 }}
                 className={`absolute inset-0 z-[100] flex flex-col items-center justify-center space-y-4 rounded-3xl backdrop-blur-md ${isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'}`}
               >
                 <div className={`p-5 rounded-full ${isDarkMode ? 'bg-pink-600/20 text-pink-500 shadow-lg shadow-pink-900/20' : 'bg-pink-50 text-pink-500 shadow-lg shadow-pink-100'}`}>
                   <Check size={48} className="animate-pulse" />
                 </div>
                 <div className="text-center">
                   <h3 className={`text-xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Modifiche Salvate!</h3>
                   <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Il vostro legame è aggiornato</p>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </motion.section>

        <div className="flex flex-col gap-6">
          {/* Theme Settings Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`card px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-6 relative overflow-hidden ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white/70'}`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className={`text-xl lg:text-xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Modalità {isDarkMode ? 'Notte' : 'Giorno'}</h3>
                <p className="text-slate-400 text-[10px] lg:text-[10px]">Cambia i colori dell'applicazione.</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative w-14 lg:w-16 h-7 lg:h-8 rounded-full transition-colors duration-500 p-1 flex items-center ${isDarkMode ? 'bg-pink-600' : 'bg-slate-200'}`}
              >
                <motion.div 
                  layout
                  className="w-5 lg:w-6 h-5 lg:h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-pink-500"
                  animate={{ x: isDarkMode ? (window.innerWidth < 1024 ? 28 : 32) : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
                </motion.div>
              </button>
            </div>
          </motion.section>

          {/* PWA Installation Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className={`card px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-6 relative overflow-hidden ${isDarkMode ? 'bg-indigo-900/40 border-indigo-800/50' : 'bg-indigo-50/50 border-indigo-100'}`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-indigo-500 shadow-sm'}`}>
                <Smartphone size={20} />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className={`text-lg font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Usa come App</h3>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${isDarkMode ? 'text-indigo-300/60' : 'text-indigo-400'}`}>Installazione Home Screen</p>
                </div>
                
                <div className="space-y-4 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">1</div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <strong>Su iPhone:</strong> Clicca <ShareIcon size={14} className="inline mx-1" /> poi seleziona <strong>"Aggiungi alla Home"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">2</div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <strong>Su Android:</strong> Clicca i tre puntini in alto a destra e seleziona <strong>"Installa app"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Share Card */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`card px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-6 text-white overflow-hidden relative flex-grow ${isDarkMode ? 'bg-pink-900 border-pink-800 shadow-xl shadow-pink-950/40' : 'bg-slate-900 shadow-2xl'}`}
          >
            <div className={`absolute top-0 right-0 p-6 lg:p-7 text-white/5 -rotate-12 translate-x-4 lg:translate-x-8 -translate-y-4 lg:-translate-y-8`}>
              <MapPin className="w-20 h-20 lg:w-32 lg:h-32" />
            </div>

            <div className="relative z-10 space-y-4 lg:space-y-4 h-full flex flex-col justify-center">
              <header>
                <div className="flex items-center space-x-2 text-pink-400 mb-1 lg:mb-1.5">
                  <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  <span className="text-[10px] lg:text-[10px] uppercase tracking-widest font-bold">Condivisione</span>
                </div>
                <h3 className="text-xl lg:text-xl font-serif italic text-white/90">ID Coppia</h3>
                <p className="text-slate-400 text-[11px] lg:text-[10px] font-light mt-1 lg:mt-1">Usa questo codice per collegarti con il partner.</p>
              </header>
              
              <div className="flex flex-col gap-3 lg:gap-3">
                <div className="bg-white/10 px-4 lg:px-5 py-3 lg:py-3 rounded-xl lg:rounded-xl border border-white/10 flex items-center justify-between">
                  <code className="font-mono text-[11px] lg:text-sm uppercase tracking-[0.2em] text-pink-200 truncate">{couple.id}</code>
                </div>
                <button 
                  onClick={copyCode}
                  className={`w-full py-3 lg:py-3 rounded-xl lg:rounded-xl text-[10px] lg:text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg ${isDarkMode ? 'bg-pink-900 text-white hover:bg-pink-800 border border-pink-700 shadow-pink-950/20' : 'bg-white text-slate-900 hover:bg-slate-100 shadow-slate-900/10'}`}
                >
                  Copia Codice
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showCopied && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -20 }}
                  className={`absolute inset-0 z-[100] flex flex-col items-center justify-center space-y-4 rounded-3xl backdrop-blur-md ${isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'}`}
                >
                  <div className={`p-5 rounded-full ${isDarkMode ? 'bg-pink-600/20 text-pink-500 shadow-lg shadow-pink-900/20' : 'bg-pink-50 text-pink-500 shadow-lg shadow-pink-100'}`}>
                    <Check size={48} className="animate-pulse" />
                  </div>
                  <div className="text-center">
                    <h3 className={`text-xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Codice Copiato!</h3>
                    <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Invia questo ID al partner</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Logout Action */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <button 
              onClick={logout}
              className={`w-full flex items-center justify-center space-x-3 py-6 px-4 rounded-[2rem] transition-all group shadow-xl ${
                isDarkMode 
                  ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.4)]' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 shadow-slate-200/50'
              }`}
            >
              <LogOut className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[11px] lg:text-xs font-black uppercase tracking-[0.2em]">Scollegati ora</span>
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
