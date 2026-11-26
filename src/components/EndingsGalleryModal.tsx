import { useState } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { ENDINGS } from '../data/endings';
import { EndingCategory } from '../types/game';

interface EndingsGalleryModalProps {
  unlockedMap: Record<number, string>;
  onClose: () => void;
}

type FilterTab = 'ALL' | EndingCategory;

const CATEGORY_LABELS: Record<FilterTab, string> = {
  ALL: '全部結局 (30)',
  VICTORY: '勝選執政 (8)',
  DEFEAT: '敗選檢討 (6)',
  GEOPOLITICAL: '地緣危機 (6)',
  MEME_SECRET: '隱藏政治梗 (10)',
};

export function EndingsGalleryModal({ unlockedMap, onClose }: EndingsGalleryModalProps) {
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [selectedId, setSelectedId] = useState<number>(1);

  const filtered =
    filter === 'ALL' ? ENDINGS : ENDINGS.filter((e) => e.category === filter);

  const unlockedCount = Object.keys(unlockedMap).length;
  const activeEnding = ENDINGS.find((e) => e.id === selectedId) ?? ENDINGS[0];
  const isUnlocked = Boolean(unlockedMap[activeEnding.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="30 結局圖鑑"
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col border border-[#2C3A52] bg-[#0D131F] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#243044] bg-[#111827] px-5 py-3.5">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-bold text-white">KUOMINTANG 2028 歷史結局圖鑑</h2>
            <span className="font-mono-bbs text-xs text-amber-300">
              已解鎖 {unlockedCount} / 30
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉結局圖鑑"
            className="flex items-center gap-1.5 border border-[#2C3A52] bg-[#0D131F] px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span>關閉</span>
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#243044] bg-[#0A0F18] px-5 py-2.5">
          {(Object.keys(CATEGORY_LABELS) as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111827] text-slate-400 hover:text-slate-100 border border-[#243044]'
              }`}
            >
              {CATEGORY_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Body Split */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
          {/* List */}
          <div className="bbs-scroll overflow-y-auto border-b border-[#243044] p-4 lg:col-span-6 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-1 gap-2">
              {filtered.map((ending) => {
                const done = Boolean(unlockedMap[ending.id]);
                const active = ending.id === selectedId;
                return (
                  <button
                    key={ending.id}
                    type="button"
                    onClick={() => setSelectedId(ending.id)}
                    className={`flex items-center justify-between gap-3 border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-blue-500 bg-[#132038]'
                        : 'border-[#243044] bg-[#101622] hover:border-slate-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono-bbs text-[11px] text-slate-400">
                        <span>{ending.code}</span>
                        <span>·</span>
                        <span
                          className={
                            ending.rarity === '隱藏政治梗'
                              ? 'text-amber-300'
                              : ending.rarity === '罕見'
                                ? 'text-cyan-300'
                                : 'text-slate-400'
                          }
                        >
                          {ending.rarity}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-sm font-bold text-white">
                        {done ? ending.title : '？？？ 尚未解鎖結局'}
                      </div>
                    </div>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Inspector */}
          <div className="bbs-scroll overflow-y-auto p-6 lg:col-span-6 bg-[#0B101A]">
            <div className="flex items-center gap-2 font-mono-bbs text-xs text-slate-400">
              <span>{activeEnding.code}</span>
              <span>·</span>
              <span>{activeEnding.rarity}</span>
            </div>

            {isUnlocked ? (
              <div className="mt-2">
                <h3 className="text-xl font-black text-white">{activeEnding.title}</h3>
                <p className="mt-1 text-sm text-blue-400 font-medium">{activeEnding.subtitle}</p>

                <div className="mt-4 border border-[#243044] bg-[#111827] p-4">
                  <div className="font-mono-bbs text-xs text-amber-300">頭版快報</div>
                  <p className="mt-1 text-sm font-bold text-white">
                    {activeEnding.newspaperHeadline}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-200">
                  {activeEnding.epilogue}
                </p>

                <div className="mt-5 border-t border-[#243044] pt-4">
                  <div className="font-mono-bbs text-xs text-slate-400">
                    {activeEnding.bbsTitle}
                  </div>
                  <div className="mt-2 space-y-1.5 font-mono-bbs text-xs">
                    {activeEnding.bbsComments.map((c, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span
                          className={
                            c.type === '推'
                              ? 'text-amber-300 font-bold'
                              : c.type === '噓'
                                ? 'text-rose-400 font-bold'
                                : 'text-slate-400'
                          }
                        >
                          {c.type}
                        </span>
                        <span className="text-cyan-300">{c.user}:</span>
                        <span className="text-slate-200">{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 border border-[#243044] bg-[#101622] p-6">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                  <Lock className="h-4 w-4" />
                  <span>此結局尚未解鎖</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  <span className="text-amber-300 font-semibold">解鎖線索：</span>
                  {activeEnding.unlockHint}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
