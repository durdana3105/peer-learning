export const SKILL_GRAPH = {
  React: ["JavaScript", "TypeScript", "Next.js", "Redux", "Tailwind CSS"],
  "Next.js": ["React", "JavaScript", "TypeScript", "Tailwind CSS"],
  JavaScript: ["React", "Node.js", "TypeScript", "Vue.js"],
  TypeScript: ["JavaScript", "React", "Next.js"],
  "Node.js": ["JavaScript", "Express", "MongoDB"],
  Express: ["Node.js", "MongoDB"],
  MongoDB: ["Node.js", "Express", "Mongoose"],

  Python: ["Machine Learning", "Data Science", "Django", "Flask"],
  "Machine Learning": ["Python", "TensorFlow", "Data Science"],
  "Data Science": ["Python", "Machine Learning", "Pandas"],
  TensorFlow: ["Machine Learning", "Python"],

  UIUX: ["Figma", "Frontend", "Design Systems"],
  Figma: ["UIUX", "Design Systems"],

  SQL: ["PostgreSQL", "Database Design"],
  PostgreSQL: ["SQL", "Supabase"],

  Supabase: ["PostgreSQL", "Backend"],
};

export const getRelatedSkills = (skill) => {
  return SKILL_GRAPH[skill] || [];
};