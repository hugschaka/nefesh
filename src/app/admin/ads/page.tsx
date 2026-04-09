'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { AdSchema, type Ad, type AdInput } from '@/lib/types';
import clsx from 'clsx';
import Image from 'next/image';

const POSITION_LABELS: Record<Ad['position'], string> = {
  top: 'עליון',
  sidebar: 'סרגל צד',
  bottom: 'תחתון',
};

const EMPTY_FORM: AdInput = {
  imageUrl: '',
  link: '',
  position: 'top',
  isActive: true,
};

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AdInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Real-time ads listener
  useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAds(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ad))
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function startEdit(ad: Ad) {
    setEditingId(ad.id);
    setForm({
      imageUrl: ad.imageUrl,
      link: ad.link,
      position: ad.position,
      isActive: ad.isActive,
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = AdSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'שגיאת אימות');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'ads', editingId), {
          ...parsed.data,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'ads'), {
          ...parsed.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      cancelEdit();
    } catch (err) {
      console.error('[AdManager]', err);
      setFormError('שגיאה בשמירה. נסו שנית.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'ads', id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('[AdDelete]', err);
    }
  }

  async function toggleActive(ad: Ad) {
    try {
      await updateDoc(doc(db, 'ads', ad.id), {
        isActive: !ad.isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[AdToggle]', err);
    }
  }

  return (
    <>
      <Navbar role="admin" />
      <main className="min-h-[calc(100vh-70px)] bg-[#f3f3f3] px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="section-title">ניהול מודעות</h1>
            {editingId && (
              <button onClick={cancelEdit} className="btn-secondary text-sm">
                ביטול עריכה
              </button>
            )}
          </div>

          {/* ── Form ── */}
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold text-[#383838]">
              {editingId ? 'עריכת מודעה' : 'מודעה חדשה'}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                    כתובת URL לתמונה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="input-field"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">
                    קישור יעד <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://example.com"
                    className="input-field"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#383838]">מיקום</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value as Ad['position'] })}
                    className="input-field"
                  >
                    <option value="top">עליון</option>
                    <option value="sidebar">סרגל צד</option>
                    <option value="bottom">תחתון</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isActive}
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={clsx(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      form.isActive ? 'bg-[#00b6e5]' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                        form.isActive ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <span className="text-sm text-[#383838]">מודעה פעילה</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className={clsx('btn-primary', saving && 'cursor-not-allowed opacity-60')}
                >
                  {saving ? 'שומר...' : editingId ? 'עדכן מודעה' : 'הוסף מודעה'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="btn-secondary">
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* ── Ads list ── */}
          <section>
            <h2 className="section-title mb-4">מודעות קיימות ({ads.length})</h2>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white animate-pulse" />
                ))}
              </div>
            )}

            {!loading && ads.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                <p className="text-4xl mb-2">📢</p>
                <p className="text-[#666666]">אין מודעות עדיין. הוסיפו את הראשונה!</p>
              </div>
            )}

            <div className="space-y-4">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  className={clsx(
                    'card flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4',
                    !ad.isActive && 'opacity-60'
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={ad.imageUrl}
                      alt="תמונת מודעה"
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#00b6e5] hover:underline truncate block"
                      dir="ltr"
                    >
                      {ad.link}
                    </a>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-pill bg-gray-100 px-2 py-0.5 text-xs text-[#666666]">
                        {POSITION_LABELS[ad.position]}
                      </span>
                      <span
                        className={clsx(
                          'rounded-pill px-2 py-0.5 text-xs font-medium',
                          ad.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {ad.isActive ? 'פעיל' : 'כבוי'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(ad)}
                      className="rounded-pill border border-gray-300 px-3 py-1.5 text-xs font-medium text-[#666666] hover:border-[#00b6e5] hover:text-[#00b6e5] transition-colors"
                    >
                      {ad.isActive ? 'כבה' : 'הפעל'}
                    </button>
                    <button
                      onClick={() => startEdit(ad)}
                      className="rounded-pill border border-gray-300 px-3 py-1.5 text-xs font-medium text-[#666666] hover:border-[#1c57ff] hover:text-[#1c57ff] transition-colors"
                    >
                      עריכה
                    </button>
                    {deleteConfirm === ad.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="rounded-pill bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                        >
                          אשר מחיקה
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-pill border border-gray-300 px-2 py-1.5 text-xs text-[#666666] hover:border-gray-400"
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(ad.id)}
                        className="rounded-pill border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors"
                      >
                        מחיקה
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
