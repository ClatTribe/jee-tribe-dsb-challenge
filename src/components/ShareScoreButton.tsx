import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Copy, MessageCircle, Check, X, Image } from 'lucide-react';

interface ShareScoreButtonProps {
  generateImage: () => Promise<Blob>;
  className?: string;
}

export default function ShareScoreButton({ generateImage, className = '' }: ShareScoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const getImage = async (): Promise<Blob> => {
    if (imageBlob) return imageBlob;
    setIsLoading(true);
    try {
      const blob = await generateImage();
      setImageBlob(blob);
      return blob;
    } finally {
      setIsLoading(false);
    }
  };

  const handleMainClick = async () => {
    // Try native share first on mobile
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try {
        const blob = await getImage();
        const file = new File([blob], 'preptribe-score.png', { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: 'My PrepTribe Score',
            text: '🔥 Check out my score on PrepTribe!\n\nJoin the daily challenge: https://jeetribechallenge.getedunext.com',
            files: [file],
          });
          return;
        }
      } catch {
        // Fall through to dropdown
      }
    }
    setIsOpen(!isOpen);
  };

  const handleDownload = async () => {
    const blob = await getImage();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `preptribe-score-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const handleCopy = async () => {
    try {
      const blob = await getImage();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: download instead
      handleDownload();
    }
    setIsOpen(false);
  };

  const handleWhatsApp = async () => {
    const blob = await getImage();
    const file = new File([blob], 'preptribe-score.png', { type: 'image/png' });
    const shareText = '🔥 Check out my score on PrepTribe!\n\nJoin the daily challenge: https://jeetribechallenge.getedunext.com';

    // Mobile: use native share API — sends image + text directly to WhatsApp
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          text: shareText,
          files: [file],
        });
        setIsOpen(false);
        return;
      } catch {
        // User cancelled — fall through
      }
    }

    // Desktop: copy image to clipboard → open WhatsApp Web → user pastes with Ctrl+V
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      // Open WhatsApp Web with pre-filled text
      const waText = encodeURIComponent(shareText);
      window.open(`https://web.whatsapp.com/send?text=${waText}`, '_blank');
      setToast('📋 Score card copied! Select a chat in WhatsApp, then press Ctrl+V to paste the image.');
    } catch {
      // Clipboard failed — download image instead
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preptribe-score-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      const waText = encodeURIComponent(shareText);
      window.open(`https://web.whatsapp.com/send?text=${waText}`, '_blank');
      setToast('📥 Score card downloaded! Open it in WhatsApp and attach the image.');
    }

    setIsOpen(false);
  };

  const handleNativeShare = async () => {
    try {
      const blob = await getImage();
      const file = new File([blob], 'preptribe-score.png', { type: 'image/png' });
      await navigator.share({
        title: 'My PrepTribe Score',
        text: '🔥 Check out my score on PrepTribe!\n\nJoin the daily challenge: https://jeetribechallenge.getedunext.com',
        files: [file],
      });
    } catch {
      // User cancelled or unsupported
    }
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] max-w-md w-[90vw] bg-slate-800 border border-amber-500/30 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-black/40 flex items-start gap-3"
          >
            <Image size={20} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">{toast}</p>
            <button onClick={() => setToast(null)} className="ml-auto shrink-0 text-white/40 hover:text-white/80">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleMainClick}
        disabled={isLoading}
        className="w-full py-4 md:py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-base md:text-lg flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Share2 size={20} />
        )}
        Share Score
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/80 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-2">
              <button
                onClick={handleWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <MessageCircle size={20} className="text-green-500" />
                <div>
                  <span className="font-medium">Share on WhatsApp</span>
                  <span className="block text-xs text-white/40 mt-0.5">Image + link sent together</span>
                </div>
              </button>

              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                <Download size={20} className="text-amber-400" />
                <span className="font-medium">Download Image</span>
              </button>

              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors text-left"
              >
                {copied ? (
                  <Check size={20} className="text-green-400" />
                ) : (
                  <Copy size={20} className="text-blue-400" />
                )}
                <span className="font-medium">{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              {typeof navigator !== 'undefined' && navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 rounded-xl transition-colors text-left"
                >
                  <Share2 size={20} className="text-purple-400" />
                  <span className="font-medium">More Options...</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
