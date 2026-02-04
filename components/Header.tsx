
import React from 'react';

interface HeaderProps {
  videoName: string;
  onNew: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ videoName, onNew, onExport }) => {
  return (
    <header className="h-16 bg-[#0a0a0f] border-b border-white/5 px-8 flex items-center justify-between z-20 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onNew}>
          <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
            <i className="fas fa-film text-white text-sm"></i>
          </div>
          <span className="font-black text-xl tracking-tighter">Velvet<span className="text-violet-400">Cut</span></span>
        </div>
        
        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 text-slate-400 text-xs font-semibold max-w-[240px]">
          <i className="fas fa-file-video text-violet-400"></i>
          <span className="truncate">{videoName}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onNew}
          className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2"
        >
          <i className="fas fa-plus-circle"></i> New Session
        </button>
        <button 
          onClick={onExport}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-violet-500/10 active:scale-95"
        >
          <i className="fas fa-share-nodes"></i> Export Video
        </button>
      </div>
    </header>
  );
};

export default Header;