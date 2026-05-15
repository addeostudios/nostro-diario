import { useState } from 'react';
import { User } from 'firebase/auth';
import { dbService } from '../services/db';
import { Couple } from '../types';
import { Heart, Plus, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface OnboardingProps {
  user: User;
  onComplete: (couple: Couple) => void;
}

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  const [name, setName] = useState('');
  const [coupleId, setCoupleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    setError('');
    try {
      const id = 'couple-' + Math.random().toString(36).substring(2, 9);
      const newCouple: Couple = {
        id,
        name,
        memberUids: [user.uid]
      };
      await dbService.createCouple(newCouple);
      await dbService.updateUserSettings(user.uid, { coupleId: id });
      onComplete(newCouple);
    } catch (e: any) {
      console.error('Creation error details:', e);
      try {
        const errorDetail = JSON.parse(e.message);
        setError(`Errore: ${errorDetail.error || 'Permesso negato'}. Controlla la console per i dettagli.`);
      } catch {
        setError('Si è verificato un errore durante la creazione. Assicurati che il nome sia valido.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const trimmedId = coupleId.trim();
    if (!trimmedId) return;
    setLoading(true);
    setError('');
    try {
      const existingCouple = await dbService.getCouple(trimmedId);
      if (existingCouple) {
        if (existingCouple.memberUids.includes(user.uid)) {
          setError('Fai già parte di questa coppia.');
          return;
        }
        if (existingCouple.memberUids.length >= 2) {
          setError('Questa coppia ha già due membri.');
          return;
        }
        const updatedMemberUids = [...existingCouple.memberUids, user.uid];
        const updatedCouple = { ...existingCouple, memberUids: updatedMemberUids };
        
        await dbService.createCouple(updatedCouple); 
        await dbService.updateUserSettings(user.uid, { coupleId: trimmedId });
        onComplete(updatedCouple);
      } else {
        setError('ID Coppia non trovato. Verifica di averlo inserito correttamente.');
      }
    } catch (e: any) {
      console.error('Join error details:', e);
      setError('Errore di connessione o ID non valido. Riprova tra poco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F0]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full card p-8 md:p-12 space-y-8"
      >
        <div className="text-center space-y-2">
          <Heart className="text-pink-500 fill-pink-500 mx-auto w-10 h-10 mb-2" />
          <h2 className="text-3xl">Benvenuto</h2>
          <p className="text-slate-500 font-light">Per iniziare dobbiamo creare il vostro spazio comune.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'selection' && (
          <div className="space-y-4">
            <button 
              onClick={() => setMode('create')}
              className="w-full flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-pink-50 rounded-xl text-pink-500">
                  <Plus size={24} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Crea una nuova coppia</p>
                  <p className="text-xs text-slate-500">Sarai il primo membro</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => setMode('join')}
              className="w-full flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <p className="font-medium">Unisciti a una coppia</p>
                  <p className="text-xs text-slate-500">Inserisci l'ID del partner</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">Nome della vostra coppia</label>
              <input 
                type="text" 
                placeholder="es. Giulia & Marco" 
                className="input w-full"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setMode('selection')} className="btn-secondary flex-grow">Indietro</button>
              <button disabled={!name || loading} onClick={handleCreate} className="btn-primary flex-grow">Crea</button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500">ID della coppia</label>
              <input 
                type="text" 
                placeholder="Inserisci l'ID..." 
                className="input w-full font-mono uppercase tracking-widest"
                value={coupleId}
                onChange={e => setCoupleId(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setMode('selection')} className="btn-secondary flex-grow">Indietro</button>
              <button disabled={!coupleId || loading} onClick={handleJoin} className="btn-primary flex-grow">Unisciti</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
