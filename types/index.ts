import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'counselor' | 'admin';
  firstName: string;
  lastName: string;
  createdAt: Date;
  authUser: any;
  isRestricted?: boolean;
  profile?: StudentProfiling;
  imageUrl?:string;
}

export interface StudentProfiling {
  phone?: string;
  major?: string;
  graduationYear?: number;
  gpa?: number;
  skills: string[];
  bio?: string;
  completedAt?: Date;
}

export interface JobPost {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  requiredSkills: string[];
  counselorId: string;
  counselorName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, role: string) => Promise<string>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: 'student' | 'counselor'
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface Counselor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'counselor';
  isActive: boolean;
  createdAt: Timestamp;
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  status: "pending" | "approved" | "rejected";
  requiredSkills: string[];
  imageUrl:string;
};

