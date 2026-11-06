import React, { useState, useEffect, useRef } from 'react';
import { TaskItem, Course } from '../types';
import { soundEngine } from '../utils/audioSynth';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  CloudRain,
  Headphones,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  courses: Course[];
  activeTask?: TaskItem | null;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  courses,
  activeTask,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(activeTask?.id || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'brownnoise' | 'whitenoise' | 'lofi'>('off');
  const [volume, setVolume] = useState<number>(0.3);
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTask) {
      setSelectedTaskId(activeTask.id);
    } else if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [activeTask, tasks]);

  // Adjust timeLeft when durationMinutes changes and timer is paused
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes]);

  // Sound control
  useEffect(() => {
    if (isRunning && ambientSound !== 'off') {
      soundEngine.play(ambientSound, volume);
    } else {
      soundEngine.stop();
    }
    return () => {
      soundEngine.stop();
    };
  }, [isRunning, ambientSound]);

  useEffect(() => {
    soundEngine.setVolume(volume);
  }, [volume]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            soundEngine.stop();
            soundEngine.playChime();
            setSessionsCompleted((c) => c + 1);
            confetti({
              particleCount: 50,
              spread: 70,
              origin: { y: 0.6 },
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!isOpen) return null;

  const currentTask = tasks.find((t) => t.id === selectedTaskId);
  const course = currentTask ? courses.find((c) => c.id === currentTask.courseId) : null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progressPercent = ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
    soundEngine.stop();
  };

  const handleClose = () => {
    setIsRunning(false);
    soundEngine.stop();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <Timer className="w-3.5 h-3.5" />
            <span>Study Pomodoro Session</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Deep Focus Mode
          </h3>
        </div>

        {/* Task Selector */}
        <div className="text-left space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Focus Goal
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="">General Study / Review</option>
            {tasks
              .filter((t) => t.status !== 'graded' && t.status !== 'submitted')
              .map((t) => {
                const c = courses.find((co) => co.id === t.courseId);
                return (
                  <option key={t.id} value={t.id}>
                    [{c?.code}] {t.title}
                  </option>
                );
              })}
          </select>
        </div>

        {/* Big Countdown Display */}
        <div className="py-4 space-y-2">
          <div className="text-6xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </div>

          {currentTask && (
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium truncate px-4">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {course?.code}:
              </span>
              <span className="truncate">{currentTask.title}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Duration presets */}
        <div className="flex items-center justify-center gap-2">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => {
                setDurationMinutes(m);
                setTimeLeft(m * 60);
                setIsRunning(false);
              }}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-lg transition-colors ${
                durationMinutes === m
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Ambient Focus Sound Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs text-left">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-indigo-600" />
              <span>Ambient Study Audio</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Offline Synth</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
            {[
              { id: 'off', label: 'Muted' },
              { id: 'rain', label: 'Rain' },
              { id: 'brownnoise', label: 'Library' },
              { id: 'lofi', label: 'Lofi' },
            ].map((snd) => (
              <button
                key={snd.id}
                onClick={() => setAmbientSound(snd.id as typeof ambientSound)}
                className={`py-1.5 px-2 rounded-lg transition-colors font-medium ${
                  ambientSound === snd.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>

          {ambientSound !== 'off' && (
            <div className="flex items-center gap-2 pt-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-md transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {sessionsCompleted > 0 && (
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
            🔥 {sessionsCompleted} focus session{sessionsCompleted > 1 ? 's' : ''} completed today!
          </div>
        )}
      </div>
    </div>
  );
};
