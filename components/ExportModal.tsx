
import React, { useState, useEffect, useRef } from 'react';
import { VideoState } from '../types';

interface ExportModalProps {
  videoState: VideoState;
  onClose: () => void;
}

interface FormatOption {
  label: string;
  mimeType: string;
  extension: string;
  isNative: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ videoState, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Settings
  const [selectedFormat, setSelectedFormat] = useState<string>('video/webm;codecs=vp9,opus');
  const [qualityLevel, setQualityLevel] = useState<number>(10); // 1-10, default to max for "Same Quality"
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Detect supported formats
  const formats: FormatOption[] = [
    { label: 'Original / High Quality', mimeType: videoState.type, extension: videoState.type.split('/')[1] || 'mp4', isNative: true },
    { label: 'WebM (VP9 - High Quality)', mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm', isNative: false },
    { label: 'WebM (VP8 - Balanced)', mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm', isNative: false },
    { label: 'MP4 (Standard)', mimeType: 'video/mp4;codecs=h264', extension: 'mp4', isNative: false },
  ].filter(f => MediaRecorder.isTypeSupported(f.mimeType));

  // Initialize format based on input if supported
  useEffect(() => {
    if (MediaRecorder.isTypeSupported(videoState.type)) {
      setSelectedFormat(videoState.type);
    } else if (formats.length > 0) {
      setSelectedFormat(formats[0].mimeType);
    }
  }, [videoState.type]);

  const startExport = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setStatus('exporting');
    setProgress(0);
    chunksRef.current = [];

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Highest quality is around 25mbps
    const baseBitrate = qualityLevel * 2500000; 
    
    canvas.width = video.videoWidth * (videoState.crop.width / 100);
    canvas.height = video.videoHeight * (videoState.crop.height / 100);

    const stream = canvas.captureStream(30); 
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);
      if (destination.stream.getAudioTracks().length > 0) {
        stream.addTrack(destination.stream.getAudioTracks()[0]);
      }
    } catch (e) {
      console.warn("Audio capture failed", e);
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: selectedFormat,
      videoBitsPerSecond: baseBitrate
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: selectedFormat.split(';')[0] });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus('completed');
    };

    recorderRef.current = recorder;
    
    const totalTime = videoState.endTime - videoState.startTime;
    video.currentTime = videoState.startTime;
    
    video.onseeked = () => {
      if (status === 'error' || recorder.state !== 'inactive') return;

      const drawFrame = () => {
        if (!ctx || !video) return;

        ctx.filter = getCanvasFilter();
        
        const sx = video.videoWidth * (videoState.crop.x / 100);
        const sy = video.videoHeight * (videoState.crop.y / 100);
        const sw = video.videoWidth * (videoState.crop.width / 100);
        const sh = video.videoHeight * (videoState.crop.height / 100);
        
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        
        const currentProgress = (video.currentTime - videoState.startTime) / totalTime;
        setProgress(Math.min(currentProgress * 100, 100));

        if (video.currentTime < videoState.endTime && !video.paused) {
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
          video.pause();
        }
      };

      recorder.start();
      video.play();
      drawFrame();
    };
  };

  const getCanvasFilter = () => {
    switch (videoState.filter) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'invert': return 'invert(100%)';
      case 'blur': return 'blur(4px)';
      case 'brightness': return 'brightness(150%)';
      case 'contrast': return 'contrast(150%)';
      default: return 'none';
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      const formatObj = formats.find(f => f.mimeType === selectedFormat);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = formatObj?.extension || (selectedFormat.includes('mp4') ? 'mp4' : 'webm');
      a.download = `cloudcut_${videoState.name.split('.')[0]}.${extension}`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-xl shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <i className="fas fa-file-export text-indigo-500"></i> Export
            </h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800/50 relative overflow-hidden">
              {status === 'idle' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] block">Format & Compatibility</label>
                    <div className="grid grid-cols-1 gap-3">
                      {formats.map(f => (
                        <button
                          key={f.mimeType}
                          onClick={() => setSelectedFormat(f.mimeType)}
                          className={`flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all ${
                            selectedFormat === f.mimeType 
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)]' 
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                             <span className="font-bold">{f.label}</span>
                             <span className="text-[10px] opacity-60 uppercase tracking-widest">{f.extension}</span>
                          </div>
                          {selectedFormat === f.mimeType && <i className="fas fa-check-circle text-xl"></i>}
                        </button>
                      ))}
                      {!formats.some(f => f.mimeType.includes('mp4')) && (
                        <p className="text-[10px] text-slate-500 px-2 italic">
                          <i className="fas fa-info-circle mr-1"></i> Your browser doesn't support native MP4 encoding. WebM is used for high-quality lossless export.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Encoding Quality</label>
                      <span className="text-indigo-400 font-black font-mono">
                        {qualityLevel === 10 ? 'Match Source' : qualityLevel > 7 ? 'Pro' : 'Optimized'}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={qualityLevel}
                      onChange={(e) => setQualityLevel(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-black uppercase tracking-widest">
                      <span>Low Bitrate</span>
                      <span>High Bitrate (Lossless)</span>
                    </div>
                  </div>

                  <button 
                    onClick={startExport}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-[0_25px_50px_-12px_rgba(79,70,229,0.5)] active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-rocket"></i> RENDER VIDEO
                  </button>
                </div>
              )}

              {status === 'exporting' && (
                <div className="py-12 space-y-8 text-center">
                  <div className="relative inline-flex flex-col items-center">
                    <div className="w-32 h-32 border-[6px] border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Done</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black">Synthesizing...</h3>
                    <p className="text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">Encoding with hardware acceleration. Keep this window active for speed.</p>
                  </div>
                </div>
              )}

              {status === 'completed' && (
                <div className="py-8 text-center space-y-8">
                  <div className="w-28 h-28 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-5xl shadow-[0_0_60px_rgba(16,185,129,0.2)] animate-in zoom-in duration-500">
                    <i className="fas fa-check-double"></i>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black">Export Success!</h3>
                    <p className="text-slate-500 text-sm">Your masterpiece is ready for the world.</p>
                  </div>
                  <button 
                    onClick={handleDownload}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black text-xl transition-all shadow-[0_25px_50px_-12px_rgba(16,185,129,0.4)] active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <i className="fas fa-download"></i> SAVE TO DEVICE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden">
          <canvas ref={canvasRef} />
          <video ref={videoRef} src={videoState.url} muted crossOrigin="anonymous" />
        </div>
        
        <div className="bg-slate-950/80 p-8 flex justify-center border-t border-slate-800/30">
          <button 
            onClick={onClose}
            className="text-xs font-black text-slate-500 hover:text-indigo-400 uppercase tracking-[0.3em] transition-all"
          >
            {status === 'completed' ? 'FINISH' : 'CANCEL PROCESS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
