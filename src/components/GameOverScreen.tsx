import { useState } from 'react';
import {
  RotateCcw,
  BookOpen,
  Newspaper,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  BadgeCheck,
} from 'lucide-react';
import {
  CampaignStats,
  CountyState,
  EndingDefinition,
  FactionLeader,
  MapMode,
  VoteShares,
} from '../types/game';
import { PortraitAvatar } from './PortraitAvatar';
import { TaiwanGeopoliticalMap } from './TaiwanGeopoliticalMap';

interface GameOverScreenProps {
  ending: EndingDefinition;
  faction: FactionLeader;
  counties: CountyState[];
  flags: string[];
  nationalShares: VoteShares;
  stats: CampaignStats;
  unlockedCount: number;
  warOccupiedCounties?: string[];
  onPlayAgain: () => void;
  onOpenGallery: () => void;
  onReturnTitle: () => void;
}

export function GameOverScreen({
  ending,
  faction,
  counties,
  flags,
  nationalShares,
  stats,
  unlockedCount,
  warOccupiedCounties,
  onPlayAgain,
  onOpenGallery,
  onReturnTitle,
}: GameOverScreenProps) {
  const [selectedCountyId, setSelectedCountyId] = useState<string>(faction.homeCounty);
  const [mapMode, setMapMode] = useState<MapMode>('REGIONAL');

  const isVictory =
    ending.category === 'VICTORY' || ending.id === 15 || ending.id === 16 || ending.id === 18;
  const tempDistricts = counties.filter((c) => c.isTemporary);

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[1380px] border border-[#2C3A52] bg-[#0D131F]">
        {/* Top Banner */}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 border-b border-[#243044] px-6 py-4 ${
            isVictory ? 'bg-[#102347]' : 'bg-[#1C1219]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono-bbs text-xs font-bold text-amber-300">
              {ending.code} · {ending.rarity}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-slate-300 tabular-nums">
              結局圖鑑已收集 {unlockedCount} / 30
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenGallery}
            className="flex items-center gap-1.5 border border-[#334155] bg-[#0D131F] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-blue-400 hover:text-white cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>查看 30 結局圖鑑</span>
          </button>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <PortraitAvatar portraitKey={faction.portraitKey} sizeClass="w-20 h-20" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-400">
                    {faction.name}（{faction.factionName}）最終結算
                  </div>
                  <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl [text-wrap:balance]">
                    {ending.title}
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-blue-400">{ending.subtitle}</p>
                </div>
              </div>

              {/* Newspaper Front Page Box */}
              <div className="mt-5 border border-[#2C3A52] bg-[#111827] p-5">
                <div className="flex items-center gap-2 font-mono-bbs text-xs text-amber-300">
                  <Newspaper className="h-4 w-4" />
                  <span>2028 大選號外頭條</span>
                </div>
                <h2 className="mt-2 text-lg font-black text-white leading-snug">
                  {ending.newspaperHeadline}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">{ending.epilogue}</p>
              </div>

              {/* Final National Vote Tally & Metrics */}
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="border border-[#243044] bg-[#0B101A] p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>全台最終模擬得票率</span>
                    <span className="font-mono-bbs text-[11px] text-slate-400">
                      共 {counties.length} 選區
                    </span>
                  </div>
                  <div className="mt-3 flex h-3 w-full overflow-hidden bg-[#1E293B]">
                    <div className="bg-blue-600" style={{ width: `${nationalShares.kmt}%` }} />
                    <div className="bg-emerald-600" style={{ width: `${nationalShares.dpp}%` }} />
                    <div className="bg-cyan-500" style={{ width: `${nationalShares.tpp}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono-bbs text-xs tabular-nums">
                    <span className="text-blue-400 font-bold">
                      國民黨 {nationalShares.kmt.toFixed(2)}%
                    </span>
                    <span className="text-emerald-400 font-bold">
                      民進黨 {nationalShares.dpp.toFixed(2)}%
                    </span>
                    <span className="text-cyan-400 font-bold">
                      民眾黨 {nationalShares.tpp.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="border border-[#243044] bg-[#0B101A] p-4">
                  <div className="text-xs font-bold text-slate-300">終局政局與地緣指標</div>
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono-bbs text-xs tabular-nums">
                    <div>
                      <div className="text-slate-500">黨內團結</div>
                      <div className="mt-0.5 text-sm font-bold text-white">{stats.unity}%</div>
                    </div>
                    <div>
                      <div className="text-slate-500">脆/PTT聲量</div>
                      <div className="mt-0.5 text-sm font-bold text-amber-300">
                        {stats.momentum}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">競選糧草</div>
                      <div className="mt-0.5 text-sm font-bold text-emerald-300">
                        {stats.funds}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">
                        {ending.id === 15 || flags.includes('guoguang_victory')
                          ? '大陸政局'
                          : ending.id === 16 || ending.id === 18
                            ? '台海戰況'
                            : '中共壓力'}
                      </div>
                      <div
                        className={`mt-0.5 text-sm font-bold ${
                          ending.id === 15 || flags.includes('guoguang_victory')
                            ? 'text-blue-400'
                            : ending.id === 16 || ending.id === 18
                              ? 'text-cyan-300'
                              : 'text-rose-400'
                        }`}
                      >
                        {ending.id === 15 || flags.includes('guoguang_victory')
                          ? '已統一(0%)'
                          : ending.id === 16 || ending.id === 18
                            ? '0% 共軍全滅'
                            : `${stats.ccpTension}%`}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">美日態度</div>
                      <div className="mt-0.5 text-sm font-bold text-cyan-300">
                        {stats.japanPosture}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Temporary Constitutional Electoral Districts Breakdown */}
              {tempDistricts.length > 0 && (
                <div className="mt-4 border border-blue-700/70 bg-[#0D1A33] p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                    <span>★ 增設「行憲臨時選區」開票戰報（點擊切換右側地圖檢視）</span>
                    <span className="font-mono-bbs text-amber-300">{tempDistricts.length} 區翻藍</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {tempDistricts.map((td) => (
                      <button
                        key={td.id}
                        type="button"
                        onClick={() => setSelectedCountyId(td.id)}
                        className={`flex items-center justify-between border px-2.5 py-1.5 text-left font-mono-bbs text-xs cursor-pointer ${
                          selectedCountyId === td.id
                            ? 'border-amber-400 bg-[#172C54]'
                            : 'border-blue-800/80 bg-[#0A1326] hover:border-blue-400'
                        }`}
                      >
                        <span className="font-sans text-slate-100 truncate">{td.id}</span>
                        <span className="ml-1 font-bold text-blue-300 tabular-nums">
                          {td.current.kmt.toFixed(1)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authentic Threads (脆) + PTT Dual Reaction Card */}
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* Threads (脆) Post Mimic */}
                <div className="rounded-xl border border-[#262626] bg-[#101010] p-4 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E1E1E] text-[11px] text-[#777777]">
                    <span className="font-bold text-white tracking-tight">@ Threads 脆熱門串文</span>
                    <span>剛剛 · 全網轉爆</span>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <div className="flex flex-col items-center">
                      <PortraitAvatar
                        portraitKey={faction.portraitKey}
                        sizeClass="w-9 h-9 rounded-full"
                      />
                      <div className="mt-1.5 w-0.5 flex-1 bg-[#2E3033]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="font-bold text-[#F3F5F7]">{faction.name}</span>
                        <BadgeCheck className="h-3.5 w-3.5 text-[#0095F6]" />
                        <span className="text-[#777777]">@{faction.id}_kmt2028</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#F3F5F7]">
                        {ending.title}
                      </p>
                      <div className="mt-2.5 flex items-center gap-4 text-[11px] text-[#777777]">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> 12.4萬
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" /> 2.8萬
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Repeat2 className="h-3.5 w-3.5" /> 1.9萬
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Send className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                  {ending.bbsComments[0] && (
                    <div className="mt-2.5 flex gap-3 pl-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#242424] text-[10px] font-bold text-slate-300">
                        脆
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-semibold text-[#F3F5F7]">
                          @{ending.bbsComments[0].user}
                        </span>
                        <p className="mt-0.5 text-[#D4D4D4] leading-snug">
                          {ending.bbsComments[0].text}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Classic PTT Terminal Comments */}
                <div className="border border-[#243044] bg-[#080B10] p-4 font-mono-bbs text-xs">
                  <div className="text-slate-400">{ending.bbsTitle}</div>
                  <div className="mt-2.5 space-y-1.5">
                    {ending.bbsComments.map((c, idx) => (
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
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#243044] pt-5">
              <button
                type="button"
                onClick={onReturnTitle}
                className="border border-[#2C3A52] bg-[#101622] px-4 py-2.5 text-xs font-medium text-slate-300 hover:border-slate-400 hover:text-white cursor-pointer"
              >
                更換派系重開
              </button>
              <button
                type="button"
                onClick={onPlayAgain}
                className="flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>再戰一場（同派系）</span>
              </button>
            </div>
          </div>

          {/* Right: Final East Asia & Taiwan Geopolitical Outcome Map */}
          <div className="lg:col-span-5">
            <TaiwanGeopoliticalMap
              counties={counties}
              selectedCountyId={selectedCountyId}
              onSelectCounty={setSelectedCountyId}
              stats={stats}
              flags={flags}
              mapMode={mapMode}
              onChangeMapMode={setMapMode}
              endingId={ending.id}
              warOccupiedCounties={warOccupiedCounties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
