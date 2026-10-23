import React, { useState } from 'react';
import { Camera, Maximize2, X, ChevronLeft, ChevronRight, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { GymPhoto } from '../types';

interface GymPhotosSectionProps {
  photos: GymPhoto[];
  onOpenAdmin?: () => void;
}

export const GymPhotosSection: React.FC<GymPhotosSectionProps> = ({ photos, onOpenAdmin }) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
    }
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null && photos.length > 0) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section id="photos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-neutral-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest mb-2">
            <Camera className="w-4 h-4" />
            <span>PUMP CLUB</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-display">
            Gym Gallery
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-1.5 font-medium">
            A look inside Pump Club.
          </p>
        </div>

        {photos.length > 0 && (
          <div className="text-neutral-400 text-xs sm:text-sm font-semibold">
            Photos: <span className="text-red-500 font-display font-bold text-base">{photos.length}</span>
          </div>
        )}
      </div>

      {/* Gallery Content or Clean Empty State */}
      {photos.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900/60 border border-neutral-800 p-12 sm:p-16 text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center mx-auto mb-6 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display uppercase">
            Gym Gallery
          </h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
            A look inside Pump Club. Photos can be added anytime from the dashboard.
          </p>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-bold rounded-lg border border-neutral-700 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-red-500" />
              <span>إضافة صور من لوحة التحكم</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              onClick={() => openLightbox(index)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/80 cursor-pointer shadow-md hover:border-red-600 transition-all duration-300"
            >
              <img
                src={photo.url}
                alt={photo.title || `Pump Club Gym Photo ${index + 1}`}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback container on image error
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Content Badge */}
              <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                    {photo.title || 'صالة تدريب PUMP CLUB'}
                  </h4>
                  <span className="text-[11px] text-neutral-400">انقر للتكبير والتصفح</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-600/90 text-white flex items-center justify-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={closeLightbox}
            aria-label="إغلاق المعرض"
            className="absolute top-6 left-6 p-2 rounded-full bg-neutral-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Controls */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                aria-label="الصورة السابقة"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer z-50"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={nextPhoto}
                aria-label="الصورة التالية"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-red-600 text-white transition-colors cursor-pointer z-50"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
          >
            <img
              src={photos[selectedPhotoIndex].url}
              alt={photos[selectedPhotoIndex].title || 'Pump Club Gym Photo'}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-neutral-800"
              referrerPolicy="no-referrer"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white font-bold text-lg">
                {photos[selectedPhotoIndex].title || 'PUMP CLUB'}
              </h3>
              <p className="text-neutral-400 text-xs mt-1">
                صورة {selectedPhotoIndex + 1} من {photos.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
