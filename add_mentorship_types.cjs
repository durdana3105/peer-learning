const fs = require('fs');

let content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');

const mentorshipTypes = `
      mentorship_paths: {
        Row: {
          id: string
          mentor_id: string
          mentee_id: string
          goal: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mentor_id: string
          mentee_id: string
          goal: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mentor_id?: string
          mentee_id?: string
          goal?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_paths_mentee_id_fkey"
            columns: ["mentee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentorship_paths_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      mentorship_milestones: {
        Row: {
          id: string
          path_id: string
          title: string
          description: string | null
          is_completed: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          path_id: string
          title: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          path_id?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentorship_milestones_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "mentorship_paths"
            referencedColumns: ["id"]
          }
        ]
      }`;

if (!content.includes('mentorship_paths: {')) {
  content = content.replace('    Tables: {', '    Tables: {' + mentorshipTypes);
  fs.writeFileSync('src/integrations/supabase/types.ts', content);
  console.log('types.ts updated with mentorship_paths');
} else {
  console.log('Types already exist.');
}
