import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface WorkoutTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  label: string;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ duration, onComplete, label }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-zinc-400 text-xs uppercase tracking-[0.2em] font-mono mb-1">{label}</h3>
        <div className="text-6xl font-mono font-bold tabular-nums">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={resetTimer}
          className="p-4 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <RotateCcw size={24} />
        </button>
        <button
          onClick={toggleTimer}
          className={cn(
            "p-6 rounded-full transition-all transform active:scale-95",
            isActive ? "bg-zinc-100 text-zinc-900" : "bg-emerald-500 text-white"
          )}
        >
          {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={onComplete}
          className="p-4 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <CheckCircle2 size={24} />
        </button>
      </div>
    </div>
  );
};
