-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  type TEXT CHECK (type IN ('course', 'article', 'practice')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (true);

-- Create study_groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  description TEXT,
  members UUID[] DEFAULT '{}',
  skill_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on study_groups
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study groups"
  ON public.study_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can manage study groups"
  ON public.study_groups FOR ALL
  TO authenticated
  USING (true); -- Anyone can create or join

-- Create user_skills table
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

-- Enable RLS on user_skills
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user skills"
  ON public.user_skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own skills"
  ON public.user_skills FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT CHECK (item_type IN ('resource', 'mentor', 'session', 'study_group', 'topic')),
  interaction_type TEXT CHECK (interaction_type IN ('view', 'join', 'complete', 'message', 'search')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_interactions
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.user_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed some initial resources
INSERT INTO public.resources (title, description, tags, difficulty, type) VALUES
('Introduction to React & TypeScript', 'Learn the basics of building type-safe React applications.', ARRAY['React', 'TypeScript', 'Frontend'], 'beginner', 'course'),
('Mastering Advanced Tailwind CSS', 'Deep dive into utility-first CSS layout, animations, and dark mode.', ARRAY['Tailwind CSS', 'CSS', 'Frontend'], 'advanced', 'course'),
('SQL Queries & Indexing in PostgreSQL', 'Optimize your database with proper SQL indexing and complex queries.', ARRAY['SQL', 'PostgreSQL', 'Database'], 'intermediate', 'practice'),
('Building Real-time Apps with Supabase', 'Leverage Supabase real-time subscriptions, auth, and database.', ARRAY['Supabase', 'Real-time', 'Backend'], 'intermediate', 'course'),
('Understanding REST APIs vs GraphQL', 'A comprehensive comparison between RESTful architectures and GraphQL.', ARRAY['API', 'GraphQL', 'Backend'], 'beginner', 'article'),
('Data Structures: Binary Trees in Practice', 'Implement and solve common binary tree problems.', ARRAY['Algorithms', 'Data Structures', 'Practice'], 'advanced', 'practice')
ON CONFLICT DO NOTHING;

-- Seed some study groups
INSERT INTO public.study_groups (topic, description, skill_tags) VALUES
('React Hooks Deep Dive', 'Weekly discussion and practice with custom hooks and state management.', ARRAY['React', 'TypeScript']),
('Database Optimization Pros', 'Group focusing on PostgreSQL performance, indexing, and scalability.', ARRAY['SQL', 'PostgreSQL', 'Database']),
('AI & Machine Learning Basics', 'Learning basic algorithms and how to integrate OpenAI API.', ARRAY['AI', 'OpenAI', 'Python'])
ON CONFLICT DO NOTHING;
