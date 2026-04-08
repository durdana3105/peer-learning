import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://aigvdnksouhjylanpwgu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZ3Zkbmtzb3VoanlsYW5wd2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTkwNTAsImV4cCI6MjA5MTIzNTA1MH0.cAAaERTycOCP_Bc3u3Lb72bjCUVYSCKxbQOHIIJvaE8"

export const supabase = createClient(supabaseUrl, supabaseKey)