-- Create study rooms table
CREATE TABLE if not exists study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create study room messages table
CREATE TABLE if not exists study_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES study_rooms(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_messages ENABLE ROW LEVEL SECURITY;

-- Study rooms: anyone can read, only creator can modify/delete
CREATE POLICY "Anyone can read study rooms"
ON study_rooms FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create study rooms"
ON study_rooms FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only creator can update study room"
ON study_rooms FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only creator can delete study room"
ON study_rooms FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Messages: anyone can read in any room, only author can modify
CREATE POLICY "Anyone can read room messages"
ON study_room_messages FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can send room messages"
ON study_room_messages FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Author can update own message"
ON study_room_messages FOR UPDATE TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Author can delete own message"
ON study_room_messages FOR DELETE TO authenticated
USING (profile_id = auth.uid());

-- Turn on Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE study_room_messages;