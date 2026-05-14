export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  coupleId?: string;
  birthday?: string;
}

export interface Couple {
  id: string;
  name: string;
  anniversaryDate?: string;
  memberUids: string[];
}

export interface Photo {
  id: string;
  coupleId: string;
  url: string;
  description?: string;
  dateTaken: string;
  month: number;
  year: number;
  badges: string[];
  uploaderUid: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  coupleId: string;
  name: string;
  color: string;
}

export interface ImportantDate {
  id: string;
  coupleId: string;
  title: string;
  date: string;
  type: 'anniversary' | 'birthday' | 'mensiversary' | 'other';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
