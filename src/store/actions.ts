// פעולות טהורות על ה-state. כאן "מדמים" את מה שבמערכת אמיתית היה קורה בשרת:
// יצירת פריט, החלטה, גרסה חדשה – וכל אחת מייצרת התראה לצד השני.
import type { AppState, BrandCheck, Comment, Item, ItemEvent, Notification, Pin, Status, Version } from '../types';
import { uid } from '../lib/id';
import { USER_CHANNEL } from '../lib/status';

const now = () => new Date().toISOString();

function notify(userId: string, itemId: string, kind: Notification['kind'], actorId: string, text = ''): Notification {
  return { id: uid('n'), userId, itemId, kind, actorId, text, read: false, channel: USER_CHANNEL[userId] ?? 'מייל', createdAt: now() };
}

function patchItem(s: AppState, itemId: string, fn: (item: Item) => Item): AppState {
  return { ...s, items: s.items.map((i) => (i.id === itemId ? fn(i) : i)) };
}

function event(e: Omit<ItemEvent, 'id' | 'at'>): ItemEvent {
  return { ...e, id: uid('e'), at: now() };
}

export interface NewItemInput {
  /** מזהה שנוצר מראש, כדי שאפשר יהיה לנווט לפריט מיד אחרי השליחה */
  id?: string;
  title: string;
  projectId: string;
  approverId: string;
  dueDate: string;
  note: string;
  preview: { url: string; name: string; mime: string };
  source?: { url: string; name: string };
}

export function createItem(s: AppState, input: NewItemInput): { state: AppState; item: Item } {
  const designerId = s.currentUserId;
  const itemId = input.id ?? uid('i');
  const version: Version = {
    id: uid('v'),
    number: 1,
    previewFileUrl: input.preview.url,
    previewFileName: input.preview.name,
    previewMime: input.preview.mime,
    sourceFileName: input.source?.name,
    sourceFileUrl: input.source?.url,
    note: input.note,
    uploadedAt: now(),
  };
  const item: Item = {
    id: itemId,
    title: input.title,
    projectId: input.projectId,
    designerId,
    approverId: input.approverId,
    dueDate: input.dueDate,
    status: 'pending',
    versions: [version],
    createdAt: now(),
    events: [event({ type: 'uploaded', authorId: designerId, versionNumber: 1, text: input.note || undefined })],
  };
  const n = notify(input.approverId, itemId, 'new', designerId, input.note);
  return { state: { ...s, items: [item, ...s.items], notifications: [n, ...s.notifications] }, item };
}

export function addVersion(
  s: AppState,
  itemId: string,
  input: { note: string; preview: { url: string; name: string; mime: string }; source?: { url: string; name: string }; fixes?: string[] },
): AppState {
  const item = s.items.find((i) => i.id === itemId);
  if (!item) return s;
  const number = item.versions.length + 1;
  const fixes = new Set(input.fixes ?? []);
  const version: Version = {
    id: uid('v'),
    number,
    previewFileUrl: input.preview.url,
    previewFileName: input.preview.name,
    previewMime: input.preview.mime,
    sourceFileName: input.source?.name,
    sourceFileUrl: input.source?.url,
    note: input.note,
    uploadedAt: now(),
    fixes: fixes.size ? [...fixes] : undefined,
  };
  const next = patchItem(s, itemId, (i) => ({
    ...i,
    status: 'pending',
    versions: [...i.versions, version],
    events: [...i.events, event({ type: 'version', authorId: s.currentUserId, versionNumber: number, text: input.note || undefined })],
  }));
  const n = notify(item.approverId, itemId, 'version', s.currentUserId, input.note);
  // הערות שסומנו "תוקן בגרסה הזו" נסגרות כטופלו
  const comments = fixes.size ? next.comments.map((c) => (fixes.has(c.id) && !c.resolved ? { ...c, resolved: true } : c)) : next.comments;
  return { ...next, comments, notifications: [n, ...next.notifications] };
}

export function decide(s: AppState, itemId: string, status: Exclude<Status, 'pending'>, text: string, checks?: BrandCheck[]): AppState {
  const item = s.items.find((i) => i.id === itemId);
  if (!item) return s;
  const versionNumber = item.versions.length;
  const next = patchItem(s, itemId, (i) => ({
    ...i,
    status,
    events: [...i.events, event({ type: 'decision', authorId: s.currentUserId, versionNumber, status, text: text || undefined, checks: status === 'approved' && checks?.length ? checks : undefined })],
  }));
  const n = notify(item.designerId, itemId, status, s.currentUserId, text);
  return { ...next, notifications: [n, ...next.notifications] };
}

export function addComment(s: AppState, itemId: string, versionId: string, text: string, pin?: Pin, parentId?: string): AppState {
  const item = s.items.find((i) => i.id === itemId);
  if (!item) return s;
  const version = item.versions.find((v) => v.id === versionId);
  const comment: Comment = {
    id: uid('c'),
    itemId,
    versionId,
    authorId: s.currentUserId,
    text,
    pin: parentId ? undefined : pin,
    createdAt: now(),
    resolved: false,
    parentId,
  };
  const next = patchItem(s, itemId, (i) => ({
    ...i,
    events: [...i.events, event({ type: 'comment', authorId: s.currentUserId, versionNumber: version?.number, text })],
  }));
  // תגובה מעדכנת את כותב ההערה המקורית (אם זה מישהו אחר)
  const parent = parentId ? s.comments.find((c) => c.id === parentId) : undefined;
  const notifications = parent && parent.authorId !== s.currentUserId ? [notify(parent.authorId, itemId, 'reply', s.currentUserId, text), ...next.notifications] : next.notifications;
  return { ...next, comments: [...next.comments, comment], notifications };
}

/** מחיקת הערה, יחד עם התגובות אליה */
export function deleteComment(s: AppState, commentId: string): AppState {
  return { ...s, comments: s.comments.filter((c) => c.id !== commentId && c.parentId !== commentId) };
}

export function toggleResolved(s: AppState, commentId: string): AppState {
  return { ...s, comments: s.comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c)) };
}

export function markRead(s: AppState, notificationId: string): AppState {
  return { ...s, notifications: s.notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)) };
}

export function markAllRead(s: AppState, userId: string): AppState {
  return { ...s, notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)) };
}
