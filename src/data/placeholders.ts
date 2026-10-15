// מחוללי placeholders גרפיים (SVG) לנתוני הדמה, בלי תלות באינטרנט.
// כל תבנית מקבלת מספר גרסה, כך ש-v1/v2/v3 נראות שונות זו מזו בהשוואה.

export type PlaceholderKind = 'banner' | 'social' | 'flyer' | 'logo' | 'rollup' | 'catalog' | 'card' | 'icons';

export interface PlaceholderSpec {
  kind: PlaceholderKind;
  title: string;
  subtitle?: string;
  cta?: string;
  /** [רקע, הדגשה, טקסט] */
  palette: [string, string, string];
  version: number;
}

const FONT = "Heebo, 'Segoe UI', Arial, sans-serif";

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function text(
  x: number,
  y: number,
  value: string,
  size: number,
  fill: string,
  opts: { weight?: number; anchor?: 'start' | 'middle' | 'end'; opacity?: number } = {},
) {
  const { weight = 700, anchor = 'end', opacity = 1 } = opts;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`;
}

function svg(w: number, h: number, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

function pomegranate(cx: number, cy: number, r: number, color: string, leaf: string) {
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
    <path d="M${cx - r * 0.25} ${cy - r * 0.95} l${r * 0.12} ${-r * 0.3} l${r * 0.13} ${r * 0.18} l${r * 0.13} ${-r * 0.18} l${r * 0.12} ${r * 0.3} z" fill="${color}"/>
    <path d="M${cx + r * 0.2} ${cy - r * 1.05} q${r * 0.5} ${-r * 0.5} ${r * 0.9} ${-r * 0.2} q${-r * 0.4} ${r * 0.4} ${-r * 0.9} ${r * 0.2}z" fill="${leaf}"/>
    <circle cx="${cx - r * 0.35}" cy="${cy - r * 0.3}" r="${r * 0.18}" fill="#ffffff" opacity="0.25"/>
  </g>`;
}

function honeyDrop(cx: number, cy: number, s: number, color: string) {
  return `<path d="M${cx} ${cy - s} C ${cx + s * 0.8} ${cy - s * 0.1}, ${cx + s * 0.7} ${cy + s * 0.8}, ${cx} ${cy + s * 0.8} C ${cx - s * 0.7} ${cy + s * 0.8}, ${cx - s * 0.8} ${cy - s * 0.1}, ${cx} ${cy - s} z" fill="${color}"/>`;
}

function bottle(x: number, y: number, w: number, h: number, body: string, cap: string, label: string) {
  return `<g>
    <rect x="${x + w * 0.35}" y="${y}" width="${w * 0.3}" height="${h * 0.12}" rx="4" fill="${cap}"/>
    <rect x="${x + w * 0.25}" y="${y + h * 0.1}" width="${w * 0.5}" height="${h * 0.1}" rx="6" fill="${body}" opacity="0.85"/>
    <rect x="${x}" y="${y + h * 0.18}" width="${w}" height="${h * 0.82}" rx="${w * 0.18}" fill="${body}"/>
    <rect x="${x + w * 0.12}" y="${y + h * 0.42}" width="${w * 0.76}" height="${h * 0.3}" rx="6" fill="${label}"/>
  </g>`;
}

function banner(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 1200;
  const H = 628;
  const v = s.version;
  const ctaColor = v >= 2 ? fg : accent;
  const ctaText = v >= 2 ? bg : '#ffffff';
  // כותרת ארוכה מקבלת פונט קטן יותר כדי לא לעלות על האיור
  const titleSize = Math.min(v >= 2 ? 88 : 76, Math.floor(640 / (s.title.length * 0.52)));
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${bg}"/>
     <circle cx="${v >= 3 ? 220 : 180}" cy="${H / 2}" r="${v >= 2 ? 300 : 260}" fill="${accent}" opacity="0.14"/>
     ${pomegranate(v >= 2 ? 250 : 220, H / 2 + 20, v >= 2 ? 150 : 130, accent, '#3f7d4e')}
     ${v >= 2 ? pomegranate(410, H / 2 + 130, 60, accent, '#3f7d4e') : ''}
     ${honeyDrop(v >= 3 ? 470 : 420, 170, 42, '#e9a23b')}
     ${text(W - 80, 110, 'גדות', 34, fg, { weight: 800, opacity: 0.9 })}
     ${text(W - 80, v >= 2 ? 270 : 280, s.title, titleSize, fg, { weight: 800 })}
     ${text(W - 80, v >= 2 ? 345 : 350, s.subtitle ?? '', 34, fg, { weight: 400, opacity: 0.8 })}
     <rect x="${W - 80 - 280}" y="${v >= 2 ? 410 : 420}" width="280" height="72" rx="36" fill="${ctaColor}"/>
     ${text(W - 80 - 140, v >= 2 ? 457 : 467, s.cta ?? 'לפרטים', 30, ctaText, { anchor: 'middle' })}
     ${v >= 3 ? text(W - 80, 560, '* בתוקף עד סוף החג, בכפוף לתקנון', 20, fg, { weight: 400, opacity: 0.6 }) : ''}`,
  );
}

function social(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const S = 1080;
  const v = s.version;
  return svg(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${bg}"/>
     <rect x="60" y="60" width="${S - 120}" height="${S - 120}" rx="40" fill="none" stroke="${accent}" stroke-width="${v >= 2 ? 6 : 3}" opacity="0.6"/>
     ${pomegranate(S / 2, v >= 2 ? 380 : 400, v >= 2 ? 170 : 150, accent, '#3f7d4e')}
     ${honeyDrop(S / 2 + 230, 300, 48, '#e9a23b')}
     ${v >= 2 ? honeyDrop(S / 2 - 240, 470, 32, '#e9a23b') : ''}
     ${text(S / 2, v >= 2 ? 720 : 740, s.title, v >= 2 ? 110 : 96, fg, { anchor: 'middle', weight: 800 })}
     ${text(S / 2, v >= 2 ? 810 : 820, s.subtitle ?? '', 40, fg, { anchor: 'middle', weight: 400, opacity: 0.8 })}
     ${text(S / 2, 960, 'גדות · תשפ״ז', 30, accent, { anchor: 'middle', weight: 700 })}`,
  );
}

