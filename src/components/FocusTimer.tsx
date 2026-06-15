import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Play, Square, Coffee, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

export default function FocusTimer() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins by default
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [focusTimeThisWeek, setFocusTimeThisWeek] = useState(0);

  // Fetch initial profile state
  useEffect(() => {
    if (!user) return;
    
    const fetchProfileState = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_in_focus_mode, focus_time_this_week')
        .eq('id', user.id)
        .single();
        
      if (data) {
        setIsActive(data.is_in_focus_mode || false);
        setFocusTimeThisWeek(data.focus_time_this_week || 0);
      }
    };
    
    fetchProfileState();
  }, [user]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = async () => {
    if (!isBreak) {
      // Completed a work session
      toast({
        title: "Focus Session Complete! 🎉",
        description: `Great job focusing for ${workDuration} minutes! Time for a break.`,
      });
      
      setIsBreak(true);
      setTimeLeft(breakDuration * 60);
      
      // Add to analytics
      if (user) {
        const newFocusTime = focusTimeThisWeek + workDuration;
        setFocusTimeThisWeek(newFocusTime);
        await updateProfile(false, newFocusTime); // Turn off focus mode during break
      }
    } else {
      // Completed a break
      toast({
        title: "Break Over!",
        description: "Ready for another focus session?",
      });
      setIsBreak(false);
      setIsActive(false);
      setTimeLeft(workDuration * 60);
    }
  };

  const updateProfile = async (inFocus: boolean, focusTime?: number) => {
    if (!user) return;
    
    const updates: any = { is_in_focus_mode: inFocus };
    if (focusTime !== undefined) {
      updates.focus_time_this_week = focusTime;
    }
    
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
  };

  const toggleTimer = async () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);
    
    if (!newIsActive && !isBreak) {
      // Stopped manually during work
      setTimeLeft(workDuration * 60);
    }
    
    await updateProfile(newIsActive && !isBreak);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
            isActive && !isBreak
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : isActive && isBreak
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
              : 'text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'
          }`}
        >
          {isActive ? (
            <>
              {isBreak ? <Coffee size={16} /> : <Clock size={16} className="animate-pulse" />}
              <span className="font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span className="hidden md:inline text-sm font-medium">Focus</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-72 bg-[#0b1329] border-white/10 p-4 text-white z-[1001]">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h3 className="font-semibold text-lg">{isBreak ? 'Break Time' : 'Focus Timer'}</h3>
          
          <div className={`text-5xl font-mono font-bold tracking-widest ${isBreak ? 'text-green-400' : 'text-red-400'}`}>
            {formatTime(timeLeft)}
          </div>
          
          <p className="text-xs text-center text-slate-400">
            {isActive && !isBreak 
              ? "You're in Focus Mode. Non-urgent notifications are suppressed." 
              : isBreak 
              ? "Take a breather. Notifications are active." 
              : "Start a Pomodoro session to suppress notifications and track your focus time."}
          </p>

          <div className="flex gap-3 w-full pt-2">
            <Button 
              onClick={toggleTimer}
              className={`flex-1 font-semibold ${isActive ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {isActive ? <><Square size={16} className="mr-2" /> Stop</> : <><Play size={16} className="mr-2" /> Start Focus</>}
            </Button>
          </div>

          {!isActive && (
            <div className="w-full pt-4 border-t border-white/10 mt-2">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Settings</p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Work (min)</span>
                <input 
                  type="number" 
                  value={workDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWorkDuration(val);
                    if (!isBreak) setTimeLeft(val * 60);
                  }}
                  className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500"
                  min="1" max="120"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Break (min)</span>
                <input 
                  type="number" 
                  value={breakDuration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBreakDuration(val);
                    if (isBreak) setTimeLeft(val * 60);
                  }}
                  className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-center focus:outline-none focus:border-cyan-500"
                  min="1" max="60"
                />
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
