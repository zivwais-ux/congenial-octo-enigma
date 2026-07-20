/**
 * Small, dependency-free unique id generator. Good enough for client-side
 * records; the backend assigns canonical ids when a real database is wired up.
 */
export function createId(prefix = 'rec'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}${rand}`;
}
