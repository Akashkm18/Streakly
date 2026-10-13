import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';
import { Sprout } from 'lucide-react';

export interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLANT_TYPES = [
  { id: 'bonsai', label: 'Bonsai Tree', desc: 'Mindfulness & deep patience' },
  { id: 'sunflower', label: 'Sunflower', desc: 'Movement & radiant energy' },
  { id: 'oak', label: 'Ancient Oak', desc: 'Study, reading & intellect' },
  { id: 'succulent', label: 'Desert Succulent', desc: 'Hydration & silent resilience' },
  { id: 'fern', label: 'Forest Fern', desc: 'Cold discipline & invigorating flow' },
  { id: 'orchid', label: 'Rare Orchid', desc: 'Creative arts & soul craft' },
];

const CATEGORIES = [
  { id: 'mind', label: 'Mind' },
  { id: 'body', label: 'Body' },
  { id: 'craft', label: 'Craft' },
  { id: 'soul', label: 'Soul' },
];

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('mind');
  const [plantType, setPlantType] = useState('bonsai');
  const [targetValue, setTargetValue] = useState('15');
  const [targetUnit, setTargetUnit] = useState('minutes');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsLoading(true);
      await apiClient('/habits', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          plantType,
          targetValue: Number(targetValue) || 1,
          targetUnit: targetUnit.trim() || 'times',
        }),
      });

      addToast({
        type: 'success',
        title: '🌱 Seed Planted!',
        message: `Your new habit "${title}" is now taking root in the sanctuary.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Planting Failed',
        message: err.message || 'Could not plant new habit',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plant a New Habit Seed">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-emerald-200 mb-1">Habit Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Morning Breathwork & Meditation"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-200 mb-1">Intention (Description)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Grounding the nervous system before screen time"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Target Numeric Value</label>
            <Input
              type="number"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-200 mb-1">Unit of Measure</label>
            <Input
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              placeholder="e.g., minutes, pages, glasses"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-200 mb-1.5">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  category === c.id
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400 hover:border-emerald-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-200 mb-1.5">Flora Species</label>
          <div className="grid grid-cols-2 gap-2">
            {PLANT_TYPES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlantType(p.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  plantType === p.id
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100'
                    : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300 hover:border-emerald-700'
                }`}
              >
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-[10px] text-emerald-400/70">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            <Sprout className="w-4 h-4 mr-1.5" />
            {isLoading ? 'Planting...' : 'Plant Seed in Garden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
