'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_ANNOUNCEMENT, type AnnouncementConfig, type SiteAnnouncements } from '@/lib/types';

const TABS = [
  { key: 'topBanner' as const, label: 'כרזה עליונה' },
  { key: 'sideScrollLeft' as const, label: 'גלילה שמאל' },
  { key: 'sideScrollRight' as const, label: 'גלילה ימין' },
  { key: 'popup' as const, label: 'חלון קופץ' },
];

const FONT_OPTIONS = [
  'Open Sans Hebrew',
  'Heebo',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
];

const DEFAULT_STATE: SiteAnnouncements = {
  topBanner: { ...DEFAULT_ANNOUNCEMENT },
  sideScrollLeft: { ...DEFAULT_ANNOUNCEMENT },
  sideScrollRight: { ...DEFAULT_ANNOUNCEMENT },
  popup: { ...DEFAULT_ANNOUNCEMENT },
};

interface Props {
  onClose: () => void;
}

export default function AnnouncementEditor({ onClose }: Props) {
  const [data, setData] = useState<SiteAnnouncements>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<keyof SiteAnnouncements>('topBanner');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/announcements/get')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setData({
            topBanner: { ...DEFAULT_ANNOUNCEMENT, ...json.data.topBanner },
            sideScrollLeft: { ...DEFAULT_ANNOUNCEMENT, ...json.data.sideScrollLeft },
            sideScrollRight: { ...DEFAULT_ANNOUNCEMENT, ...json.data.sideScrollRight },
            popup: { ...DEFAULT_ANNOUNCEMENT, ...json.data.popup },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function updateField(tab: keyof SiteAnnouncements, field: keyof AnnouncementConfig, value: unknown) {
    setData((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [field]: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const code = sessionStorage.getItem('editor_code') ?? '';
      const res = await fetch('/api/announcements/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, data }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'שגיאה בשמירה');
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  }

  const current = data[activeTab];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between bg-[#383838] px-6 py-4 rounded-t-2xl shrink-0">
          <h2 className="text-lg font-bold text-white">עריכת הודעות האתר</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-[#f3f3f3] shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-[#00b6e5] bg-white text-[#00b6e5]'
                  : 'text-[#666666] hover:text-[#383838]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#666666]">טוען...</div>
          ) : (
            <>
              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={current.isActive}
                  onClick={() => updateField(activeTab, 'isActive', !current.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    current.isActive ? 'bg-[#00b6e5]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      current.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-[#383838]">
                  {current.isActive ? 'פעיל' : 'כבוי'}
                </span>
              </div>

              {/* Text */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">תוכן הטקסט</label>
                <textarea
                  rows={4}
                  value={current.text}
                  onChange={(e) => updateField(activeTab, 'text', e.target.value)}
                  className="input-field resize-none"
                  placeholder="הזינו את הטקסט להצגה..."
                />
              </div>

              {/* Font family + size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">גופן</label>
                  <select
                    value={current.fontFamily}
                    onChange={(e) => updateField(activeTab, 'fontFamily', e.target.value)}
                    className="input-field"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                    גודל גופן: {current.fontSize}px
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={48}
                    value={current.fontSize}
                    onChange={(e) => updateField(activeTab, 'fontSize', Number(e.target.value))}
                    className="w-full accent-[#00b6e5] mt-2"
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">צבע טקסט</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={current.textColor}
                      onChange={(e) => updateField(activeTab, 'textColor', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
                    />
                    <span className="text-xs text-[#666666] font-mono" dir="ltr">
                      {current.textColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">צבע רקע</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={current.bgColor}
                      onChange={(e) => updateField(activeTab, 'bgColor', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-gray-300 p-0.5"
                    />
                    <span className="text-xs text-[#666666] font-mono" dir="ltr">
                      {current.bgColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Background image URL */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  תמונת רקע (URL) — אופציונלי
                </label>
                <input
                  type="url"
                  value={current.bgImageUrl ?? ''}
                  onChange={(e) => updateField(activeTab, 'bgImageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="input-field"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-[#666666]">
                  תמונה תכסה את צבע הרקע
                </p>
              </div>

              {/* Live preview */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                  תצוגה מקדימה
                </label>
                <div
                  className="min-h-[60px] rounded-lg p-4 flex items-center justify-center text-center"
                  style={{
                    backgroundColor: current.bgColor,
                    backgroundImage: current.bgImageUrl
                      ? `url(${current.bgImageUrl})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    fontFamily: current.fontFamily,
                    fontSize: `${current.fontSize}px`,
                    color: current.textColor,
                  }}
                >
                  {current.text || (
                    <span style={{ opacity: 0.4 }}>תצוגה מקדימה תופיע כאן</span>
                  )}
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  ✓ השינויים נשמרו בהצלחה
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between items-center bg-white rounded-b-2xl shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm">
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`btn-primary text-sm ${saving || loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
}
