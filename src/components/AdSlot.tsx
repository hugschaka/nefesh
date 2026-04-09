'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import clsx from 'clsx';
import type { Ad } from '@/lib/types';

interface AdSlotProps {
  position: Ad['position'];
  className?: string;
}

export default function AdSlot({ position, className }: AdSlotProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchAds() {
      try {
        const q = query(
          collection(db, 'ads'),
          where('position', '==', position),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ad));
        setAds(fetched);
      } catch (err) {
        console.error('[AdSlot] fetch error:', err);
      }
    }
    fetchAds();
  }, [position]);

  // Rotate ads every 8 seconds if there are multiple
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % ads.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (!ads.length) return null;

  const ad = ads[currentIndex];

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl',
        position === 'sidebar' && 'w-full max-w-xs',
        position === 'top' && 'w-full',
        position === 'bottom' && 'w-full',
        className
      )}
    >
      <a
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group block"
        aria-label="מודעה"
      >
        <div className="relative aspect-[3/1] w-full bg-gray-100">
          <Image
            src={ad.imageUrl}
            alt="מודעה"
            fill
            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
            sizes="(max-width: 640px) 100vw, 600px"
          />
        </div>
      </a>

      {/* Dots indicator for multiple ads */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2 bg-white">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`מודעה ${i + 1}`}
              className={clsx(
                'h-1.5 w-1.5 rounded-full transition-colors',
                i === currentIndex ? 'bg-[#00b6e5]' : 'bg-gray-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
