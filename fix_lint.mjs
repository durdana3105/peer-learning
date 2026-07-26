import fs from 'fs';
import path from 'path';

// Fix toast dependencies
const toastFiles = [
  'src/components/FocusTimer.tsx',
  'src/components/GroupPomodoro.tsx',
  'src/hooks/useCreateSession.ts',
  'src/hooks/useSessions.ts',
  'src/hooks/useSkillEndorsements.ts',
  'src/pages/Portfolio.tsx',
  'src/pages/ReviewSubmission.tsx'
];

for(const file of toastFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/(?<=(\[|,)\s*)toast(?=\s*(,|\]))/g, '');
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/\[\s*,/g, '[');
  content = content.replace(/,\s*\]/g, ']');
  fs.writeFileSync(file, content, 'utf-8');
}

// Fix fast refresh warnings
const fastRefreshFiles = [
  'src/components/markdown/MarkdownRenderer.tsx',
  'src/components/theme-provider.tsx',
  'src/components/ui/sonner.tsx'
];

for(const file of fastRefreshFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('eslint-disable-next-line react-refresh/only-export-components') && !content.includes('eslint-disable react-refresh/only-export-components')) {
    content = `/* eslint-disable react-refresh/only-export-components */\n` + content;
    fs.writeFileSync(file, content, 'utf-8');
  }
}

// Fix seedTestimonials dependency
const testimonialsFile = 'src/components/landing/Testimonials.tsx';
let testContent = fs.readFileSync(testimonialsFile, 'utf-8');
testContent = testContent.replace(/\[searchTerm, categoryFilter\]/g, '[searchTerm, categoryFilter, seedTestimonials]');
fs.writeFileSync(testimonialsFile, testContent, 'utf-8');
