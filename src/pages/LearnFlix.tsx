import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, ChevronDown, Loader, AlertCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EXAM_CONFIGS } from '../services/examConfig';
import {
  getTopicsForExam,
  fetchVideosForTopic,
  getYouTubeThumbnail,
  clearOldVideoCache,
  Video,
} from '../services/youtubeService';

interface Chapter {
  id: string;
  name: string;
  videoCount: number;
  subject: string;
}

interface ChapterVideos {
  chapter: Chapter;
  videos: Video[];
  loading: boolean;
  error: boolean;
}

export default function LearnFlix() {
  const { profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [chapterVideos, setChapterVideos] = useState<Record<string, Video[]>>({});
  const [loadingVideos, setLoadingVideos] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [chaptersError, setChaptersError] = useState(false);

  // Clear old (Gemini-hallucinated) video cache on mount
  useEffect(() => {
    clearOldVideoCache();
  }, []);

  // ESC key to close video modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && playingVideo) {
        setPlayingVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingVideo]);

  // Get subjects for the user's exam
  const subjects = profile?.exam ? EXAM_CONFIGS[profile.exam]?.subjects || [] : [];

  const subjectEmojis: Record<string, string> = {
    Physics: '🔬',
    Chemistry: '🧪',
    Mathematics: '📐',
    Biology: '🧬',
    English: '📖',
    'General Test': '📋',
  };

  // Initialize with first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects, selectedSubject]);

  // Load chapters/topics for the exam
  useEffect(() => {
    const loadChapters = async () => {
      if (!profile?.exam || !selectedSubject) return;

      try {
        setLoadingChapters(true);
        setChaptersError(false);
        const topicGroups = getTopicsForExam(profile.exam);

        // Find the topic group matching the selected subject
        const subjectGroup = topicGroups.find(
          (g) => g.subject === selectedSubject
        );

        if (subjectGroup) {
          const chaptersData = subjectGroup.chapters.map((ch, idx) => ({
            id: `chapter-${selectedSubject}-${idx}`,
            name: ch.name,
            videoCount: 0,
            subject: ch.subject || selectedSubject,
          }));
          setChapters(chaptersData);
        } else {
          setChapters([]);
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
        setChaptersError(true);
      } finally {
        setLoadingChapters(false);
      }
    };

    loadChapters();
  }, [profile?.exam, selectedSubject]);

  // Load videos for a chapter
  const handleExpandChapter = async (chapter: Chapter) => {
    if (expandedChapter === chapter.id) {
      setExpandedChapter(null);
      return;
    }

    // Check if videos are already cached
    if (chapterVideos[chapter.id]) {
      setExpandedChapter(chapter.id);
      return;
    }

    try {
      setExpandedChapter(chapter.id);
      setLoadingVideos(chapter.id);

      const videos = await fetchVideosForTopic(
        chapter.name,
        selectedSubject,
        profile?.exam || ''
      );

      setChapterVideos((prev) => ({
        ...prev,
        [chapter.id]: videos,
      }));
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(null);
    }
  };

  const retryLoadVideos = async (chapter: Chapter) => {
    try {
      setLoadingVideos(chapter.id);

      const videos = await fetchVideosForTopic(
        chapter.name,
        selectedSubject,
        profile?.exam || ''
      );

      setChapterVideos((prev) => ({
        ...prev,
        [chapter.id]: videos,
      }));
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(null);
    }
  };

  return (
    <div className="px-4 py-4 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              LearnFlix
            </h1>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 rounded-full"
            >
              <div className="w-2 h-2 bg-white rounded-full" />
              <span className="text-xs font-semibold text-white">LIVE</span>
            </motion.div>
          </div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {profile?.exam} — Learn from top educators, chapter by chapter
          </p>
        </motion.div>

        {/* Subject Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto"
        >
          <div className="flex gap-8 pb-4">
            {subjects.map((subject) => (
              <motion.button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`text-lg font-semibold pb-3 whitespace-nowrap transition-colors ${
                  selectedSubject === subject
                    ? 'text-slate-900 dark:text-white border-b-2 border-amber-500'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <span className="mr-2">{subjectEmojis[subject] || '📚'}</span>
                {subject}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading State for Chapters */}
        {loadingChapters ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-16 bg-white dark:bg-slate-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : chaptersError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <span className="text-red-900 dark:text-red-200 font-medium">
              Failed to load chapters. Please try again.
            </span>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </motion.div>
        ) : chapters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              No chapters available for {selectedSubject} yet.
            </p>
          </motion.div>
        ) : (
          /* Chapters Accordion List */
          <motion.div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {chapters.map((chapter, idx) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  {/* Chapter Header */}
                  <button
                    onClick={() => handleExpandChapter(chapter)}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4 text-left flex-1">
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-400 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                          {chapter.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {chapterVideos[chapter.id]
                            ? `${chapterVideos[chapter.id].length} videos ready`
                            : 'Loading...'}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        rotate: expandedChapter === chapter.id ? 180 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </motion.div>
                  </button>

                  {/* Expanded Videos Grid */}
                  <AnimatePresence>
                    {expandedChapter === chapter.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-b-lg border border-t-0 border-slate-200 dark:border-slate-700">
                          {loadingVideos === chapter.id ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                          ) : chapterVideos[chapter.id]?.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-slate-600 dark:text-slate-400">
                                No videos found for this chapter.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {chapterVideos[chapter.id]?.map((video, videoIdx) => (
                                <motion.div
                                  key={video.videoId}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: videoIdx * 0.05 }}
                                  onClick={() => setPlayingVideo(video)}
                                  className="group cursor-pointer"
                                >
                                  <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-200 h-full flex flex-col hover:shadow-lg dark:hover:shadow-amber-500/20"
                                  >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                                      <img
                                        src={getYouTubeThumbnail(video.videoId)}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center"
                                      >
                                        <motion.div
                                          animate={{ scale: [1, 1.1, 1] }}
                                          transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                          }}
                                          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg"
                                        >
                                          <Play className="w-6 h-6 text-amber-600 ml-1" fill="currentColor" />
                                        </motion.div>
                                      </motion.div>
                                    </div>

                                    {/* Video Info */}
                                    <div className="p-3 flex-1 flex flex-col">
                                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1">
                                        {video.title}
                                      </h4>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex-1">
                                        {video.channelName}
                                      </p>
                                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="inline-block px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded">
                                          +10 XP
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">
                                          Watch now
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlayingVideo(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl font-bold text-white line-clamp-2 mb-1">
                    {playingVideo.title}
                  </h2>
                  <p className="text-sm text-slate-400">{playingVideo.channelName}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlayingVideo(null)}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>

              {/* Video Player */}
              <div className="bg-black relative overflow-hidden">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${playingVideo.videoId}?autoplay=1&rel=0`}
                    title={playingVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Press ESC or click outside to close</span>
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold rounded">
                    +10 XP
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
