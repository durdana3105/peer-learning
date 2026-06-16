import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Play, Square, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const WORK_MIN = 1;
const WORK_MAX = 120;
const BREAK_MIN = 1;
const BREAK_MAX = 60;

interface GroupPomodoroProps {
  roomId: string;
  creatorId: string;
}

export default function GroupPomodoro({ roomId, creatorId }: GroupPomodoroProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const isCreator = user?.id === creatorId;

  const [timerState, setTimerState] = useState<'idle' | 'work' | 'break'>('idle');
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // Fetch initial state and listen for real-time changes
  useEffect(() => {
    let active = true;

    const fetchTimerState = async () => {
      const { data, error } = await supabase
        .from('study_rooms' as any)
        .select('timer_state, timer_end_time, timer_work_duration, timer_break_duration')
        .eq('id', roomId)
        .single();

      if (!error && data && active) {
        // @ts-expect-error TODO: refine typing
        setTimerState(data.timer_state || 'idle');
        // @ts-expect-error TODO: refine typing
        setEndTime(data.timer_end_time ? new Date(data.timer_end_time) : null);
        // @ts-expect-error TODO: refine typing
        setWorkDuration(data.timer_work_duration || 25);
        // @ts-expect-error TODO: refine typing
        setBreakDuration(data.timer_break_duration || 5);
      }
    };

    fetchTimerState();

    const channel = supabase
      .channel(`room-timer-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'study_rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        const newData = payload.new;
        setTimerState(newData.timer_state || 'idle');
        setEndTime(newData.timer_end_time ? new Date(newData.timer_end_time) : null);
        setWorkDuration(newData.timer_work_duration || 25);
        setBreakDuration(newData.timer_break_duration || 5);
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const clampDurations = useCallback(() => ({
    work: Math.min(WORK_MAX, Math.max(WORK_MIN, Math.floor(workDuration))),
    brk: Math.min(BREAK_MAX, Math.max(BREAK_MIN, Math.floor(breakDuration))),
  }), [workDuration, breakDuration]);

  const setGroupTimer = useCallback(async (newState: 'idle' | 'work' | 'break') => {
    const { work, brk } = clampDurations();
    const clampedDuration = newState === 'work' ? work : newState === 'break' ? brk : 0;

    const newEndTime =
      newState !== 'idle'
        ? new Date(Date.now() + clampedDuration * 60 * 1000).toISOString()
        : null;

    await supabase
      .from('study_rooms' as any)
      .update({
        timer_state: newState,
        timer_end_time: newEndTime,
        timer_work_duration: work,
        timer_break_duration: brk,
      })
      .eq('id', roomId);
  }, [clampDurations, roomId]);

  const handleTimerComplete = useCallback(async () => {
    if (!isCreator) return;

    if (timerState === 'work') {
      toast({
        title: 'Group Focus Session Complete! 🎉',
        description: 'Great job focusing! Time for a short break.',
      });
      await setGroupTimer('break');
    } else if (timerState === 'break') {
      toast({
        title: 'Break Over!',
        description: 'Back to focus?',
      });
      await setGroupTimer('idle');
    }
  }, [isCreator, timerState, setGroupTimer, toast]);

  // Countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState !== 'idle' && endTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));

        setTimeLeft(diff);

        if (diff === 0) {
          clearInterval(interval);
          handleTimerComplete();
        }
      }, 1000);
    } else {
      setTimeLeft(timerState === 'break' ? breakDuration * 60 : workDuration * 60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, endTime, workDuration, breakDuration, handleTimerComplete]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f25] p-5 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2">
          {timerState === 'work' ? (
            <Clock size={20} className="text-red-400 animate-pulse" />
          ) : (
            <Coffee size={20} className="text-green-400" />
          )}
          <h3 className="font-semibold text-lg text-white">
            {timerState === 'work'
              ? 'Group Focus'
              : timerState === 'break'
              ? 'Group Break'
              : 'Group Pomodoro'}
          </h3>
        </div>

        <div
          className={`text-6xl font-mono font-bold tracking-widest ${
            timerState === 'work'
              ? 'text-red-400'
              : timerState === 'break'
              ? 'text-green-400'
              : 'text-slate-300'
          }`}
        >
          {formatTime(timeLeft)}
        </div>

        {isCreator && (
          <div className="flex gap-3 pt-4 w-full">
            {timerState === 'idle' ? (
              <Button
                onClick={() => setGroupTimer('work')}
                className="flex-1 font-semibold bg-red-500 hover:bg-red-600"
              >
                <Play size={16} className="mr-2" /> Start Focus
              </Button>
            ) : (
              <Button
                onClick={() => setGroupTimer('idle')}
                className="flex-1 font-semibold bg-slate-700 hover:bg-slate-600"
              >
                <Square size={16} className="mr-2" /> Stop Sync Timer
              </Button>
            )}
          </div>
        )}

        {isCreator && timerState === 'idle' && (
          <div className="flex justify-between w-full mt-4 border-t border-white/10 pt-4 px-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">Work (min)</span>
              <input
                type="number"
                value={workDuration}
                onChange={(e) =>
                  setWorkDuration(Math.min(WORK_MAX, Math.max(WORK_MIN, Number(e.target.value))))
                }
                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500 text-white"
                min={WORK_MIN}
                max={WORK_MAX}
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">Break (min)</span>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) =>
                  setBreakDuration(Math.min(BREAK_MAX, Math.max(BREAK_MIN, Number(e.target.value))))
                }
                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500 text-white"
                min={BREAK_MIN}
                max={BREAK_MAX}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}