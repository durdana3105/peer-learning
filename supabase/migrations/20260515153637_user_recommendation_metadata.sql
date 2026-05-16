-- View for Intelligent Peer Recommendation metadata
CREATE OR REPLACE VIEW public.user_recommendation_metadata AS
SELECT 
  id as user_id,
  name,
  trim(
    regexp_replace(
      array_to_string(skills, ' ') || ' ' || array_to_string(interests, ' '),
      '\s+', ' ', 'g'
    )
  ) AS metadata_string
FROM public.profiles;

-- Ensure authenticated users can select from this view
GRANT SELECT ON public.user_recommendation_metadata TO authenticated;
GRANT SELECT ON public.user_recommendation_metadata TO anon;
GRANT SELECT ON public.user_recommendation_metadata TO service_role;
