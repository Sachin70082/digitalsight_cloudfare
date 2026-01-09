import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { AppContext } from '../App';
import { Label, Artist, Release, UserRole } from '../types';
import { Spinner } from './ui';

const UniversalSearch: React.FC = () => {
  const { user } = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ labels: Label[], artists: Artist[], releases: Release[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.trim().length > 1 && user) {
        setIsSearching(true);
        setIsOpen(true);
        try {
          const searchResults = await api.globalSearch(query, user);
          setResults(searchResults);
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults(null);
        if (!isFocused) setIsOpen(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query, user, isFocused]);

  const handleSelect = (type: 'release' | 'artist' | 'label', id: string) => {
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
    if (type === 'release') {
      const path = user?.role === UserRole.OWNER ? `/release/${id}` : `/releases/${id}`;
      navigate(path);
    } else if (type === 'artist') {
      navigate('/artists');
    } else if (type === 'label') {
      navigate('/network');
    }
  };

  const hasResults = results && (results.labels.length > 0 || results.artists.length > 0 || results.releases.length > 0);

  return (
    <>
      {/* Search Backdrop Dimmer */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 pointer-events-none ${isOpen && query.length > 1 ? 'opacity-100' : 'opacity-0'}`} 
      />

      <div className="relative w-full max-w-xl z-[100]" ref={containerRef}>
        <div className={`relative transition-all duration-300 transform ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
          <input
            type="text"
            placeholder="Search catalog, artists, UPC, ISRC..."
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-gray-700/40 border border-gray-600/50 rounded-full px-12 py-3 text-white placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-gray-800 focus:border-primary/50 backdrop-blur-md shadow-lg ${isFocused ? 'shadow-primary/10' : ''}`}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-300 group-focus-within:text-primary">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className={`w-5 h-5 transition-transform duration-300 ${isFocused ? 'scale-110 text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          {query && (
            <button 
              onClick={() => { setQuery(''); setResults(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors animate-fade-in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {isOpen && query.trim().length > 1 && (
          <div className="absolute top-full mt-3 w-full bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl z-[100] max-h-[75vh] overflow-hidden backdrop-blur-xl animate-slide-up origin-top">
            <div className="overflow-y-auto max-h-[75vh] custom-scrollbar p-2">
              {isSearching && !results && (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
                  <Spinner />
                  <p className="text-sm font-medium animate-pulse">Searching organization database...</p>
                </div>
              )}
              
              {results && !hasResults && !isSearching && (
                <div className="py-16 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-gray-400 font-medium">No results matched your search</p>
                  <p className="text-xs text-gray-500 mt-1">Try searching by artist name, UPC, or label ID</p>
                </div>
              )}

              {results && hasResults && (
                <div className="space-y-6 p-2">
                  {results.releases.length > 0 && (
                    <div className="animate-fade-in [animation-delay:50ms]">
                      <h4 className="px-3 py-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Releases
                      </h4>
                      <div className="space-y-1">
                        {results.releases.map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleSelect('release', r.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center gap-4 group"
                          >
                            <div className="relative flex-shrink-0">
                                <img src={r.artworkUrl} className="w-12 h-12 rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300" alt="" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{r.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-500 font-mono">UPC: {r.upc}</span>
                                <span className="text-gray-700">•</span>
                                <span className="text-[10px] text-gray-500 truncate">{r.catalogueNumber}</span>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.artists.length > 0 && (
                    <div className="animate-fade-in [animation-delay:100ms]">
                      <h4 className="px-3 py-2 text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Artists
                      </h4>
                      <div className="grid grid-cols-1 gap-1">
                        {results.artists.map(a => (
                          <button
                            key={a.id}
                            onClick={() => handleSelect('artist', a.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center gap-4 group"
                          >
                            <div className="w-11 h-11 bg-gradient-to-br from-green-900/40 to-black text-green-500 rounded-full flex items-center justify-center font-bold text-sm border border-green-500/20 shadow-lg group-hover:shadow-green-500/10 transition-all duration-300 group-hover:scale-105">
                                {a.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-green-400 transition-colors truncate">{a.name}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                                <span className="capitalize">{a.type}</span>
                                <span className="text-gray-700">•</span>
                                <span className="truncate">{a.email}</span>
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.084-1.28-.24-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.084-1.28.24-1.857m10.514 0A3 3 0 0017 13V6a3 3 0 00-3-3H9a3 3 0 00-3 3v7a3 3 0 001.486 2.643M12 10h.01M12 13h.01" /></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.labels.length > 0 && (
                    <div className="animate-fade-in [animation-delay:150ms]">
                      <h4 className="px-3 py-2 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Labels & Branches
                      </h4>
                      <div className="grid grid-cols-1 gap-1">
                        {results.labels.map(l => (
                          <button
                            key={l.id}
                            onClick={() => handleSelect('label', l.id)}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 flex items-center gap-4 group"
                          >
                            <div className="w-11 h-11 bg-blue-900/20 text-blue-400 rounded-xl flex items-center justify-center font-bold text-xs border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1m-1 4h1m6-12h1m-1 4h1m-1 4h1m-1 4h1" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">{l.name}</p>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">NETWORK ID: {l.id}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Shortcut Guide */}
            <div className="p-3 bg-white/5 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-500 uppercase tracking-widest font-bold">
               <div className="flex gap-4">
                  <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">ESC</kbd> to close</span>
                  <span className="flex items-center gap-1"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">↵</kbd> to select</span>
               </div>
               <span className="text-primary/50">MusicDistro spotlight</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};

export default UniversalSearch;