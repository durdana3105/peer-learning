export type Resource = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  tags: string[] | null;
  uploaded_by: string;
  created_at: string;
};
