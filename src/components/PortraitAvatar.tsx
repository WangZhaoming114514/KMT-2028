import { useState } from 'react';
import { PORTRAITS } from '../data/portraits';

interface PortraitAvatarProps {
  portraitKey: string;
  sizeClass?: string;
  className?: string;
}

export function PortraitAvatar({
  portraitKey,
  sizeClass = 'w-14 h-14',
  className = '',
}: PortraitAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const entry = PORTRAITS[portraitKey] ?? PORTRAITS.lu;

  return (
    <div
      className={`relative shrink-0 overflow-hidden border border-[#2C3A52] bg-[#0E1420] ${sizeClass} ${className}`}
      title={`${entry.name}（${entry.partyTag} · Wikimedia Commons）`}
    >
      {!imgFailed ? (
        <img
          src={entry.commonsUrl}
          alt={`${entry.name} 肖像`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center text-white"
          style={{
            background: `linear-gradient(145deg, ${entry.accentHex}44, #090C12 85%)`,
          }}
        >
          <span className="text-lg font-black tracking-tight leading-none">{entry.monogram}</span>
          <span className="mt-1 font-mono-bbs text-[9px] text-slate-300 opacity-80">
            {entry.partyTag.split(' ')[0]}
          </span>
        </div>
      )}
    </div>
  );
}
