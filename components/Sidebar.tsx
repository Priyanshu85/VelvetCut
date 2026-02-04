
import React from 'react';
import { VideoState, FilterType, CropArea } from '../types';

interface SidebarProps {
  state: VideoState;
  onUpdate: (updates: Partial<VideoState>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ state, onUpdate }) => {
  const filters: { type: FilterType; label: string; icon: string }[] = [
    { type: 'none', label: 'Raw', icon: 'fa-circle-dot' },
    { type: 'grayscale', label: 'Noir', icon: 'fa-moon' },
    { type: 'sepia', label: 'Vintage', icon: 'fa-leaf' },
    { type: 'invert', label: 'Negative', icon: 'fa-eye-low-vision' },
    { type: 'blur', label: 'Cinematic', icon: 'fa-wind' },
    { type: 'brightness', label: 'Daylight', icon: 'fa-sun' },
    { type: 'contrast', label: 'Bold', icon: 'fa-bolt' },
  ];

  const presets = [
    { label: 'Source Canvas', crop: { x: 0, y: 0, width: 100, height: 100 } },
    { label: 'Social Square (1:1)', crop: { x: 25, y: 0, width: 50, height: 100 } },
    { label: 'Reels / Shorts (9:16)', crop: { x: 35, y: 0, width: 30, height: 100 } },
    { label: 'Cinematic Focus', crop: { x: 15, y: 15, width: 70, height: 70 } },
  ];

  return (
    <aside className="w-80 bg-[#0a0a0f] border-l border-white/5 p-8 flex flex-col gap-10 overflow-y-auto">
      <section>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6">Visual Filters</h3>
        <div className="grid grid-cols-2 gap-3">
          {filters.map((f) => (
            <button
              key={f.type}
              onClick={() => onUpdate({ filter: f.type })}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                state.filter === f.type 
                  ? 'bg-violet-600/10 border-violet-500/50 text-white shadow-lg shadow-violet-500/5' 
                  : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              <i className={`fas ${f.icon} text-lg mb-2 ${state.filter === f.type ? 'text-violet-400' : 'text-slate-700'}`}></i>
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6">Composition</h3>
        <div className="space-y-3">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => onUpdate({ crop: p.crop })}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-xs font-bold transition-all border ${
                JSON.stringify(state.crop) === JSON.stringify(p.crop)
                  ? 'bg-white/5 border-violet-500/50 text-white'
                  : 'bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
              }`}
            >
              <span className="tracking-tight">{p.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${JSON.stringify(state.crop) === JSON.stringify(p.crop) ? 'bg-violet-500 animate-pulse' : 'bg-slate-800'}`}></div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6">Mastering Speed</h3>
        <div className="grid grid-cols-4 bg-white/[0.02] p-1 rounded-2xl border border-white/5">
          {[0.5, 1, 1.5, 2].map(speed => (
            <button
              key={speed}
              onClick={() => onUpdate({ playbackRate: speed })}
              className={`py-3 text-[10px] font-black rounded-xl transition-all ${
                state.playbackRate === speed ? 'bg-violet-600 text-white shadow-xl' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </section>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          <span>Target Duration</span>
          <span className="text-violet-400">{(state.endTime - state.startTime).toFixed(2)}s</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500" 
            style={{ width: `${((state.endTime - state.startTime) / state.duration) * 100}%` }}
          ></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;