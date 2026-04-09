'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_ANNOUNCEMENT, type AnnouncementConfig } from '@/lib/types';

interface Props {
  side: 'left' | 'right';
}

export default function SideScroller({ side }: Props) {
  const field = side === 'left' ? 'sideScrollLeft' : 'sideScrollRight';
  const [config, setConfig] = useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENT);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_config', 'announcements'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data[field]) setConfig(data[field] as AnnouncementConfig);
      }
    });
    return () => unsub();
  }, [field]);

  if (!config.isActive || !config.text) return null;

  // Quadruple the text for a seamless loop (animation moves -50%)
  const repeated = `${config.text}\n\n${config.text}\n\n${config.text}\n\n${config.text}`;

  return (
    <div
      className="fixed top-0 hidden xl:block z-40 overflow-hidden"
      style={{
        [side === 'right' ? 'right' : 'left']: 0,
        width: '42px',
        height: '100vh',
        backgroundColor: config.bgColor,
        backgroundImage: config.bgImageUrl ? `url(${config.bgImageUrl})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <div
        className="animate-scroll-vertical"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: config.fontFamily,
          fontSize: `${config.fontSize}px`,
          color: config.textColor,
          padding: '8px 6px',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
          // flip direction so text reads top→bottom naturally
          transform: side === 'left' ? 'rotate(180deg)' : 'none',
        }}
      >
        {repeated}
      </div>
    </div>
  );
}
