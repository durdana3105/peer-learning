const fs = require('fs');

const content = fs.readFileSync('src/integrations/supabase/types.ts', 'utf8');

// The file has conflict markers.
let headPart, mainPart;
if (content.includes('<<<<<<< HEAD\r\n')) {
    headPart = content.split('<<<<<<< HEAD\r\n')[1].split('=======\r\n')[0];
    mainPart = content.split('=======\r\n')[1].split('>>>>>>> main')[0];
} else {
    headPart = content.split('<<<<<<< HEAD\n')[1].split('=======\n')[0];
    mainPart = content.split('=======\n')[1].split('>>>>>>> main')[0];
}

function extractTables(part) {
  const portfolioMatch = part.match(/portfolio_profiles: {[\s\S]*?}\n        \]\n      }/) || part.match(/portfolio_profiles: {[\s\S]*?}\r\n        \]\r\n      }/);
  return portfolioMatch ? portfolioMatch[0] : '';
}

const portfolio_profiles_str = extractTables(headPart);

let fixedMain = mainPart;
if (portfolio_profiles_str) {
    fixedMain = fixedMain.replace(/Tables: {\r?\n/, 'Tables: {\n      ' + portfolio_profiles_str + '\n');
}

// Add new tables
const newTables = `
      peer_submissions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          content_url: string | null
          content: string | null
          is_anonymous: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          content_url?: string | null
          content?: string | null
          is_anonymous?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          content_url?: string | null
          content?: string | null
          is_anonymous?: boolean
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      peer_reviews: {
        Row: {
          id: string
          submission_id: string
          reviewer_id: string
          feedback: string
          rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          reviewer_id: string
          feedback: string
          rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          reviewer_id?: string
          feedback?: string
          rating?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peer_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "peer_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peer_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
`;

fixedMain = fixedMain.replace(/Tables: {/, 'Tables: {' + newTables);

fs.writeFileSync('src/integrations/supabase/types.ts', fixedMain);
console.log('Fixed types.ts');
