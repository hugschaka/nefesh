'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_ANNOUNCEMENT, type AnnouncementConfig } from '@/lib/types';

export default function AnnouncementPopup() {
  const [config, setConfig] = useState<AnnouncementConfig>(DEFAULT_ANNOUNCEMENT);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_config', 'announcements'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.popup) setConfig(data.popup as AnnouncementConfig);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!config.isActive || !config.text) return;
    // Show once per session
    const shown = sessionStorage.getItem('announcement_popup_shown');
    if (!shown) {
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem('announcement_popup_shown', '1');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [config.isActive, config.text]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={() => setVisible(false)}
    >
      <div
        className="relative max-w-lg w-full rounded-2xl shadow-2xl p-8 text-center"
        style={{
          backgroundColor: config.bgColor,
          backgroundImage: config.bgImageUrl ? `url(${config.bgImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: config.fontFamily,
          fontSize: `${config.fontSize}px`,
          color: config.textColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 left-3 opacity-60 hover:opacity-100 text-lg leading-none"
          aria-label="סגור"
        >
          ✕
        </button>
        <div className="whitespace-pre-line leading-relaxed mt-2">{config.text}</div>
      </div>
    </div>
  );
}
