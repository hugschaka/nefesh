import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import type { Lesson } from '@/lib/types';

interface LessonCardProps {
  lesson: Lesson;
}

const FILE_TYPE_LABEL: Record<Lesson['fileType'], string> = {
  pdf: 'PDF',
  mp3: 'שמע',
  mp4: 'וידאו',
};

const FILE_TYPE_COLOR: Record<Lesson['fileType'], string> = {
  pdf: 'bg-orange-100 text-orange-700',
  mp3: 'bg-purple-100 text-purple-700',
  mp4: 'bg-blue-100 text-blue-700',
};

const FILE_TYPE_ICON: Record<Lesson['fileType'], string> = {
  pdf: '📄',
  mp3: '🎧',
  mp4: '🎬',
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const date = new Date(lesson.createdAt).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const hasPodcast = !!lesson.podcastUrl;
  const hasQuiz = !!lesson.quizUrl;
  const hasPresentation = !!lesson.presentationUrl;
  const hasBotContent = hasPodcast || hasQuiz || hasPresentation;

  return (
    <Link href={`/lessons/${lesson.id}`} className="group block h-full">
      <article className="card h-full flex flex-col">

        {/* Thumbnail */}
        <div className="relative h-40 w-full overflow-hidden bg-[#f3f3f3]">
          {lesson.thumbnailUrl ? (
            <Image
              src={lesson.thumbnailUrl}
              alt={lesson.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="256px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl bg-gradient-to-br from-[#f0fbff] to-[#e0f5ff]">
              {FILE_TYPE_ICON[lesson.fileType]}
            </div>
          )}

          {/* File type badge */}
          <span className={clsx(
            'absolute top-2 end-2 rounded-pill px-2.5 py-0.5 text-xs font-semibold',
            FILE_TYPE_COLOR[lesson.fileType]
          )}>
            {FILE_TYPE_LABEL[lesson.fileType]}
          </span>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-[#383838] group-hover:text-[#00b6e5] transition-colors">
            {lesson.title}
          </h3>

          {lesson.description && (
            <p className="mt-1 line-clamp-2 text-xs text-[#666666] leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Bot-generated content badges */}
          {hasBotContent && (
            <div className="mt-3 flex gap-1.5 flex-wrap">
              {hasPodcast && (
                <span className="rounded-pill bg-[#f0fbff] border border-[#00b6e5]/30 px-2 py-0.5 text-xs text-[#00b6e5] font-medium">
                  🎙️ פודקאסט
                </span>
              )}
              {hasQuiz && (
                <span className="rounded-pill bg-[#f0fbff] border border-[#00b6e5]/30 px-2 py-0.5 text-xs text-[#00b6e5] font-medium">
                  📝 חידון
                </span>
              )}
              {hasPresentation && (
                <span className="rounded-pill bg-[#f0fbff] border border-[#00b6e5]/30 px-2 py-0.5 text-xs text-[#00b6e5] font-medium">
                  📊 מצגת
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-50">
            <time dateTime={new Date(lesson.createdAt).toISOString()}>{date}</time>
            <span className="text-[#00b6e5] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              לשיעור ←
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
