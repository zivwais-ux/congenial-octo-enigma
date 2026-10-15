import { Mail, MessageCircle, Users } from 'lucide-react';
import type { Channel } from '../../types';

const META: Record<Channel, { icon: typeof Mail; light: string; dark: string }> = {
  מייל: { icon: Mail, light: 'bg-zinc-100 text-zinc-700 ring-zinc-200', dark: 'bg-white/10 text-zinc-100 ring-white/10' },
  Teams: { icon: Users, light: 'bg-indigo-50 text-indigo-700 ring-indigo-200', dark: 'bg-indigo-400/20 text-indigo-100 ring-indigo-300/20' },
  וואטסאפ: { icon: MessageCircle, light: 'bg-green-50 text-green-700 ring-green-200', dark: 'bg-green-400/20 text-green-100 ring-green-300/20' },
};

/** תגית קטנה שמדמה לאיזה ערוץ ההתראה "נשלחה" */
export function ChannelTag({ channel, dark }: { channel: Channel; dark?: boolean }) {
  const m = META[channel];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${dark ? m.dark : m.light}`}
      data-testid="channel-tag"
    >
      <Icon className="h-3 w-3" />
      {channel}
    </span>
  );
}
