/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { dbService } from './services/db';
import { UserProfile, Couple, Photo, Badge, ImportantDate } from './types';
import { 
  Heart, 
  Image as ImageIcon, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  Plus, 
  LogOut,
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Gallery from './components/Gallery';
import Calendar from './components/Calendar';
import Account from './components/Account';
import Onboarding from './components/Onboarding';
import UploadModal from './components/UploadModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'calendar' | 'account'>('gallery');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    let unsubBadges: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Fetch profile
          let userProfile = await dbService.getUserProfile(firebaseUser.uid);
          if (!userProfile) {
            // New user, create profile
            userProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
            };
            await dbService.setUserProfile(userProfile);
          }
          setProfile(userProfile);

          // Fetch couple if exists
          if (userProfile.coupleId) {
            const coupleData = await dbService.getCouple(userProfile.coupleId);
            setCouple(coupleData);
            
            // Subscribe to badges here since we need them for upload
            if (unsubBadges) unsubBadges();
            unsubBadges = dbService.subscribeBadges(userProfile.coupleId, setBadges);
          }
        } catch (e) {
          console.error("Profile initialization error", e);
        }
      } else {
        setProfile(null);
        setCouple(null);
        if (unsubBadges) {
          unsubBadges();
          unsubBadges = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubBadges) unsubBadges();
    };
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    console.log("Inizio login con Google...");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login completato con successo:", result.user.uid);
    } catch (e: any) {
      console.error("Errore durante il login:", e);
      if (e.code === 'auth/unauthorized-domain') {
        alert("Errore: Questo dominio non è autorizzato in Firebase. \n\nPer risolvere:\n1. Vai nella Console Firebase\n2. Authentication > Settings > Authorized Domains\n3. Aggiungi il tuo URL Vercel (es. nostro-diario.vercel.app)");
      } else if (e.code === 'auth/popup-blocked') {
        alert("Il popup è stato bloccato dal browser. Abilita i popup per questo sito e riprova.");
      } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        alert(`Errore di accesso (${e.code}): ${e.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => signOut(auth);

  const [showGradient, setShowGradient] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      setShowGradient(!isAtBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Heart className="text-pink-500 fill-pink-500 w-12 h-12" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-[#F5F5F0]">
        <div className="max-w-md w-full space-y-6">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-xl rotate-3">
             <Heart className="text-pink-500 fill-pink-500 w-12 h-12 mb-2" />
             <h1 className="text-4xl">Nostro Diario</h1>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed font-light">
            Un luogo intimo per custodire i vostri momenti più belli. 
            Crea il tuo diario fotografico condiviso.
          </p>
          <button 
            onClick={login} 
            disabled={isLoggingIn}
            className="btn-primary w-full py-4 text-lg shadow-xl shadow-slate-900/10 disabled:opacity-50 transition-all"
          >
            {isLoggingIn ? 'Accesso in corso...' : 'Entra con Google'}
          </button>
        </div>
      </div>
    );
  }

  if (!couple) {
    return (
      <Onboarding 
        user={user} 
        onComplete={(newCouple) => {
          setCouple(newCouple);
          setProfile(prev => prev ? { ...prev, coupleId: newCouple.id } : null);
        }} 
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-[#F5F5F0] text-slate-900'} pb-24 md:pb-0 md:pl-20 lg:pl-64 flex flex-col`}>
      {/* Fixed Scroll Cue Gradient */}
      <AnimatePresence>
        {showGradient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed bottom-0 left-0 right-0 h-48 bg-gradient-to-t ${isDarkMode ? 'from-fuchsia-950/70' : 'from-fuchsia-500/60'} to-transparent pointer-events-none z-[40] transition-colors duration-500`} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar / Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'} backdrop-blur-lg border-t z-50 md:top-0 md:right-auto md:w-20 lg:w-64 md:border-t-0 md:border-r h-20 md:h-screen flex md:flex-col items-center md:py-8 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]`}>
        <div className="hidden md:flex flex-col items-center lg:items-start lg:w-full lg:px-8 mb-8">
          <div className={`p-3 ${isDarkMode ? 'bg-slate-800' : 'bg-pink-50'} rounded-2xl mb-4`}>
            <Heart className={`${isDarkMode ? 'text-pink-400 fill-pink-400' : 'text-pink-500 fill-pink-500'} w-6 h-6`} />
          </div>
          <h2 className={`hidden lg:block text-sm font-serif italic truncate w-full ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{couple.name}</h2>
          <p className="hidden lg:block text-[10px] uppercase tracking-widest text-slate-400 font-bold">Il nostro diario</p>
        </div>

        <div className="flex md:flex-col w-full h-full md:h-auto items-center justify-center md:space-y-2 lg:space-y-4">
          <NavButton 
            active={activeTab === 'gallery'} 
            onClick={() => setActiveTab('gallery')} 
            icon={<ImageIcon size={22} />} 
            label="Galleria" 
            isDarkMode={isDarkMode}
          />
          <NavButton 
            active={activeTab === 'calendar'} 
            onClick={() => setActiveTab('calendar')} 
            icon={<CalendarIcon size={22} />} 
            label="Calendario" 
            isDarkMode={isDarkMode}
          />
          <NavButton 
            active={activeTab === 'account'} 
            onClick={() => setActiveTab('account')} 
            icon={<UserIcon size={22} />} 
            label="Account" 
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="flex-grow hidden md:block"></div>

      </nav>

      {/* Main Content */}
      <main className="p-6 md:p-12 lg:p-16 w-full max-w-6xl mx-auto flex-grow">
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Gallery coupleId={couple.id} badges={badges} isDarkMode={isDarkMode} />
            </motion.div>
          )}
          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Calendar coupleId={couple.id} couple={couple} isDarkMode={isDarkMode} />
            </motion.div>
          )}
          {activeTab === 'account' && (
             <motion.div
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Account 
                couple={couple} 
                profile={profile!} 
                onUpdateCouple={setCouple} 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        coupleId={couple.id}
        badges={badges}
        isDarkMode={isDarkMode}
      />

      {/* Floating Plus Button - Root Level */}
      <AnimatePresence>
        {activeTab === 'gallery' && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => setIsUploadOpen(true)}
            className={`fixed bottom-24 md:bottom-10 right-6 md:right-10 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-[60] group ring-4 ${isDarkMode ? 'bg-pink-600 text-white ring-slate-900 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.7)]' : 'bg-slate-900 text-white ring-white shadow-slate-200'}`}
          >
            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label, isDarkMode }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, isDarkMode: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`relative group flex flex-col lg:flex-row lg:w-full lg:px-8 items-center justify-center lg:justify-start lg:space-x-4 p-2 sm:p-3 lg:py-4 transition-all flex-1 md:flex-none ${active ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`relative z-10 transition-transform ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
        {icon}
      </div>
      <span className={`hidden lg:block text-sm font-medium z-10 ${active ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-bg"
          className={`absolute inset-1 sm:inset-2 md:inset-0 ${isDarkMode ? 'bg-slate-800' : 'bg-pink-50'} rounded-xl lg:rounded-r-full -z-0`}
          initial={false}
        />
      )}
    </button>
  );
}


