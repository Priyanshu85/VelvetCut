
import React from 'react';

interface WelcomeScreenProps {
  onUpload: (file: File) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-3xl w-full text-center space-y-12 z-10 animate-in fade-in zoom-in duration-700">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-[2rem] shadow-2xl shadow-violet-500/20 mb-4 transform rotate-3">
          <i className="fas fa-film text-4xl text-white"></i>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-7xl font-black text-white tracking-tighter">
            Velvet<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Cut</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">
            The studio-grade video editor that runs entirely in your browser. 
            Privacy first.
          </p>
        </div>

        <div className="relative group max-w-xl mx-auto">
          <label className="flex flex-col items-center justify-center w-full h-80 border border-white/5 rounded-[3rem] cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/50 transition-all duration-500 glass">
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <i className="fas fa-plus text-2xl text-violet-400"></i>
              </div>
              <p className="mb-2 text-xl font-bold text-white">
                Import your footage
              </p>
              <p className="text-sm text-slate-500 font-medium">Drag & drop or click to browse</p>
              <div className="mt-8 flex gap-4">
                 <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">MP4</span>
                 <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-white/5">WebM</span>
              </div>
            </div>
            <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
          </label>
        </div>

        <div className="flex justify-center gap-12 pt-8 border-t border-white/5">
          {[
            { label: 'Local Processing', icon: 'fa-shield-halved' },
            { label: 'Lossless Export', icon: 'fa-crown' },
            { label: 'Cloud-Free', icon: 'fa-cloud-slash' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <i className={`fas ${item.icon} text-violet-500/50 text-sm`}></i>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
