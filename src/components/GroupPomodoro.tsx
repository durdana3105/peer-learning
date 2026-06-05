import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

interface GroupPomodoroProps {
  roomId: string;
}

export default function GroupPomodoro({ roomId }: GroupPomodoroProps) {
  const { toast } = useToast();
  
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
        setTimerState(data.timer_state || 'idle');
        setEndTime(data.timer_end_time ? new Date(data.timer_end_time) : null);
        setWorkDuration(data.timer_work_duration || 25);
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

  // Countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState !== 'idle' && endTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
        
        setTimeLeft(diff);
        
        // Timer completed!
        if (diff === 0) {
          handleTimerComplete();
        }
      }, 1000);
    } else {
      setTimeLeft(timerState === 'break' ? breakDuration * 60 : workDuration * 60);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, endTime, workDuration, breakDuration]);

  const handleTimerComplete = async () => {
    if (timerState === 'work') {
      toast({
        title: "Group Focus Session Complete! 🎉",
        description: `Great job focusing! Time for a short break.`,
      });
      await setGroupTimer('break', breakDuration);
    } else if (timerState === 'break') {
      toast({
        title: "Break Over!",
        description: "Back to focus?",
      });
      await setGroupTimer('idle', 0);
    }
  };

  const setGroupTimer = async (newState: 'idle' | 'work' | 'break', durationMinutes: number) => {
    let newEndTime = null;
    
    if (newState !== 'idle') {
      const now = new Date();
      newEndTime = new Date(now.getTime() + durationMinutes * 60 * 1000).toISOString();
    }
    
    await supabase
      .from('study_rooms' as any)
      .update({
        timer_state: newState,
        timer_end_time: newEndTime,
        timer_work_duration: workDuration,
        timer_break_duration: breakDuration
      })
      .eq('id', roomId);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f25] p-5 backdrop-blur-md">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2">
          {timerState === 'work' ? <Clock size={20} className="text-red-400 animate-pulse" /> : <Coffee size={20} className="text-green-400" />}
          <h3 className="font-semibold text-lg text-white">
            {timerState === 'work' ? 'Group Focus' : timerState === 'break' ? 'Group Break' : 'Group Pomodoro'}
          </h3>
        </div>
        
        <div className={`text-6xl font-mono font-bold tracking-widest ${timerState === 'work' ? 'text-red-400' : timerState === 'break' ? 'text-green-400' : 'text-slate-300'}`}>
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex gap-3 pt-4 w-full">
          {timerState === 'idle' ? (
            <Button 
              onClick={() => setGroupTimer('work', workDuration)}
              className="flex-1 font-semibold bg-red-500 hover:bg-red-600"
            >
              <Play size={16} className="mr-2" /> Start Focus
            </Button>
          ) : (
            <Button 
              onClick={() => setGroupTimer('idle', 0)}
              className="flex-1 font-semibold bg-slate-700 hover:bg-slate-600"
            >
              <Square size={16} className="mr-2" /> Stop Sync Timer
            </Button>
          )}
        </div>

        {timerState === 'idle' && (
          <div className="flex justify-between w-full mt-4 border-t border-white/10 pt-4 px-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">Work (min)</span>
              <input 
                type="number" 
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500 text-white"
                min="1" max="120"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 mb-1">Break (min)</span>
              <input 
                type="number" 
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500 text-white"
                min="1" max="60"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
