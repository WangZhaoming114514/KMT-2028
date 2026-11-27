import { useEffect } from 'react';
import { Volume2, VolumeX, BookOpen, Play } from 'lucide-react';
import { FACTION_LEADERS } from '../data/factions';
import { FactionId } from '../types/game';
import { PortraitAvatar } from './PortraitAvatar';

interface TitleScreenProps {
  selectedFaction: FactionId;
  onSelectFaction: (id: FactionId) => void;
  onStartGame: () => void;
  onStartWarMode: () => void;
  onStartNeaWarMode: () => void;
  onOpenGallery: () => void;
  unlockedCount: number;
  muted: boolean;
  onToggleMute: () => void;
}

export function TitleScreen({
  selectedFaction,
  onSelectFaction,
  onStartGame,
  onStartWarMode,
  onStartNeaWarMode,
  onOpenGallery,
  unlockedCount,
  muted,
  onToggleMute,
}: TitleScreenProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag !== 'BUTTON') {
          e.preventDefault();
          onStartGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const activeLeader =
    FACTION_LEADERS.find((f) => f.id === selectedFaction) ?? FACTION_LEADERS[0];

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 flex flex-col justify-between">
      <header className="flex items-center justify-between gap-8 border-b border-[#1E293B] px-6 py-3 bg-[#0C111B]">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0" aria-hidden="true">
            <rect width="28" height="28" fill="#1D4ED8" />
            <circle cx="14" cy="14" r="6" fill="#FFFFFF" />
            <circle cx="14" cy="14" r="3.2" fill="#1D4ED8" />
          </svg>
          <span className="font-mono-bbs text-sm font-bold tracking-wider text-white">
            KUOMINTANG 2028
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenGallery}
            className="flex items-center gap-2 border border-[#2C3A52] bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-blue-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>結局圖鑑 ({unlockedCount}/40)</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? '開啟音效' : '靜音'}
            className="flex items-center gap-1.5 border border-[#2C3A52] bg-[#111827] px-3 py-2 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span>{muted ? '靜音' : '音效開'}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1360px] px-5 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left Briefing Panel */}
          <div className="lg:col-span-4 flex flex-col justify-between border border-[#243044] bg-[#0D131F] p-5">
            <div>
              <div className="flex items-center gap-2 font-mono-bbs text-xs text-amber-400">
                <span>PTT // 政黑惡搞戰情室</span>
                <span className="text-slate-600">·</span>
                <span>24 回合 (2027.01–12)</span>
              </div>

              <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white leading-tight [text-wrap:balance] sm:text-4xl">
                KUOMINTANG 2028
              </h1>
              <p className="mt-1.5 text-sm font-bold text-blue-400">
                三民主義萬歲！重返重慶南路一段122號
              </p>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                本作為「2028 台灣總統大選模擬器」！從 9 位真實國民黨派系強權中擇一披掛上陣，經歷二十四回合脆與 PTT 選戰攻防。主線決定 <strong>15 個大結局</strong>，沿途觸發釣魚島、國光反攻、香港再光、圖瓦共和國／漠北與清代外東北戰線或政治迷因則額外解鎖 <strong>25 個子結局</strong>，共計 40 種歷史結局！
              </p>

              <div className="mt-4 border-t border-[#243044] pt-3 text-xs text-slate-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>選戰規模</span>
                  <span className="font-mono-bbs text-slate-200">9 派系專屬事件 · 24 回合</span>
                </div>
                <div className="flex justify-between">
                  <span>即時地圖</span>
                  <span className="font-mono-bbs text-slate-200">22縣市 + 中港 + 釣魚台 + 菲韓越日</span>
                </div>
                <div className="flex justify-between">
                  <span>隨機亂選勝率</span>
                  <span className="font-mono-bbs text-amber-300">精準調校 ~50% 五五開</span>
                </div>
              </div>
            </div>

            {/* Selected Candidate Spotlight */}
            <div className="mt-5 border-t border-[#243044] pt-4">
              <div className="flex items-start gap-3 border border-[#243044] bg-[#090D16] p-3">
                <PortraitAvatar portraitKey={activeLeader.portraitKey} sizeClass="w-16 h-16" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-white">
                    {activeLeader.name}
                    <span className="ml-2 text-xs font-medium text-blue-400">
                      {activeLeader.factionName}
                    </span>
                  </div>
                  <p className="mt-1 text-xs italic text-slate-200 leading-snug">
                    {activeLeader.tagline}
                  </p>
                  <p className="mt-1.5 text-[11px] text-amber-300 font-medium">
                    {activeLeader.perkLabel}
                  </p>
                </div>
              </div>

              <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{activeLeader.bio}</p>

              <button
                type="button"
                onClick={onStartGame}
                className="mt-4 flex w-full items-center justify-center gap-2 bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-500 active:translate-y-px transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>以 {activeLeader.name} 出戰（24 回合）</span>
              </button>

              <button
                type="button"
                onClick={onStartWarMode}
                className="mt-2.5 flex w-full items-center justify-center gap-2 border border-red-700/80 bg-[#1B1016] px-4 py-2 text-xs font-bold text-red-300 hover:border-red-500 hover:text-white transition-colors cursor-pointer"
              >
                <span>⚡ 特別戰役 1：台海防衛＆國光反攻大陸（還都南京）</span>
              </button>

              <button
                type="button"
                onClick={onStartNeaWarMode}
                className="mt-2 flex w-full items-center justify-center gap-2 border border-cyan-700/80 bg-[#0D1A2B] px-4 py-2 text-xs font-bold text-cyan-300 hover:border-cyan-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>🧭 特別戰役 2：蒙古＆清代外東北決戰（引爆第二次韓戰）</span>
              </button>
            </div>
          </div>

          {/* Right 9-Candidate Faction Selector Grid */}
          <div className="lg:col-span-8 border border-[#243044] bg-[#0D131F] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#243044] pb-2.5">
              <h2 className="text-base font-bold text-white">
                選擇九大真實國民黨派系候選人（不許虛構）
              </h2>
              <span className="font-mono-bbs text-xs text-slate-400">
                Wikimedia Commons 開源肖像
              </span>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {FACTION_LEADERS.map((leader) => {
                const isSelected = leader.id === selectedFaction;
                return (
                  <button
                    key={leader.id}
                    type="button"
                    onClick={() => onSelectFaction(leader.id)}
                    className={`flex flex-col text-left border p-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-[#132038]'
                        : 'border-[#243044] bg-[#101622] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <PortraitAvatar portraitKey={leader.portraitKey} sizeClass="w-12 h-12" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-bold text-white truncate">
                            {leader.name}
                          </span>
                          {isSelected && (
                            <span className="font-mono-bbs text-[10px] font-bold text-amber-300 shrink-0">
                              已選
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-blue-300 font-medium truncate">
                          {leader.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                          主場：{leader.homeCounty}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-[#1E293B] pt-2 font-mono-bbs text-[10px] text-slate-400">
                      <span>團結 {leader.startingStats.unity}</span>
                      <span>聲量 {leader.startingStats.momentum}</span>
                      <span>糧草 {leader.startingStats.funds}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1E293B] px-6 py-2.5 text-center font-mono-bbs text-xs text-slate-500">
        9 大真實派系 · 24 回合攻防 · 隨機亂選約五五開 · 全程純本地腳本不調用 API
      </footer>
    </div>
  );
}
