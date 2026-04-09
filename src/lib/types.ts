import { z } from 'zod';

// ─── Role ─────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'lecturer' | 'admin';

// ─── Lesson ───────────────────────────────────────────────────────────────────
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf' | 'mp3' | 'mp4';
  thumbnailUrl?: string;
  lecturerId: string;
  lecturerName?: string;
  isPublished: boolean;
  status: 'pending_bot' | 'processing' | 'done' | 'error';
  createdAt: number; // epoch ms
  updatedAt: number;
  // Bot-generated content (populated after processing)
  notebookUrl?: string;
  podcastUrl?: string;
  quizUrl?: string;
  presentationUrl?: string;
  rawPresentationUrl?: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  lessonId: string;
  lessonTitle: string;
  progress: number; // 0-100
  progressLabel: string; // Hebrew status text
  status: 'queued' | 'processing' | 'pending_approval' | 'published' | 'failed' | 'session_expired' | 'rejected' | 'error';
  errorScreenshotUrl?: string;
  podcastUrl?: string;
  quizUrl?: string;
  presentationUrl?: string;
  notebookUrl?: string;
  createdAt: number;
  updatedAt: number;
}

// ─── Ad ───────────────────────────────────────────────────────────────────────
export interface Ad {
  id: string;
  imageUrl: string;
  link: string;
  position: 'top' | 'sidebar' | 'bottom';
  isActive: boolean;
  createdAt: number;
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
export const UploadLessonSchema = z.object({
  title: z.string().min(2, 'הכותרת חייבת להכיל לפחות 2 תווים').max(120, 'הכותרת ארוכה מדי'),
});

export const AdSchema = z.object({
  imageUrl: z.string().url('נא להזין כתובת URL תקינה לתמונה'),
  link: z.string().url('נא להזין כתובת URL תקינה לקישור'),
  position: z.enum(['top', 'sidebar', 'bottom']),
  isActive: z.boolean(),
});

export type UploadLessonInput = z.infer<typeof UploadLessonSchema>;
export type AdInput = z.infer<typeof AdSchema>;

// ─── Announcements ────────────────────────────────────────────────────────────
export interface AnnouncementConfig {
  isActive: boolean;
  text: string;
  bgColor: string;
  bgImageUrl?: string;
  fontFamily: string;
  fontSize: number; // px
  textColor: string;
}

export interface SiteAnnouncements {
  topBanner: AnnouncementConfig;
  sideScrollLeft: AnnouncementConfig;
  sideScrollRight: AnnouncementConfig;
  popup: AnnouncementConfig;
}

export const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
  isActive: false,
  text: '',
  bgColor: '#00b6e5',
  bgImageUrl: '',
  fontFamily: 'Open Sans Hebrew',
  fontSize: 14,
  textColor: '#ffffff',
};
