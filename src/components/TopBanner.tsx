'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_ANNOUNCEMENT, type AnnouncementConfig } from '@/lib/types';

export default function TopBanner() {
  const [config, setConfig] = useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENT);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_config', 'announcements'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.topBanner) setConfig(data.topBanner as AnnouncementConfig);
      }
    });
    return () => unsub();
  }, []);

  if (!config.isActive || !config.text) return null;

  return (
    <div
      style={{
        backgroundColor: config.bgColor,
        backgroundImage: config.bgImageUrl ? `url(${config.bgImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: config.fontFamily,
        fontSize: `${config.fontSize}px`,
        color: config.textColor,
      }}
      className="w-full py-2 px-6 text-center font-medium"
    >
      {config.text}
    </div>
  );
}