function flyer(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 800;
  const H = 1131;
  const v = s.version;
  const rows = ['ניקוי מקצועי לתעשייה', 'פתרונות לכביסה מוסדית', 'חיטוי וסניטציה', 'שירות ותמיכה טכנית'];
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>
     <rect width="${W}" height="${v >= 2 ? 520 : 460}" fill="${bg}"/>
     ${bottle(90, 120, 150, 300, accent, fg, '#ffffff')}
     ${bottle(270, 170, 120, 250, fg, accent, '#ffffff')}
     ${v >= 2 ? bottle(410, 210, 100, 210, accent, fg, '#ffffff') : ''}
     ${text(W - 60, 110, 'גדות', 30, '#ffffff', { weight: 800 })}
     ${text(W - 60, v >= 2 ? 600 : 540, s.title, 56, fg, { weight: 800 })}
     ${text(W - 60, v >= 2 ? 650 : 590, s.subtitle ?? '', 26, '#475467', { weight: 400 })}
     ${rows
       .map(
         (r, i) =>
           `<circle cx="${W - 72}" cy="${(v >= 2 ? 728 : 668) + i * 64}" r="10" fill="${accent}"/>` +
           text(W - 100, (v >= 2 ? 738 : 678) + i * 64, r, 28, '#1d2939', { weight: 500 }),
       )
       .join('')}
     <rect x="60" y="${H - 130}" width="${W - 120}" height="80" rx="16" fill="${v >= 3 ? accent : fg}"/>
     ${text(W / 2, H - 78, s.cta ?? 'לפרטים: 03-0000000', 30, '#ffffff', { anchor: 'middle' })}`,
  );
}

function logo(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const S = 800;
  const v = s.version;
  const mark =
    v === 1
      ? `<circle cx="${S / 2}" cy="300" r="120" fill="${accent}"/>
         <path d="M${S / 2 - 60} 300 q60 -110 120 0 q-60 110 -120 0z" fill="${bg}"/>`
      : v === 2
        ? `<rect x="${S / 2 - 120}" y="180" width="240" height="240" rx="60" fill="${accent}"/>
           <path d="M${S / 2 - 70} 330 q70 -150 140 0" stroke="${bg}" stroke-width="26" fill="none" stroke-linecap="round"/>`
        : `<rect x="${S / 2 - 120}" y="180" width="240" height="240" rx="120" fill="${accent}"/>
           <path d="M${S / 2 - 70} 340 q70 -170 140 0" stroke="${bg}" stroke-width="28" fill="none" stroke-linecap="round"/>
           <circle cx="${S / 2}" cy="250" r="18" fill="${bg}"/>`;
  return svg(
    S,
    S,
    `<rect width="${S}" height="${S}" fill="${bg}"/>
     ${mark}
     ${text(S / 2, 540, s.title, v >= 2 ? 84 : 76, fg, { anchor: 'middle', weight: 800 })}
     ${text(S / 2, 600, s.subtitle ?? '', 28, fg, { anchor: 'middle', weight: 400, opacity: 0.7 })}`,
  );
}

function rollup(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 600;
  const H = 1400;
  const v = s.version;
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${bg}"/>
     <rect y="${H - 260}" width="${W}" height="260" fill="${accent}"/>
     ${text(W / 2, 170, 'גדות', 90, fg, { anchor: 'middle', weight: 800 })}
     ${text(W / 2, 230, 'כימיקלים ופתרונות לתעשייה', 28, fg, { anchor: 'middle', weight: 400, opacity: 0.8 })}
     ${bottle(110, 420, 160, 340, accent, fg, '#ffffff')}
     ${bottle(320, 470, 150, 290, fg, accent, '#ffffff')}
     ${text(W / 2, 900, s.title, v >= 2 ? 58 : 52, fg, { anchor: 'middle', weight: 800 })}
     ${text(W / 2, 960, s.subtitle ?? '', 28, fg, { anchor: 'middle', weight: 400, opacity: 0.8 })}
     ${text(W / 2, H - 140, s.cta ?? 'ביתן 4 · דוכן B12', 40, '#ffffff', { anchor: 'middle', weight: 700 })}
     ${text(W / 2, H - 80, 'www.example.co.il', 24, '#ffffff', { anchor: 'middle', weight: 400, opacity: 0.85 })}`,
  );
}

