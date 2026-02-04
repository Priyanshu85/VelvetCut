
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'brightness' | 'contrast';

export interface VideoState {
  url: string;
  name: string;
  type: string; // Added to track original mime type
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  startTime: number;
  endTime: number;
  crop: CropArea;
  filter: FilterType;
  playbackRate: number;
}

export interface ExportSettings {
  format: string;
  quality: number; // 1 to 10
  includeAudio: boolean;
}
