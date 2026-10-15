// עזרי ניסוח בעברית: ברכה לפי שעה, יחיד/רבים

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

export function firstName(name: string) {
  return name.split(' ')[0];
}

/** "עבודה אחת" / "2 עבודות" */
export function works(n: number) {
  return n === 1 ? 'עבודה אחת' : `${n} עבודות`;
}

export function comments(n: number) {
  return n === 1 ? 'הערה אחת' : `${n} הערות`;
}

export function versions(n: number) {
  return n === 1 ? 'גרסה אחת' : `${n} גרסאות`;
}

export function todayLabel(d = new Date()) {
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}
