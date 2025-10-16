export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address: string;
  joinDate: string;
  status: 'active' | 'on-leave' | 'inactive';
  education: string;
  bio: string;
  subjects: string[]; // IDs of subjects they can teach
}