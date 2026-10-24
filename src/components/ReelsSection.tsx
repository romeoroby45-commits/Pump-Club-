import React, { useState } from 'react';
import { Film, Play, Volume2, VolumeX, PlusCircle, Video as VideoIcon, ExternalLink } from 'lucide-react';
import { GymReel } from '../types';
import { parseVideoUrl } from '../utils/videoHelper';

interface ReelsSectionProps {
  reels: GymReel[];
  onOpenAdmin?: () => void;
}

export const ReelsSection: React.FC<ReelsSectionProps> = ({ reels, onOpenAdmin }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});

  const toggleMute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedStates(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  return (
    <section id="reels" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-neutral-950/40 rounded-3xl border border-neutral-900 my-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-neutral-800/80 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-widest mb-2">
            <Film className="w-4 h-4" />
            <span>PUMP CLUB</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-display">
            Pump Club Reels
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base mt-1.5 font-medium">
            Training, energy & real gym moments.
          </p>
        </div>

        {reels.length > 0 && (
          <div className="text-neutral-400 text-xs sm:text-sm font-semibold">
            Reels: <span className="text-red-500 font-display font-bold text-base">{reels.length}</span>
          </div>
        )}
      </div>

      {/* Reels Grid or Clean Empty State */}
      {reels.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900/60 border border-neutral-800 p-12 sm:p-16 text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center mx-auto mb-6 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <VideoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display uppercase">
            Pump Club Reels
          </h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
            Training, energy & real gym moments. Add video reels anytime from the dashboard.
          </p>

          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-bold rounded-lg border border-neutral-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-red-500" />
              <span>إضافة فيديو أو ريل من لوحة التحكم</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
          {reels.map((reel) => {
            const videoInfo = parseVideoUrl(reel.url);
            const isMuted = mutedStates[reel.id] ?? true;
            const isFeatured = reel.size === 'featured';
            const fitMode = reel.fitMode || 'cover';
            const fitClass = fitMode === 'contain' ? 'object-contain' : 'object-cover';

            // Aspect ratio mapping
            let aspectClass = 'aspect-[9/16]';
            let ratioLabel = '9:16';
            if (reel.aspectRatio === '16:9') {
              aspectClass = 'aspect-video';
              ratioLabel = '16:9';
            } else if (reel.aspectRatio === '1:1') {
              aspectClass = 'aspect-square';
              ratioLabel = '1:1';
            } else if (reel.aspectRatio === '4:5') {
              aspectClass = 'aspect-[4/5]';
              ratioLabel = '4:5';
            } else if (reel.aspectRatio === '4:3') {
              aspectClass = 'aspect-[4/3]';
              ratioLabel = '4:3';
            }

            return (
              <div
                key={reel.id}
                className={`group relative rounded-2xl overflow-hidden bg-neutral-900/90 border border-neutral-800 hover:border-red-600/80 transition-all duration-300 flex flex-col shadow-xl ${
                  isFeatured ? 'sm:col-span-2 lg:col-span-2' : 'col-span-1'
                }`}
              >
                {/* Video Media Container with Dynamic Aspect Ratio */}
                <div className={`relative ${aspectClass} bg-black overflow-hidden flex items-center justify-center w-full`}>
                  {videoInfo.type === 'youtube' && videoInfo.embedUrl ? (
                    <iframe
                      src={videoInfo.embedUrl}
                      title={reel.title || 'Gym Reel'}
                      className="w-full h-full border-0"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : videoInfo.type === 'direct' && videoInfo.directUrl ? (
                    <div className="relative w-full h-full bg-black flex items-center justify-center">
                      <video
                        src={videoInfo.directUrl}
                        className={`w-full h-full ${fitClass}`}
                        loop
                        playsInline
                        muted={isMuted}
                        autoPlay={playingId === reel.id}
                        controls
                      />
                    </div>
                  ) : (
                    <div className="p-6 text-center flex flex-col items-center justify-center h-full">
                      <VideoIcon className="w-12 h-12 text-neutral-600 mb-3" />
                      <p className="text-xs text-neutral-400 mb-3">رابط خارجي للمقطع</p>
                      <a
                        href={reel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 text-white rounded text-xs font-bold hover:bg-red-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح الفيديو</span>
                      </a>
                    </div>
                  )}

                  {/* Orientation & Size Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                    {isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[10px] shadow">
                        مميز
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-neutral-700/80 text-neutral-300 font-mono text-[10px]">
                      {ratioLabel}
                    </span>
                  </div>
                </div>

                {/* Reel Info */}
                <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
                  <div className="truncate flex-1">
                    <h4 className="text-white font-bold text-sm truncate">
                      {reel.title || 'تمرين في PUMP CLUB'}
                    </h4>
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <span>فيديو وتدريبات</span>
                      <span className="text-neutral-600">•</span>
                      <span>{fitMode === 'contain' ? 'عرض كامل' : 'ملء الإطار'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
