
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { VideoState } from '../types';

interface TimelineProps {
  state: VideoState;
  onSeek: (time: number) => void;
  onTrimChange: (start: number, end: number) => void;
  onTogglePlay: () => void;
}

type DragType = 'scrub' | 'start' | 'end' | null;

const Timeline: React.FC<TimelineProps> = ({ state, onSeek, onTrimChange, onTogglePlay }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragType, setDragType] = useState<DragType>(null);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const getTimeAtPosition = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return percentage * state.duration;
  }, [state.duration]);

  const handleMouseDown = (e: React.MouseEvent, type: DragType) => {
    e.stopPropagation();
    setDragType(type);
    
    if (type === 'scrub') {
      onSeek(getTimeAtPosition(e.clientX));
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragType) return;
      
      const newTime = getTimeAtPosition(e.clientX);

      if (dragType === 'scrub') {
        onSeek(newTime);
      } else if (dragType === 'start') {
        const clampedStart = Math.max(0, Math.min(newTime, state.endTime - 0.1));
        onTrimChange(clampedStart, state.endTime);
      } else if (dragType === 'end') {
        const clampedEnd = Math.max(state.startTime + 0.1, Math.min(newTime, state.duration));
        onTrimChange(state.startTime, clampedEnd);
      }
    };

    const handleMouseUp = () => {
      setDragType(null);
    };

    if (dragType) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragType, getTimeAtPosition, onSeek, onTrimChange, state.startTime, state.endTime, state.duration]);

  const startPercent = (state.startTime / state.duration) * 100;
  const endPercent = (state.endTime / state.duration) * 100;
  const currentPercent = (state.currentTime / state.duration) * 100;

  return (
    <div className="flex flex-col h-full gap-6 select-none">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90 border border-white/5"
          >
            <i className={`fas ${state.isPlaying ? 'fa-pause' : 'fa-play'} text-lg`}></i>
          </button>
          <div className="flex items-baseline gap-2 font-black">
            <span className="text-2xl text-white tracking-tighter">{formatTime(state.currentTime)}</span>
            <span className="text-slate-600 text-sm">/</span>
            <span className="text-slate-500 text-sm tracking-tighter">{formatTime(state.duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="text-[10px] text-violet-400 uppercase tracking-[0.2em] font-black bg-violet-600/10 px-4 py-2 rounded-xl border border-violet-500/20 shadow-xl">
            Selected: {(state.endTime - state.startTime).toFixed(2)}s
           </div>
        </div>
      </div>

      <div className="relative h-20 bg-black/40 rounded-3xl border border-white/5 p-4 flex flex-col justify-center">
        <div 
          ref={timelineRef}
          className={`relative h-12 bg-white/[0.02] rounded-xl overflow-hidden group ${dragType === 'scrub' ? 'cursor-grabbing' : 'cursor-pointer'}`}
          onMouseDown={(e) => handleMouseDown(e, 'scrub')}
        >
          {/* Waveform Visualization */}
          <div className="absolute inset-0 flex items-center justify-around opacity-5 px-4 pointer-events-none">
            {[...Array(100)].map((_, i) => (
              <div 
                key={i} 
                className="w-0.5 bg-violet-500 rounded-full" 
                style={{ height: `${20 + Math.abs(Math.sin(i * 0.2)) * 60}%` }}
              ></div>
            ))}
          </div>

          {/* Out-of-bounds dimming */}
          <div className="absolute inset-y-0 left-0 bg-black/60 z-10 border-r border-white/10" style={{ width: `${startPercent}%` }}></div>
          <div className="absolute inset-y-0 right-0 bg-black/60 z-10 border-l border-white/10" style={{ width: `${100 - endPercent}%` }}></div>

          {/* Active trim range highlight */}
          <div 
            className="absolute h-full bg-violet-500/10 z-0"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`
            }}
          ></div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_20px_rgba(255,255,255,1)] z-40 pointer-events-none"
            style={{ left: `${currentPercent}%` }}
          >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 rounded-sm border-4 border-black"></div>
          </div>
        </div>

        {/* Trimming Handles */}
        <div className="absolute inset-x-4 top-4 bottom-4 pointer-events-none">
          {/* Start Handle */}
          <div 
            className={`absolute top-0 bottom-0 w-10 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto ${dragType === 'start' ? 'cursor-grabbing' : 'cursor-col-resize'}`}
            style={{ left: `${startPercent}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'start')}
          >
            <div className={`w-4 h-12 rounded-xl border-2 border-violet-400 bg-violet-600 shadow-2xl transition-transform ${dragType === 'start' ? 'scale-110' : 'hover:scale-105'} flex flex-col items-center justify-center gap-0.5`}>
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>

          {/* End Handle */}
          <div 
            className={`absolute top-0 bottom-0 w-10 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto ${dragType === 'end' ? 'cursor-grabbing' : 'cursor-col-resize'}`}
            style={{ left: `${endPercent}%` }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
          >
            <div className={`w-4 h-12 rounded-xl border-2 border-violet-400 bg-violet-600 shadow-2xl transition-transform ${dragType === 'end' ? 'scale-110' : 'hover:scale-105'} flex flex-col items-center justify-center gap-0.5`}>
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
               <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center text-[9px] text-slate-600 font-black tracking-[0.4em] px-4 uppercase">
        Drag amethyt handles to trim • Seek by clicking track
      </div>
    </div>
  );
};

export default Timeline;