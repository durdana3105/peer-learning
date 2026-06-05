-- Add focus mode columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_in_focus_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS focus_time_this_week INTEGER DEFAULT 0;

-- Add timer columns to study_rooms for group pomodoro
ALTER TABLE public.study_rooms
ADD COLUMN IF NOT EXISTS timer_state TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS timer_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_work_duration INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS timer_break_duration INTEGER DEFAULT 5;
