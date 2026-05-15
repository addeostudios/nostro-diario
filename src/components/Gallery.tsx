import { useState, useEffect, useMemo, FC } from 'react';
import { Photo, Badge } from '../types';
import { dbService } from '../services/db';
import { 
  Search, 
  Tag as TagIcon,
  ChevronLeft,
  Settings,
  FolderHeart,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import BadgeManager from './BadgeManager';
import PhotoDetailModal from './PhotoDetailModal';

interface GalleryProps {
  coupleId: string;
  badges: Badge[];
  isDarkMode: boolean;
}

export default function Gallery({ coupleId, badges, isDarkMode }: GalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isBadgeManagerOpen, setIsBadgeManagerOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [githubConfigured, setGithubConfigured] = useState<boolean | null>(null);
  
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const unsubPhotos = dbService.subscribePhotos(coupleId, setPhotos);
    
    fetch('/api/github-config-check')
      .then(r => r.json())
      .then(data => setGithubConfigured(data.configured))
      .catch(() => setGithubConfigured(false));

    return () => {
      unsubPhotos();
    };
  }, [coupleId]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      const matchesBadge = selectedBadge ? p.badges?.includes(selectedBadge) : true;
      const matchesSearch = searchQuery 
        ? p.description?.toLowerCase().includes(searchQuery.toLowerCase()) 
        : true;
      return matchesBadge && matchesSearch;
    });
  }, [photos, selectedBadge, searchQuery]);

  // Group photos by month for the main view
  const groupedPhotos = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    filteredPhotos.forEach(photo => {
      const date = parseISO(photo.dateTaken);
      const key = format(date, 'yyyy-MM');
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredPhotos]);

  const getDisplayUrl = (url: string) => {
    // If it's a raw github URL, convert it to our proxy URL
    if (url.includes('raw.githubusercontent.com')) {
      const parts = url.split('/main/');
      if (parts.length > 1) {
        return `/api/photo-proxy?path=${encodeURIComponent(parts[1])}`;
      }
    }
    return url;
  };

  const handleDelete = async (photo: Photo) => {
    try {
      // 1. Delete from Firestore first (user sees immediate effect in UI through callback)
      await dbService.deletePhoto(photo.id);
      
      // 2. Delete from GitHub in background
      fetch('/api/delete-from-github', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: photo.id,
          coupleId
        })
      }).catch(err => console.error('GitHub delete failed in background', err));

    } catch (e) {
      console.error('Delete failed', e);
      alert('Errore durante l\'eliminazione del ricordo.');
    }
  };

  return (
    <div className="space-y-12 pb-12 max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="flex items-center space-x-3 text-pink-500 mb-2">
          <FolderHeart size={20} strokeWidth={2.5} />
          <span className="text-[10px] sm:text-[12px] uppercase tracking-[0.3em] font-bold">I nostri momenti</span>
        </div>
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>I nostri Ricordi</h1>
        <p className="text-slate-400 lg:text-lg font-light italic">Tutti i momenti custoditi con amore.</p>
      </header>

      {githubConfigured === false && (
        <div className={`p-6 border rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 ${isDarkMode ? 'bg-amber-900/20 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-amber-900 text-amber-200' : 'bg-amber-100 text-amber-600'}`}>
               <Settings size={24} />
            </div>
            <div>
              <p className={`font-medium ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>Configurazione GitHub incompleta</p>
              <p className={`text-sm font-light ${isDarkMode ? 'text-amber-300/60' : 'text-amber-700/80'}`}>
                Assicurati che <strong>GITHUB_TOKEN</strong> e <strong>REPOSITIVO_GITHUB</strong> siano attive per l'ambiente di Produzione su Vercel e effettua un Redeploy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      {!selectedMonth && (
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="cerca tra i ricordi..." 
                className={`input w-full pr-14 pl-6 py-4 shadow-sm focus:shadow-lg transition-all text-sm lowercase italic ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-700' : ''}`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className={`absolute right-5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} size={20} />
            </div>
            <button 
              onClick={() => setIsBadgeManagerOpen(true)}
              className={`w-14 h-14 border rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-sm grow-0 sm:grow-0 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-200' : 'bg-white border-slate-50 text-slate-400 hover:text-slate-900 hover:shadow-md'}`}
              title="Gestisci Badge"
            >
              <TagIcon size={24} />
            </button>
          </div>

          <div className="w-full overflow-hidden">
            <div className="flex items-center gap-4 overflow-x-auto pb-6 no-scrollbar touch-pan-x snap-x scroll-smooth overscroll-x-contain">
              <button 
                onClick={() => setSelectedBadge(null)}
                className={`px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all whitespace-nowrap shrink-0 snap-start shadow-sm hover:shadow-md ${!selectedBadge ? (isDarkMode ? 'bg-pink-600 text-white shadow-lg shadow-[0_5px_20px_-5px_rgba(219,39,119,0.5)]' : 'bg-slate-900 text-white shadow-lg') : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-500 hover:bg-slate-800' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50')}`}
              >
                Tutti
              </button>
              {badges.map(badge => (
                <button 
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge.id)}
                  className={`px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all whitespace-nowrap flex items-center space-x-3 border-transparent border shrink-0 snap-start shadow-sm hover:shadow-md ${isDarkMode && selectedBadge !== badge.id ? 'bg-slate-900 border-slate-800' : ''}`}
                  style={{ 
                    backgroundColor: selectedBadge === badge.id ? badge.color : (isDarkMode ? undefined : 'white'),
                    color: selectedBadge === badge.id ? 'white' : badge.color,
                    borderColor: selectedBadge === badge.id ? 'transparent' : `${badge.color}33`,
                    boxShadow: selectedBadge === badge.id ? `0 10px 20px -5px ${badge.color}${isDarkMode ? 'cc' : '66'}` : 'none'
                  }}
                >
                  <div 
                    className={`w-2 h-2 rounded-full transition-transform ${selectedBadge === badge.id ? 'scale-125' : ''}`} 
                    style={{ backgroundColor: selectedBadge === badge.id ? 'white' : badge.color }}
                  />
                  <span>{badge.name}</span>
                </button>
              ))}
              <div className="w-8 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </section>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {!selectedMonth ? (
          // --- ALBUM LIST VIEW ---
          <motion.div 
            key="albums"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
          >
            {groupedPhotos.length === 0 ? (
              <div className={`lg:col-span-3 text-center py-24 border-dashed border-2 rounded-[3rem] ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-100'}`}>
                <FolderHeart size={48} className="mx-auto mb-4 text-slate-200 opacity-20" />
                <p className="text-slate-400 italic">Nessun ricordo trovato. Inizia a caricare!</p>
              </div>
            ) : (
              groupedPhotos.map(([monthKey, monthPhotos]) => (
                <AlbumCard 
                  key={monthKey}
                  monthKey={monthKey}
                  photos={monthPhotos}
                  onClick={() => setSelectedMonth(monthKey)}
                  getDisplayUrl={getDisplayUrl}
                  isDarkMode={isDarkMode}
                />
              ))
            )}
          </motion.div>
        ) : (
          // --- MONTH DETAIL VIEW ---
          <motion.div 
            key="month-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedMonth(null)}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors py-2 group"
            >
              <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Torna ai Mesi</span>
            </button>

            <div className="flex items-center space-x-6">
              <h2 className={`text-4xl italic lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {format(parseISO(`${selectedMonth}-01`), 'MMMM yyyy', { locale: it })}
              </h2>
              <div className={`px-4 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-400'}`}>
                {filteredPhotos.filter(p => format(parseISO(p.dateTaken), 'yyyy-MM') === selectedMonth).length} Foto
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPhotos
                .filter(p => format(parseISO(p.dateTaken), 'yyyy-MM') === selectedMonth)
                .map(photo => (
                  <motion.div 
                    layoutId={`photo-${photo.id}`}
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`aspect-square rounded-[2rem] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 group ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}
                  >
                    <img 
                      src={getDisplayUrl(photo.url)} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BadgeManager 
        isOpen={isBadgeManagerOpen}
        onClose={() => setIsBadgeManagerOpen(false)}
        coupleId={coupleId}
        badges={badges}
        isDarkMode={isDarkMode}
      />

      <AnimatePresence>
        {selectedPhoto && (
          <PhotoDetailModal 
            allPhotos={filteredPhotos.filter(p => format(parseISO(p.dateTaken), 'yyyy-MM') === selectedMonth).map(p => ({
              ...p,
              url: getDisplayUrl(p.url)
            }))}
            initialIndex={filteredPhotos.filter(p => format(parseISO(p.dateTaken), 'yyyy-MM') === selectedMonth).findIndex(p => p.id === selectedPhoto.id)}
            badges={badges}
            onClose={() => setSelectedPhoto(null)}
            onDelete={handleDelete}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface AlbumCardProps {
  monthKey: string;
  photos: Photo[];
  onClick: () => void;
  getDisplayUrl: (url: string) => string;
  isDarkMode: boolean;
}

const AlbumCard: FC<AlbumCardProps> = ({ monthKey, photos, onClick, getDisplayUrl, isDarkMode }) => {
  const coverPhoto = photos[0];
  const date = parseISO(`${monthKey}-01`);

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      onClick={onClick}
      className="group cursor-pointer space-y-3"
    >
      <div className={`aspect-[4/5] relative p-2 rounded-[2rem] shadow-sm group-hover:shadow-xl transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
        <div className="w-full h-full rounded-[1.4rem] overflow-hidden relative">
          <img 
            src={getDisplayUrl(coverPhoto.url)} 
            alt={monthKey} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <FolderHeart size={16} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{photos.length} ricordi</span>
          </div>
        </div>
      </div>
      
      <div className="px-4 text-center">
        <h3 className={`text-xl italic lowercase leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          {format(date, 'MMMM', { locale: it })}
        </h3>
        <p className="text-[8px] uppercase tracking-[0.3em] text-slate-300 font-bold mt-0.5">
          {format(date, 'yyyy')}
        </p>
      </div>
    </motion.div>
  );
};

