import React, { useRef, useEffect, useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { apiClient } from '@/shared/api/client';
import { Habit } from '@/entities/habit/model/types';
import { Download, Share2, Copy, Check } from 'lucide-react';

export interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  userName?: string;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  habit,
  userName = 'Ember Track',
}) => {
  const { success, error } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      renderCardCanvas();
      generateShareSlug();
    }
  }, [isOpen, habit]);

  const generateShareSlug = async () => {
    setIsGenerating(true);
    try {
      const res = await apiClient<{ slug: string }>('/share', {
        method: 'POST',
        body: JSON.stringify({
          habitId: habit.id,
          title: habit.name,
          streakCount: habit.stats.currentStreak,
          momentumScore: habit.stats.momentumScore,
          flameLevel: habit.stats.flameLevel,
        }),
      });
      setShareSlug(res.slug);
    } catch (err: any) {
      console.warn('Share slug generation error:', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCardCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (1200x630 ideal social share / landscape card)
    canvas.width = 1200;
    canvas.height = 630;

    // Background Gradient (Charcoal to Obsidian)
    const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGradient.addColorStop(0, '#0b0f19');
    bgGradient.addColorStop(0.5, '#111827');
    bgGradient.addColorStop(1, '#05070c');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle Flame Glow Circle
    const glowGradient = ctx.createRadialGradient(900, 200, 50, 900, 200, 450);
    glowGradient.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
    glowGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(900, 200, 450, 0, Math.PI * 2);
    ctx.fill();

    // Border Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 570);

    // Top Brand Badge: "EMBER // STREAK TRACKER"
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillText('🔥 EMBER // PRO STREAK TRACKER', 80, 100);

    // Habit Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Space Grotesk", sans-serif';
    ctx.fillText(habit.name, 80, 190);

    // User Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px "Inter", sans-serif';
    ctx.fillText(`Tracked by ${userName}`, 80, 240);

    // Streak Count Box
    ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 310, 360, 180, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 72px "Space Grotesk", sans-serif';
    ctx.fillText(`${habit.stats.currentStreak} DAYS`, 120, 400);

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillText('CURRENT STREAK', 120, 445);

    // Momentum Score Box
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.roundRect(480, 310, 360, 180, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 72px "Space Grotesk", sans-serif';
    ctx.fillText(`${habit.stats.momentumScore}%`, 520, 400);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 20px "Inter", sans-serif';
    ctx.fillText('MOMENTUM SCORE', 520, 445);

    // Quote Footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 22px "Inter", sans-serif';
    ctx.fillText('"Consistency is the spark that fuels transformation."', 80, 550);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ember-streak-${habit.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
    success('Card Downloaded!', 'Your Ember streak PNG has been saved.');
  };

  const handleCopyLink = () => {
    if (!shareSlug) return;
    const url = `${window.location.origin}/share/${shareSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    success('Link Copied!', 'Public share link copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Streak Share Card"
      description="Download your official streak showcase card or copy the public URL."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        {/* Canvas Display */}
        <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
          <canvas ref={canvasRef} className="w-full h-auto aspect-[1200/630]" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="w-full sm:w-auto">
            {shareSlug && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="w-full sm:w-auto gap-2 text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Copy Public Share URL'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              variant="glow"
              onClick={handleDownload}
              className="gap-2 bg-gradient-to-r from-ember-500 to-amber-500 text-white font-semibold"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
