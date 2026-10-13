import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';
import { HabitIcon } from '@/shared/ui/HabitIcon';
import { formatSchedule } from '@/shared/utils/scheduleFormatter';
import {
  Compass,
  Search,
  Plus,
  Check,
  Calendar,
  Sparkles,
  Filter,
  X,
  Target,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

interface HobbyTemplate {
  id: string;
  categoryId: string;
  name: string;
  title?: string;
  description: string;
  icon: string;
  color: string;
  defaultUnit: string;
  unit?: string;
  suggestedGoal: number;
  defaultTarget?: number;
  scheduleType: string;
  defaultDays?: string | null;
  scheduleDays?: string | null;
  defaultTimesPerWeek?: number | null;
  timesPerWeek?: number | null;
  category?: Category;
}

interface UserHabit {
  id: string;
  title: string;
  isArchived: boolean;
}

export const LibraryPage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adoptingId, setAdoptingId] = useState<string | null>(null);

  // Custom Hobby Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('mins');
  const [customTarget, setCustomTarget] = useState(30);
  const [customSchedule, setCustomSchedule] = useState('EVERY_DAY');
  const [customIcon, setCustomIcon] = useState('Sparkles');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // 1. Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('/categories'),
  });

  // 2. Fetch Templates from real API
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    isError: isErrorTemplates,
    refetch: refetchTemplates,
  } = useQuery<HobbyTemplate[]>({
    queryKey: ['hobby-templates', selectedCategory, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      const qs = params.toString();
      return apiClient<HobbyTemplate[]>(`/hobbies/templates${qs ? `?${qs}` : ''}`);
    },
  });

  // 3. Fetch User's Active Habits for Duplicate Detection
  const { data: userHabits = [] } = useQuery<UserHabit[]>({
    queryKey: ['habits'],
    queryFn: () => apiClient<UserHabit[]>('/habits'),
  });

  // Set of lowercase active titles
  const activeHabitTitles = new Set(
    userHabits
      .filter((h) => !h.isArchived)
      .map((h) => (h.title || '').trim().toLowerCase())
  );

  const handleAdopt = async (template: HobbyTemplate) => {
    const templateName = template.name || template.title || 'Hobby';
    try {
      setAdoptingId(template.id);
      await apiClient(`/hobbies/templates/${template.id}/adopt`, {
        method: 'POST',
      });

      // Invalidate TanStack Query habits cache immediately so Dashboard updates
      await queryClient.invalidateQueries({ queryKey: ['habits'] });

      addToast({
        type: 'success',
        title: 'Hobby Added!',
        message: `"${templateName}" has been added to your Dashboard.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Adoption Error',
        message: err.message || 'Could not add hobby to your list.',
      });
    } finally {
      setAdoptingId(null);
    }
  };

  const handleCreateCustomHobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    try {
      setIsCreatingCustom(true);
      await apiClient('/habits', {
        method: 'POST',
        body: JSON.stringify({
          title: customTitle.trim(),
          categoryId: customCategory || (categories[0]?.id ?? undefined),
          unit: customUnit.trim() || 'reps',
          targetAmount: Number(customTarget) || 1,
          scheduleType: customSchedule,
          scheduleDays: customSchedule === 'SPECIFIC_DAYS' ? ['MON', 'WED', 'FRI'] : undefined,
          timesPerWeek: customSchedule === 'TIMES_PER_WEEK' ? 3 : undefined,
          icon: customIcon || 'Sparkles',
          color: '#4F46E5',
        }),
      });

      // Invalidate TanStack Query cache so it appears immediately
      await queryClient.invalidateQueries({ queryKey: ['habits'] });

      addToast({
        type: 'success',
        title: 'Custom Hobby Created!',
        message: `"${customTitle}" is now live on your dashboard.`,
      });

      setIsCustomModalOpen(false);
      setCustomTitle('');
      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create custom hobby',
      });
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Curated Hobby Library
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              {templates.length}+ Templates
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pick and adopt curated habits across 8 life categories in 1-click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search running, guitar, code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              if (categories.length > 0 && !customCategory) {
                setCustomCategory(categories[0].id);
              }
              setIsCustomModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Hobby</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => {
          const isSelected = selectedCategory === c.name || selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <HabitIcon name={c.icon} className="w-3.5 h-3.5" />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton State */}
      {isLoadingTemplates && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="w-16 h-5 rounded-full bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="w-3/4 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="w-full h-9 bg-slate-100 dark:bg-slate-800 rounded-lg pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry Button */}
      {isErrorTemplates && !isLoadingTemplates && (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Failed to load hobby templates from the server.
          </p>
          <button
            onClick={() => refetchTemplates()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingTemplates && !isErrorTemplates && templates.length === 0 && (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Compass className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No hobby templates matched your query.
          </p>
          <p className="text-xs text-slate-400">
            Try adjusting your search terms or clearing the category filter.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {!isLoadingTemplates && !isErrorTemplates && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const templateTitle = template.name || template.title || '';
            const unit = template.defaultUnit || template.unit || 'mins';
            const target = template.suggestedGoal || template.defaultTarget || 1;
            const isAlreadyAdded = activeHabitTitles.has(templateTitle.trim().toLowerCase());
            const isAdopting = adoptingId === template.id;

            return (
              <div
                key={template.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {/* Fixed size icon container to prevent text overlap */}
                    <div
                      className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold"
                      style={{ backgroundColor: `${template.color}15`, color: template.color }}
                    >
                      <HabitIcon name={template.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {template.category?.name}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {templateTitle}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Target:{' '}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {target} {unit}
                      </strong>
                    </span>
                    <span className="text-[11px] font-medium bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {formatSchedule(template)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <button
                    onClick={() => handleAdopt(template)}
                    disabled={isAlreadyAdded || isAdopting}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isAlreadyAdded
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 cursor-default'
                        : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs'
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : isAdopting ? (
                      <span>Adding...</span>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Custom Hobby Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Custom Hobby</h3>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomHobby} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hobby Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Speedcubing, Watercolor, Italian"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="mins, pages, km"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Schedule Type
                </label>
                <select
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="EVERY_DAY">Every Day (Daily)</option>
                  <option value="SPECIFIC_DAYS">Specific Weekdays (Mon, Wed, Fri)</option>
                  <option value="TIMES_PER_WEEK">Times per Week (3x / week)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCustom}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isCreatingCustom ? 'Creating...' : 'Create Hobby'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