function catalog(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 1200;
  const H = 850;
  const v = s.version;
  const products = ['נוזל רצפות 4 ל׳', 'מסיר שומנים', 'אבקת כביסה תעשייתית', 'מרכך מרוכז'];
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="#ffffff"/>
     <rect x="${W / 2}" width="${W / 2}" height="${H}" fill="${bg}"/>
     <line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="#d0d5dd" stroke-width="2"/>
     ${text(W - 60, 100, s.title, 50, fg, { weight: 800 })}
     ${text(W - 60, 145, s.subtitle ?? '', 24, '#475467', { weight: 400 })}
     ${products
       .map((p, i) => {
         const col = i % 2;
         const row = Math.floor(i / 2);
         const x = W / 2 + 50 + col * 270;
         const y = 210 + row * 310;
         return `<rect x="${x}" y="${y}" width="230" height="270" rx="16" fill="#ffffff"/>
           ${bottle(x + 75, y + 25, 80, 160, i % 2 ? fg : accent, i % 2 ? accent : fg, '#ffffff')}
           ${text(x + 215, y + 220, p, 20, '#1d2939', { weight: 600 })}
           ${text(x + 215, y + 250, v >= 2 ? `מק״ט 70${i}1` : `מק״ט 10${i}0`, 16, '#667085', { weight: 400 })}`;
       })
       .join('')}
     <rect x="60" y="80" width="${W / 2 - 120}" height="${H - 160}" rx="24" fill="${accent}" opacity="${v >= 2 ? 0.95 : 0.85}"/>
     ${bottle(190, 200, 170, 360, fg, '#ffffff', '#ffffff')}
     ${text(W / 4, 660, v >= 2 ? 'חדש בקטלוג' : 'סדרת המקצוענים', 44, '#ffffff', { anchor: 'middle', weight: 800 })}
     ${text(W / 4, 710, 'ביצועים גבוהים · ריכוז כפול', 24, '#ffffff', { anchor: 'middle', weight: 400 })}`,
  );
}

function card(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 1000;
  const H = 700;
  const v = s.version;
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${bg}"/>
     <rect x="30" y="30" width="${W - 60}" height="${H - 60}" rx="20" fill="none" stroke="${accent}" stroke-width="2"/>
     ${pomegranate(170, 360, v >= 3 ? 110 : 95, accent, '#3f7d4e')}
     ${honeyDrop(830, 170, 36, '#e9a23b')}
     ${text(W - 100, 300, s.title, v >= 2 ? 72 : 64, fg, { weight: 800 })}
     ${text(W - 100, 370, s.subtitle ?? '', 28, fg, { weight: 400, opacity: 0.8 })}
     ${text(W - 100, 520, v >= 3 ? 'בברכת שנה טובה ומתוקה,' : 'בברכה,', 26, fg, { weight: 400 })}
     ${text(W - 100, 565, 'צוות גדות', 32, accent, { weight: 800 })}`,
  );
}

function icons(s: PlaceholderSpec) {
  const [bg, accent, fg] = s.palette;
  const W = 1000;
  const H = 700;
  const labels = ['ידידותי לסביבה', 'ריכוז כפול', 'תקן ישראלי', 'לשימוש מקצועי', 'בטוח למגע', 'מתכלה'];
  return svg(
    W,
    H,
    `<rect width="${W}" height="${H}" fill="${bg}"/>
     ${text(W - 60, 90, s.title, 44, fg, { weight: 800 })}
     ${labels
       .map((l, i) => {
         const col = i % 3;
         const row = Math.floor(i / 3);
         const cx = W - 200 - col * 300;
         const cy = 260 + row * 250;
         return `<circle cx="${cx}" cy="${cy}" r="70" fill="${i % 2 ? accent : fg}"/>
           <path d="M${cx - 30} ${cy} l20 22 l40 -45" stroke="#ffffff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
           ${text(cx, cy + 115, l, 24, fg, { anchor: 'middle', weight: 600 })}`;
       })
       .join('')}`,
  );
}

const renderers: Record<PlaceholderKind, (s: PlaceholderSpec) => string> = {
  banner,
  social,
  flyer,
  logo,
  rollup,
  catalog,
  card,
  icons,
};

export function placeholderSvg(spec: PlaceholderSpec): string {
  return renderers[spec.kind](spec);
}

export function placeholderDataUrl(spec: PlaceholderSpec): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg(spec))}`;
}
