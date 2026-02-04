
import React, { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { VideoState, CropArea } from '../types';

interface VideoPlayerProps {
  state: VideoState;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onCropChange: (crop: CropArea) => void;
}

type InteractionType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ state, onTimeUpdate, onDurationChange, onCropChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0, ratio: 1 });
  const [interaction, setInteraction] = useState<{ type: InteractionType; startX: number; startY: number; startCrop: CropArea } | null>(null);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setVideoDimensions({
      width: v.videoWidth,
      height: v.videoHeight,
      ratio: v.videoWidth / v.videoHeight
    });
    onDurationChange(v.duration);
  };

  const getFilterStyle = () => {
    switch (state.filter) {
      case 'grayscale': return 'grayscale(1)';
      case 'sepia': return 'sepia(1)';
      case 'invert': return 'invert(1)';
      case 'blur': return 'blur(4px)';
      case 'brightness': return 'brightness(1.5)';
      case 'contrast': return 'contrast(1.5)';
      default: return 'none';
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: InteractionType) => {
    e.preventDefault();
    e.stopPropagation();
    setInteraction({
      type,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...state.crop }
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interaction || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - interaction.startX) / rect.width) * 100;
    const dy = ((e.clientY - interaction.startY) / rect.height) * 100;

    let { x, y, width, height } = interaction.startCrop;

    switch (interaction.type) {
      case 'move':
        x = Math.max(0, Math.min(100 - width, x + dx));
        y = Math.max(0, Math.min(100 - height, y + dy));
        break;
      case 'nw':
        x = Math.max(0, Math.min(interaction.startCrop.x + interaction.startCrop.width - 5, x + dx));
        y = Math.max(0, Math.min(interaction.startCrop.y + interaction.startCrop.height - 5, y + dy));
        width = interaction.startCrop.width - (x - interaction.startCrop.x);
        height = interaction.startCrop.height - (y - interaction.startCrop.y);
        break;
      case 'ne':
        y = Math.max(0, Math.min(interaction.startCrop.y + interaction.startCrop.height - 5, y + dy));
        width = Math.max(5, Math.min(100 - x, interaction.startCrop.width + dx));
        height = interaction.startCrop.height - (y - interaction.startCrop.y);
        break;
      case 'sw':
        x = Math.max(0, Math.min(interaction.startCrop.x + interaction.startCrop.width - 5, x + dx));
        width = interaction.startCrop.width - (x - interaction.startCrop.x);
        height = Math.max(5, Math.min(100 - y, interaction.startCrop.height + dy));
        break;
      case 'se':
        width = Math.max(5, Math.min(100 - x, interaction.startCrop.width + dx));
        height = Math.max(5, Math.min(100 - y, interaction.startCrop.height + dy));
        break;
      case 'n':
        y = Math.max(0, Math.min(interaction.startCrop.y + interaction.startCrop.height - 5, y + dy));
        height = interaction.startCrop.height - (y - interaction.startCrop.y);
        break;
      case 's':
        height = Math.max(5, Math.min(100 - y, interaction.startCrop.height + dy));
        break;
      case 'w':
        x = Math.max(0, Math.min(interaction.startCrop.x + interaction.startCrop.width - 5, x + dx));
        width = interaction.startCrop.width - (x - interaction.startCrop.x);
        break;
      case 'e':
        width = Math.max(5, Math.min(100 - x, interaction.startCrop.width + dx));
        break;
    }

    onCropChange({ x, y, width, height });
  }, [interaction, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setInteraction(null);
  }, []);

  useEffect(() => {
    if (interaction) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] bg-black group transition-all duration-500"
      style={{ 
        width: videoDimensions.width > 0 ? 'auto' : '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: videoDimensions.ratio > 0 ? `${videoDimensions.ratio}` : 'auto'
      }}
    >
      <video
        ref={ref}
        src={state.url}
        className="block w-full h-full object-contain pointer-events-none"
        style={{ filter: getFilterStyle() }}
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {/* Darkened overlay for areas outside crop */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-[1px]" style={{ height: `${state.crop.y}%` }} />
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-[1px]" style={{ height: `${100 - (state.crop.y + state.crop.height)}%` }} />
        <div 
          className="absolute bg-black/80 backdrop-blur-[1px]" 
          style={{ 
            top: `${state.crop.y}%`, 
            bottom: `${100 - (state.crop.y + state.crop.height)}%`,
            left: 0,
            width: `${state.crop.x}%`
          }} 
        />
        <div 
          className="absolute bg-black/80 backdrop-blur-[1px]" 
          style={{ 
            top: `${state.crop.y}%`, 
            bottom: `${100 - (state.crop.y + state.crop.height)}%`,
            right: 0,
            width: `${100 - (state.crop.x + state.crop.width)}%`
          }} 
        />
      </div>

      {/* Interactive Crop Box */}
      <div 
        className="absolute cursor-move border-[2px] border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] z-20 transition-colors duration-300"
        style={{
          left: `${state.crop.x}%`,
          top: `${state.crop.y}%`,
          width: `${state.crop.width}%`,
          height: `${state.crop.height}%`,
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* Rule of Thirds Grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
          <div className="border-r border-white/40"></div>
          <div className="border-r border-white/40"></div>
          <div></div>
          <div className="border-t border-white/40 border-r border-white/40"></div>
          <div className="border-t border-white/40 border-r border-white/40"></div>
          <div className="border-t border-white/40"></div>
          <div className="border-t border-white/40 border-r border-white/40"></div>
          <div className="border-t border-white/40 border-r border-white/40"></div>
          <div className="border-t border-white/40"></div>
        </div>

        {/* Resizing Handles */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-white rounded-lg shadow-xl cursor-nw-resize z-30 flex items-center justify-center border-2 border-indigo-600 active:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'nw')} />
        <div className="absolute -top-3 -right-3 w-6 h-6 bg-white rounded-lg shadow-xl cursor-ne-resize z-30 flex items-center justify-center border-2 border-indigo-600 active:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'ne')} />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white rounded-lg shadow-xl cursor-sw-resize z-30 flex items-center justify-center border-2 border-indigo-600 active:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'sw')} />
        <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-lg shadow-xl cursor-se-resize z-30 flex items-center justify-center border-2 border-indigo-600 active:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'se')} />
        
        {/* Edge Handles */}
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-10 bg-white rounded-lg cursor-w-resize z-30 border-2 border-indigo-600 shadow-xl active:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'w')} />
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-10 bg-white rounded-lg cursor-e-resize z-30 border-2 border-indigo-600 shadow-xl active:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'e')} />
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white rounded-lg cursor-n-resize z-30 border-2 border-indigo-600 shadow-xl active:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'n')} />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white rounded-lg cursor-s-resize z-30 border-2 border-indigo-600 shadow-xl active:scale-110 transition-transform" onMouseDown={(e) => handleMouseDown(e, 's')} />
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
