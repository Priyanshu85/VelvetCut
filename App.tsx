
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoState, CropArea, FilterType } from './types';
import VideoPlayer from './components/VideoPlayer';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import ExportModal from './components/ExportModal';

const App: React.FC = () => {
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setVideoState({
      url,
      name: file.name,
      type: file.type,
      duration: 0,
      currentTime: 0,
      isPlaying: false,
      startTime: 0,
      endTime: 0,
      crop: { x: 0, y: 0, width: 100, height: 100 },
      filter: 'none',
      playbackRate: 1,
    });
  };

  const updateVideoState = useCallback((updates: Partial<VideoState>) => {
    setVideoState(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  useEffect(() => {
    if (videoRef.current && videoState) {
      if (videoState.isPlaying) {
        videoRef.current.play().catch(() => {
          updateVideoState({ isPlaying: false });
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [videoState?.isPlaying, updateVideoState]);

  useEffect(() => {
    if (videoState && videoState.currentTime >= videoState.endTime && videoState.isPlaying) {
      if (videoRef.current) {
        videoRef.current.currentTime = videoState.startTime;
      }
    }
  }, [videoState?.currentTime, videoState?.endTime, videoState?.startTime, videoState?.isPlaying]);

  if (!videoState) {
    return <WelcomeScreen onUpload={handleFileUpload} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Header 
        videoName={videoState.name} 
        onNew={() => setVideoState(null)} 
        onExport={() => setIsExporting(true)} 
      />
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 relative">
          {/* Main workspace for the video */}
          <div className="flex-1 relative flex items-center justify-center p-6 sm:p-12 lg:p-20 overflow-hidden">
             <VideoPlayer 
               ref={videoRef}
               state={videoState}
               onTimeUpdate={(t) => updateVideoState({ currentTime: t })}
               onDurationChange={(d) => updateVideoState({ duration: d, endTime: d })}
               onCropChange={(crop) => updateVideoState({ crop })}
             />
          </div>
          
          <div className="h-64 bg-slate-950/90 border-t border-slate-800 p-6 backdrop-blur-xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <Timeline 
              state={videoState} 
              onSeek={(time) => {
                if (videoRef.current) videoRef.current.currentTime = time;
                updateVideoState({ currentTime: time });
              }}
              onTrimChange={(start, end) => updateVideoState({ startTime: start, endTime: end })}
              onTogglePlay={() => updateVideoState({ isPlaying: !videoState.isPlaying })}
            />
          </div>
        </div>

        <Sidebar 
          state={videoState} 
          onUpdate={updateVideoState} 
        />
      </main>

      {isExporting && (
        <ExportModal 
          videoState={videoState} 
          onClose={() => setIsExporting(false)} 
        />
      )}
    </div>
  );
};

export default App;
