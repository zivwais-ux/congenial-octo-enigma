export type Role = 'designer' | 'approver';

export type Status = 'pending' | 'changes' | 'approved' | 'rejected';

export type Channel = 'מייל' | 'Teams' | 'וואטסאפ';

export interface User {
  id: string;
  name: string;
  role: Role;
  /** ראשי תיבות לאווטאר */
  avatar: string;
  /** תפקיד לתצוגה, למשל "מנהלת מחלקת עיצוב" */
  title: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Version {
  id: string;
  number: number;
  /** data: URL (נתוני דמה) או idb://<id> (קובץ שהועלה ונשמר ב-IndexedDB) */
  previewFileUrl: string;
  previewFileName: string;
  previewMime: string;
  sourceFileName?: string;
  /** idb://<id> כשהמעצב העלה קובץ מקור אמיתי */
  sourceFileUrl?: string;
  note: string;
  uploadedAt: string;
}

export type ItemEventType = 'uploaded' | 'version' | 'comment' | 'decision';

export interface ItemEvent {
  id: string;
  type: ItemEventType;
  authorId: string;
  at: string;
  versionNumber?: number;
  status?: Status;
  text?: string;
}

export interface Item {
  id: string;
  title: string;
  projectId: string;
  designerId: string;
  approverId: string;
  dueDate: string;
  status: Status;
  versions: Version[];
  createdAt: string;
  events: ItemEvent[];
}

export interface Pin {
  /** אחוזים מרוחב/גובה התמונה */
  x: number;
  y: number;
}

export interface Comment {
  id: string;
  itemId: string;
  versionId: string;
  authorId: string;
  text: string;
  pin?: Pin;
  createdAt: string;
  resolved: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  text: string;
  itemId: string;
  read: boolean;
  channel: Channel;
  createdAt: string;
}

export interface AppState {
  schema: number;
  currentUserId: string;
  users: User[];
  projects: Project[];
  items: Item[];
  comments: Comment[];
  notifications: Notification[];
}
