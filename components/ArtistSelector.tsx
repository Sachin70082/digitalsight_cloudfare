import React from 'react';
import { Artist } from '../types';

interface ArtistSelectorProps {
  label: string;
  allArtists: Artist[];
  selectedArtistIds: string[];
  onChange: (newIds: string[]) => void;
  disabledArtistIds?: string[];
}

const ArtistSelector: React.FC<ArtistSelectorProps> = ({
  label,
  allArtists,
  selectedArtistIds,
  onChange,
  disabledArtistIds = []
}) => {

  const handleAddArtist = (artistId: string) => {
    if (artistId && !selectedArtistIds.includes(artistId)) {
      onChange([...selectedArtistIds, artistId]);
    }
  };

  const handleRemoveArtist = (artistId: string) => {
    onChange(selectedArtistIds.filter(id => id !== artistId));
  };

  const selectedArtists = selectedArtistIds.map(id => allArtists.find(a => a.id === id)).filter(Boolean) as Artist[];
  const availableArtists = allArtists.filter(a => !selectedArtistIds.includes(a.id) && !disabledArtistIds.includes(a.id));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <div className="bg-gray-700 border border-gray-600 rounded-md p-2 min-h-[42px]">
        {selectedArtists.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedArtists.map(artist => (
              <span key={artist.id} className="bg-primary text-white text-sm font-semibold px-2 py-1 rounded-full flex items-center gap-2">
                {artist.name}
                <button
                  type="button"
                  onClick={() => handleRemoveArtist(artist.id)}
                  className="bg-primary-dark rounded-full h-4 w-4 flex items-center justify-center text-xs"
                  aria-label={`Remove ${artist.name}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center">
          <select
            value=""
            onChange={(e) => handleAddArtist(e.target.value)}
            className="w-full bg-gray-600 border border-gray-500 rounded-md px-3 py-1 text-white text-sm"
          >
            <option value="">{selectedArtists.length > 0 ? 'Add another artist...' : 'Select artist...'}</option>
            {availableArtists.map(artist => (
              <option key={artist.id} value={artist.id}>{artist.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ArtistSelector;
