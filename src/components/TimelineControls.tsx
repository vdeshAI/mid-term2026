import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipForward,
  Volume2,
  VolumeX,
  Clock,
} from 'lucide-react';

interface Props {
  currentMinute: number; // 0 to 360 (7:00 PM to 1:00 AM EST)
  isPlaying: boolean;
  speed: number;
  soundEnabled: boolean;
  onTogglePlay: () => void;
  onSetMinute: (minute: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleSound: () => void;
  onReset: () => void;
  onJumpNextCall: () => void;
  totalCallsMade: number;
  totalRacesCount: number;
  isPreElection?: boolean;
}

export const TimelineControls: React.FC<Props> = ({
  currentMinute,
  isPlaying,
  speed,
  soundEnabled,
  onTogglePlay,
  onSetMinute,
  onSetSpeed,
  onToggleSound,
  onReset,
  onJumpNextCall,
  totalCallsMade,
  totalRacesCount,
  isPreElection = false,
}) => {
  // Convert minutes from 7:00 PM EST to human readable time string
  const formatTime = (minutes: number): string => {
    if (minutes === 0 && !isPlaying && isPreElection) {
      return 'Pre-7:00 PM EST';
    }
    const startHour = 19; // 7:00 PM
    const totalMinutes = startHour * 60 + minutes;
    let hour = Math.floor(totalMinutes / 60) % 24;
    const min = totalMinutes % 60;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const minStr = min < 10 ? `0${min}` : min;
    return `${hour}:${minStr} ${ampm} EST`;
  };

  const keyCheckpoints = [
    { min: 0, label: '7:00 PM (Start)' },
    { min: 60, label: '8:00 PM' },
    { min: 120, label: '9:00 PM' },
    { min: 180, label: '10:00 PM' },
    { min: 240, label: '11:00 PM' },
    { min: 360, label: '1:00 AM' },
  ];

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Controls & Time Display */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePlay}
              className={`p-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                  : 'bg-blue-600 hover:bg-blue-500 text-white font-semibold'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Start Live Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause' : 'Live Simulation'}</span>
            </button>

            <button
              onClick={onJumpNextCall}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 transition-colors border border-slate-700"
              title="Jump to Next Race Call"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Next Call</span>
            </button>

            <button
              onClick={onReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
              title="Reset to 7:00 PM"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Election Night Clock */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
            <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
            <div className="text-right sm:text-left">
              <div className="text-xs font-bold text-slate-100">{formatTime(currentMinute)}</div>
              <div className="text-[10px] text-slate-400">Nov 3, 2026</div>
            </div>
          </div>
        </div>

        {/* Timeline Slider with Hour Markers */}
        <div className="flex-1 w-full max-w-2xl px-2">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="360"
              value={currentMinute}
              onChange={(e) => onSetMinute(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            {keyCheckpoints.map((pt) => (
              <button
                key={pt.min}
                onClick={() => onSetMinute(pt.min)}
                className={`hover:text-slate-200 transition-colors ${
                  currentMinute >= pt.min ? 'text-slate-300 font-semibold' : 'text-slate-500'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simulation Speed & Audio Toggles */}
        <div className="flex items-center gap-2 text-xs">
          {/* Speed selector */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            {[1, 5, 15].map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  speed === s
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Sound alert chime toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-yellow-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Chime Sound Enabled' : 'Sound Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Called status counter */}
          <div className="hidden lg:block text-right font-mono text-[11px] text-slate-400">
            <span className="text-slate-200 font-bold">{totalCallsMade}</span> / {totalRacesCount}{' '}
            called
          </div>
        </div>
      </div>
    </div>
  );
};
