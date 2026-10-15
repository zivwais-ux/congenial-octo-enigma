import type { Channel } from '../../types';

const DOT: Record<Channel, string> = { מייל: 'bg-stone-400', Teams: 'bg-[#5b5fc7]', וואטסאפ: 'bg-[#25a35a]' };

/** תגית קטנה שמדמה לאיזה ערוץ ההתראה "נשלחה" */
export function ChannelTag({ channel, dark }: { channel: Channel; dark?: boolean }) {
  return (
    <span
      className={`inline-flex h-[18px] items-center gap-1 rounded px-1.5 text-2xs font-medium ${dark ? 'bg-white/10 text-stone-200' : 'border border-stone-200 bg-white text-stone-600'}`}
      data-testid="channel-tag"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[channel]}`} />
      {channel}
    </span>
  );
}
