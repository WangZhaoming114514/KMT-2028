import { useState } from 'react';
import { RotateCcw, BookOpen, Newspaper } from 'lucide-react';
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

  const isVictory = ending.category === 'VICTORY' || ending.id === 15 || ending.id === 16;

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[1360px] border border-[#2C3A52] bg-[#0D131F]">
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
            <span className="text-xs text-slate-300">
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

        {/* Main 2-Column Content: Left Narrative & Stats, Right Final Geopolitical Map */}
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
                  <div className="text-xs font-bold text-slate-300">全台最終模擬得票率</div>
                  <div className="mt-3 flex h-3 w-full overflow-hidden bg-[#1E293B]">
                    <div className="bg-blue-600" style={{ width: `${nationalShares.kmt}%` }} />
                    <div className="bg-emerald-600" style={{ width: `${nationalShares.dpp}%` }} />
                    <div className="bg-cyan-500" style={{ width: `${nationalShares.tpp}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono-bbs text-xs">
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
                  <div className="mt-3 grid grid-cols-3 gap-2 font-mono-bbs text-xs">
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
                      <div className="text-slate-500">中共壓力</div>
                      <div className="mt-0.5 text-sm font-bold text-rose-400">
                        {stats.ccpTension}%
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

              {/* PTT Reactions */}
              <div className="mt-5 border border-[#243044] bg-[#080B10] p-4 font-mono-bbs text-xs">
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
