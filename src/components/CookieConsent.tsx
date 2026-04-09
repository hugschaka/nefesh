'use client';

import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem('cookie_consent', '1');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#2c2c2c] text-white px-6 py-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xl">
      <p className="text-sm text-gray-200 flex-1 text-center sm:text-right leading-relaxed">
        אתר זה משתמש בעוגיות לצורך תפעול השירות, ועשוי לשלוח לכם הודעות דוא&quot;ל בנוגע לתכנים
        שהגשתם לעיבוד.
        המשך השימוש באתר מהווה הסכמה לתנאים אלה.
      </p>
      <button onClick={accept} className="btn-primary shrink-0 text-sm whitespace-nowrap">
        הבנתי, אני מסכים/ה
      </button>
    </div>
  );
}
