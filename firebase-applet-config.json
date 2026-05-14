import { useState, useEffect, useMemo } from 'react';
import { Couple, ImportantDate } from '../types';
import { dbService } from '../services/db';
import { 
  Heart, 
  Cake, 
  Calendar as CalendarIcon, 
  MapPin, 
  Star, 
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HeartCrack,
  X
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  isSameDay, 
  isSameMonth, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek,
  parseISO,
  differenceInMonths,
  addYears
} from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  coupleId: string;
  couple: Couple;
  isDarkMode: boolean;
}

export default function Calendar({ coupleId, couple, isDarkMode }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [showAddDate, setShowAddDate] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<ImportantDate | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    return dbService.subscribeDates(coupleId, setDates);
  }, [coupleId]);

  // Generate dynamic events (anniversaries, mensiversaries)
  const events = useMemo(() => {
    const list: (ImportantDate & { isAuto?: boolean })[] = [...dates];

    if (couple.anniversaryDate) {
      const anniversaryDate = parseISO(couple.anniversaryDate);
      
      // Calculate mensiversaries for the current year +/- 1 year
      const startDate = addYears(currentMonth, -1);
      const endDate = addYears(currentMonth, 1);
      
      let curr = anniversaryDate;
      while (curr <= endDate) {
        if (curr >= startDate) {
           const months = differenceInMonths(curr, anniversaryDate);
           if (months > 0) {
             const isYearly = months % 12 === 0;
             list.push({
               id: `auto-m-${months}`,
               coupleId,
               title: isYearly ? `${months/12}° Anniversario` : `${months}° Mese-versario`,
               date: format(curr, 'yyyy-MM-dd'),
               type: isYearly ? 'anniversary' : 'mensiversary',
               isAuto: true
             });
           } else if (months === 0) {
             list.push({
                id: 'auto-start',
                coupleId,
                title: 'Inizio del nostro viaggio 💖',
                date: format(curr, 'yyyy-MM-dd'),
                type: 'anniversary',
                isAuto: true
             });
           }
        }
        curr = addMonths(curr, 1);
      }
    }

    return list;
  }, [dates, couple.anniversaryDate, currentMonth]);

  // Determine if today is a special day for the background gradient
  const todaySpecialType = useMemo(() => {
    const today = new Date();
    const todayEvents = events.filter(e => isSameDay(parseISO(e.date), today));
    if (todayEvents.some(e => e.type === 'anniversary')) return 'anniversary';
    if (todayEvents.some(e => e.type === 'mensiversary')) return 'mensiversary';
    return null;
  }, [events]);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

  return (
    <div className="space-y-12 pb-12 max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="flex items-center space-x-3 text-pink-500 mb-2">
          <Heart size={20} strokeWidth={2.5} />
          <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.3em] font-bold">Il nostro tempo</span>
        </div>
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Il nostro Calendario</h1>
        <p className="text-slate-400 lg:text-lg font-light italic">Le date che hanno cambiato tutto.</p>
      </header>

      <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full lg:w-auto">
        <button 
          onClick={() => setShowAddDate(true)}
          className={`btn-primary flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-4 flex-1 lg:flex-none shadow-xl ${isDarkMode ? 'bg-pink-600 hover:bg-pink-700 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : 'shadow-pink-100'}`}
        >
          <Plus size={18} />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">Nuova Data</span>
        </button>
        <button 
          onClick={() => setIsDeleteMode(!isDeleteMode)}
          className={`flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-4 rounded-2xl transition-all border flex-1 lg:flex-none ${
            isDeleteMode 
              ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' 
              : (isDarkMode ? 'bg-slate-900 text-red-400 border-red-900/50 hover:bg-red-900/20 shadow-sm' : 'bg-white text-red-500 border-red-100 hover:bg-red-50 shadow-sm')
          }`}
        >
          {isDeleteMode ? <X size={18} /> : <Trash2 size={18} />}
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
            {isDeleteMode ? 'Annulla' : 'Elimina Data'}
          </span>
        </button>
      </div>

      <div className="space-y-10 relative z-10 w-full">
        {/* Calendar Grid */}
        <section className={`card p-6 sm:p-8 backdrop-blur-md ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white/70 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl sm:text-3xl lowercase italic font-serif ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </h2>
            <div className="flex space-x-2">
              <button onClick={prevMonth} className={`p-2 sm:p-3 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} className={`p-2 sm:p-3 rounded-full transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-7 gap-px border rounded-2xl overflow-hidden shadow-inner font-sans ${isDarkMode ? 'bg-slate-800 border-slate-800' : 'bg-slate-100 border-slate-100'}`}>
             {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
               <div key={d} className={`p-3 text-center text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 text-slate-500' : 'bg-slate-50/70 text-slate-400'}`}>
                 {d}
               </div>
             ))}
              {daysInMonth.map(day => {
                const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
                const deletableEvents = dayEvents.filter(e => !e.isAuto);
                const isMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={day.toISOString()} 
                    onClick={() => {
                      if (isDeleteMode && deletableEvents.length > 0) {
                        setDateToDelete(deletableEvents[0]);
                        setShowConfirmDelete(true);
                      }
                    }}
                    className={`h-12 sm:h-16 p-1 relative transition-colors flex flex-col items-center group border-b border-r ${isDarkMode ? 'border-slate-800/50' : 'border-slate-50'} ${!isMonth ? (isDarkMode ? 'opacity-10 bg-slate-950' : 'opacity-20 bg-slate-50/50') : (isDarkMode ? 'bg-slate-900/50' : 'bg-white')} ${isDeleteMode && deletableEvents.length > 0 ? 'cursor-pointer hover:bg-red-500/10 ring-inset ring-2 ring-transparent hover:ring-red-500/20' : ''}`}
                  >
                    <span className={`text-[10px] sm:text-xs font-bold z-10 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-xl transition-all ${isToday ? (isDarkMode ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(219,39,119,0.8)]' : 'bg-pink-500 text-white shadow-lg shadow-pink-200') : (isDarkMode ? 'text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-200' : 'text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-900')}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 flex flex-wrap justify-center gap-1 relative z-10 min-h-[0.3rem]">
                      {dayEvents.slice(0, 3).map(e => (
                        <div 
                         key={e.id} 
                         className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border shadow-sm ${isDarkMode ? 'border-slate-900' : 'border-white'} ${
                           e.type === 'anniversary' ? 'bg-pink-500' : 
                           e.type === 'mensiversary' ? 'bg-purple-500' :
                           e.type === 'birthday' ? 'bg-amber-400' :
                           'bg-indigo-400'
                         }`}
                         title={e.title}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center space-x-3 text-slate-400 pl-2">
            <Star size={14} className="text-pink-300" />
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold">Eventi di questo mese</h3>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {events
                .filter(e => isSameMonth(parseISO(e.date), currentMonth))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(e => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={e.id} 
                  className={`card p-4 group flex items-center space-x-3 border-l-4 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white shadow-sm'} ${
                   e.type === 'anniversary' ? 'border-l-pink-500 shadow-pink-50/50' : 
                   e.type === 'birthday' ? 'border-l-amber-400 shadow-amber-50/50' : 
                   e.type === 'mensiversary' ? 'border-l-purple-500 shadow-purple-50/50' :
                   'border-l-indigo-400 shadow-indigo-50/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                   e.type === 'anniversary' ? (isDarkMode ? 'bg-pink-900/30 text-pink-400' : 'bg-pink-50 text-pink-500') : 
                   e.type === 'birthday' ? (isDarkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-500') : 
                   e.type === 'mensiversary' ? (isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-500') :
                   (isDarkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-50 text-indigo-500')
                  }`}>
                    {e.type === 'anniversary' && <Heart size={18} />}
                    {e.type === 'birthday' && <Cake size={18} />}
                    {e.type === 'mensiversary' && <Star size={18} />}
                    {e.type === 'other' && <CalendarIcon size={18} />}
                  </div>
                  <div className="flex-grow min-w-0">
                     <p className={`text-[9px] uppercase font-bold tracking-widest mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                       {format(parseISO(e.date), 'EEEE d MMMM', { locale: it })}
                     </p>
                     <h4 className={`text-sm leading-tight truncate ${isDarkMode ? 'text-white/90' : 'text-slate-800'}`}>{e.title}</h4>
                  </div>
                  {!e.isAuto && (
                    <button 
                      onClick={() => {
                        setDateToDelete(e);
                        setShowConfirmDelete(true);
                      }}
                      className={`p-2 transition-all rounded-xl shadow-sm ${isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-red-200'}`}
                      title="Elimina"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {e.isAuto && (
                    <div className="absolute top-1 right-2 p-1 text-pink-500 italic text-[7px] font-black uppercase tracking-widest opacity-0">
                      Auto
                    </div>
                  )}
                </motion.div>
              ))}

             {events.filter(e => isSameMonth(parseISO(e.date), currentMonth)).length === 0 && (
               <div className="col-span-full text-center py-12 text-slate-400 italic font-light">
                 Nessun evento previsto per questo mese.
               </div>
             )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showAddDate && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}
             onClick={() => setShowAddDate(false)}
           />
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 20 }}
             className={`relative w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 space-y-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}
           >
             <h3 className={`text-2xl ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Aggiungi Data Importante</h3>
             <form className="space-y-4" onSubmit={async (e) => {
               e.preventDefault();
               const form = e.target as HTMLFormElement;
               const formData = new FormData(form);
               const newDate: ImportantDate = {
                 id: 'date-' + Date.now(),
                 coupleId,
                 title: formData.get('title') as string,
                 date: formData.get('date') as string,
                 type: formData.get('type') as any
               };
               await dbService.addDate(newDate);
               setShowAddDate(false);
             }}>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase">Titolo</label>
                 <input name="title" required type="text" className={`input w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-600' : ''}`} placeholder="es. Primo Bacio" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase">Data</label>
                 <input name="date" required type="date" className={`input w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-600 [color-scheme:dark]' : ''}`} />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-400 uppercase">Tipo</label>
                 <select name="type" className={`input w-full ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-600' : ''}`}>
                   <option value="other">Altro</option>
                   <option value="birthday">Compleanno</option>
                   <option value="anniversary">Anniversario</option>
                 </select>
               </div>
               <button type="submit" className={`btn-primary w-full py-4 mt-4 shadow-xl ${isDarkMode ? 'bg-pink-600 hover:bg-pink-700 shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : 'shadow-pink-100'}`}>Salva</button>
             </form>
           </motion.div>
         </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmDelete && dateToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6"
            onClick={() => { setShowConfirmDelete(false); setDateToDelete(null); }}
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className={`p-10 sm:p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center space-y-6 max-w-sm w-full text-center border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white/50'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-red-500/10 text-red-500 shadow-red-900/20' : 'bg-red-50 text-red-500 shadow-red-100/50'}`}>
                <HeartCrack size={48} className="animate-bounce" />
              </div>
              <div className="space-y-3">
                <h3 className={`text-3xl font-serif italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Sei sicuro?</h3>
                <p className="text-slate-400 font-light italic leading-relaxed">
                  Questa data verrà rimossa per sempre dal nostro calendario.
                </p>
                <div className={`py-2 px-4 rounded-2xl inline-block mt-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{dateToDelete.title}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {format(parseISO(dateToDelete.date), 'EEEE d MMMM', { locale: it })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col w-full gap-3 pt-2">
                <button 
                  onClick={async () => { 
                    await dbService.deleteDate(dateToDelete.id);
                    setShowConfirmDelete(false);
                    setDateToDelete(null);
                    setIsDeleteMode(false);
                  }} 
                  className={`btn-primary bg-red-500 hover:bg-red-600 w-full py-5 uppercase tracking-[0.2em] text-[10px] font-bold shadow-xl ${isDarkMode ? 'shadow-[0_10px_30px_-10px_rgba(219,39,119,0.5)]' : 'shadow-red-200'}`}
                >
                  Sì, elimina ora
                </button>
                <button 
                  onClick={() => { setShowConfirmDelete(false); setDateToDelete(null); }}
                  className={`btn-secondary w-full py-5 uppercase tracking-[0.2em] text-[10px] font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : ''}`}
                >
                  Annulla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
