const fs = require('fs');

let content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');

// Update profiles Row
content = content.replace(
  '          restoration_date: string | null',
  '          restoration_date: string | null\n          is_in_focus_mode: boolean | null\n          focus_time_this_week: number | null'
);

// Update profiles Insert
content = content.replace(
  '          restoration_date?: string | null\n        }\n        Update: {',
  '          restoration_date?: string | null\n          is_in_focus_mode?: boolean | null\n          focus_time_this_week?: number | null\n        }\n        Update: {'
);

// Update profiles Update
content = content.replace(
  '          restoration_date?: string | null\n        }\n        Relationships: [',
  '          restoration_date?: string | null\n          is_in_focus_mode?: boolean | null\n          focus_time_this_week?: number | null\n        }\n        Relationships: ['
);

// Update study_rooms Row
content = content.replace(
  '          is_private: boolean\n        }\n        Insert: {',
  '          is_private: boolean\n          timer_state: string | null\n          timer_end_time: string | null\n          timer_work_duration: number | null\n          timer_break_duration: number | null\n        }\n        Insert: {'
);

// Update study_rooms Insert
content = content.replace(
  '          is_private?: boolean\n        }\n        Update: {',
  '          is_private?: boolean\n          timer_state?: string | null\n          timer_end_time?: string | null\n          timer_work_duration?: number | null\n          timer_break_duration?: number | null\n        }\n        Update: {'
);

// Update study_rooms Update
content = content.replace(
  '          is_private?: boolean\n        }\n        Relationships: [',
  '          is_private?: boolean\n          timer_state?: string | null\n          timer_end_time?: string | null\n          timer_work_duration?: number | null\n          timer_break_duration?: number | null\n        }\n        Relationships: ['
);

fs.writeFileSync('src/integrations/supabase/types.ts', content);
console.log('types.ts updated successfully');
