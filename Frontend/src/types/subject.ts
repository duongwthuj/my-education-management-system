export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  teachers: string[]; // IDs of teachers who can teach this subject
}