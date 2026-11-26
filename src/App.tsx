import { useCallback, useEffect, useMemo, useState } from 'react';
import { Volume2, VolumeX, BookOpen, RotateCcw, Radio, ShieldAlert } from 'lucide-react';
import { FACTION_LEADERS } from './data/factions';
import { CAMPAIGN_ROUNDS, getRoundEventForFaction } from './data/rounds';
import {
  ENDINGS,
  checkMidGameEnding,
  evaluateFinalEnding,
  loadUnlockedEndings,
  saveUnlockedEnding,
  shouldTriggerStraitWar,
} from './data/endings';
import {
  BbsLogEntry,
  CampaignStats,
  ChoiceOption,
  CountyState,
  EndingDefinition,
  FactionId,
  GamePhase,
  MapMode,
} from './types/game';
import {
  applyChoiceToCounties,
  clampStat,
  computeNationalShares,
  initCountiesForFaction,
} from './utils/simulation';
import { bbsAudio } from './utils/sound';
import { TitleScreen } from './components/TitleScreen';
import { TaiwanGeopoliticalMap } from './components/TaiwanGeopoliticalMap';
import { PortraitAvatar } from './components/PortraitAvatar';
import { EndingsGalleryModal } from './components/EndingsGalleryModal';
import { GameOverScreen } from './components/GameOverScreen';
import { StraitWarMiniGame } from './components/StraitWarMiniGame';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('TITLE_MENU');
  const [selectedFactionId, setSelectedFactionId] = useState<FactionId>('lu');
  const [roundIndex, setRoundIndex] = useState<number>(0); // 0..11
  const [counties, setCounties] = useState<CountyState[]>(() =>
    initCountiesForFaction(FACTION_LEADERS[0])
  );
  const [stats, setStats] = useState<CampaignStats>(FACTION_LEADERS[0].startingStats);
  const [flags, setFlags] = useState<string[]>([]);
  const [bbsLog, setBbsLog] = useState<BbsLogEntry[]>([]);
  const [lastOutcomeBanner, setLastOutcomeBanner] = useState<string | null>(null);
  const [selectedCountyId, setSelectedCountyId] = useState<string>('台北市');
  const [mapMode, setMapMode] = useState<MapMode>('REGIONAL');
  const [activeEnding, setActiveEnding] = useState<EndingDefinition | null>(null);
  const [unlockedMap, setUnlockedMap] = useState<Record<number, string>>(() =>
    loadUnlockedEndings()
  );
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [tallyRevealCount, setTallyRevealCount] = useState<number>(0);
  const [warAlreadyFought, setWarAlreadyFought] = useState<boolean>(false);
  const [warOccupiedCounties, setWarOccupiedCounties] = useState<string[] | undefined>(undefined);

  const activeFaction = useMemo(
    () => FACTION_LEADERS.find((f) => f.id === selectedFactionId) ?? FACTION_LEADERS[0],
    [selectedFactionId]
  );

  const nationalShares = useMemo(() => computeNationalShares(counties), [counties]);
  const currentRound = useMemo(
    () => getRoundEventForFaction(roundIndex, activeFaction.id),
    [roundIndex, activeFaction.id]
  );

  const availableChoices = useMemo(() => {
    return currentRound.choices.filter(
      (c) => !c.factionOnly || c.factionOnly === activeFaction.id
    );
  }, [currentRound, activeFaction.id]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      bbsAudio.setMuted(next);
      return next;
    });
  }, []);

  const startCampaign = useCallback(
    (factionIdToUse: FactionId = selectedFactionId) => {
      const leader =
        FACTION_LEADERS.find((f) => f.id === factionIdToUse) ?? FACTION_LEADERS[0];
      bbsAudio.playPushChime(true);
      setSelectedFactionId(leader.id);
      setRoundIndex(0);
      setCounties(initCountiesForFaction(leader));
      setStats({ ...leader.startingStats });
      setFlags([]);
      setSelectedCountyId(leader.homeCounty);
      setLastOutcomeBanner(null);
      setActiveEnding(null);
      setTallyRevealCount(0);
      setWarAlreadyFought(false);
      setWarOccupiedCounties(undefined);
      setBbsLog([
        {
          id: 'init-0',
          round: 1,
          dateLabel: '2027.01 上',
          type: '系統',
          author: 'SYSOP',
          text: `${leader.name}（${leader.factionName}）正式宣布投入 2028 國民黨總統提名與決戰！`,
        },
      ]);
      setPhase('PLAYING');
    },
    [selectedFactionId]
  );

  const startInstantWarMode = useCallback(() => {
    const leader = activeFaction;
    bbsAudio.playAlertSiren();
    setCounties(initCountiesForFaction(leader));
    setStats({ ...leader.startingStats, ccpTension: 88 });
    setFlags(['guoguang_restarted']);
    setWarAlreadyFought(true);
    setWarOccupiedCounties(undefined);
    setPhase('STRAIT_WAR');
  }, [activeFaction]);

  const finishWithEnding = useCallback((ending: EndingDefinition, useElectionAnimation: boolean) => {
    const updatedMap = saveUnlockedEnding(ending.id);
    setUnlockedMap(updatedMap);
    setActiveEnding(ending);
    if (useElectionAnimation) {
      setTallyRevealCount(0);
      setPhase('ELECTION_NIGHT');
    } else {
      bbsAudio.playAlertSiren();
      setPhase('GAME_OVER');
    }
  }, []);

  // Election night progressive tally animation
  useEffect(() => {
    if (phase !== 'ELECTION_NIGHT') return;
    if (tallyRevealCount >= counties.length) {
      const doneTimer = window.setTimeout(() => {
        if (activeEnding) {
          bbsAudio.playElectionFanfare(activeEnding.category === 'VICTORY');
        }
        setPhase('GAME_OVER');
      }, 650);
      return () => window.clearTimeout(doneTimer);
    }
    const stepTimer = window.setTimeout(() => {
      bbsAudio.playKeyClick();
      setTallyRevealCount((prev) => prev + 2);
    }, 95);
    return () => window.clearTimeout(stepTimer);
  }, [phase, tallyRevealCount, counties.length, activeEnding]);

  const handleSelectChoice = useCallback(
    (choice: ChoiceOption) => {
      const nextStats: CampaignStats = {
        unity: clampStat(stats.unity + (choice.statDelta.unity ?? 0)),
        momentum: clampStat(stats.momentum + (choice.statDelta.momentum ?? 0)),
        funds: clampStat(stats.funds + (choice.statDelta.funds ?? 0)),
        ccpTension: clampStat(stats.ccpTension + (choice.statDelta.ccpTension ?? 0)),
        japanPosture: clampStat(stats.japanPosture + (choice.statDelta.japanPosture ?? 0)),
      };

      const nextCounties = applyChoiceToCounties(counties, choice, activeFaction, nextStats);
      const nextNational = computeNationalShares(nextCounties);
      const nextFlags = choice.setFlags
        ? Array.from(new Set([...flags, ...choice.setFlags]))
        : flags;

      const positiveNet =
        nextNational.kmt >= nationalShares.kmt && nextStats.ccpTension < 75;
      if (nextStats.ccpTension >= 75) {
        bbsAudio.playAlertSiren();
      } else {
        bbsAudio.playPushChime(positiveNet);
      }

      const newLogs: BbsLogEntry[] = [
        {
          id: `r${currentRound.round}-sys`,
          round: currentRound.round,
          dateLabel: currentRound.dateLabel,
          type: '系統',
          author: activeFaction.name,
          text: `選擇【${choice.toneLabel}】${choice.label}`,
        },
        ...choice.pushReactions.map((r, i) => ({
          id: `r${currentRound.round}-rx-${i}`,
          round: currentRound.round,
          dateLabel: currentRound.dateLabel,
          type: r.type,
          author: r.author,
          text: r.text,
        })),
      ];

      setStats(nextStats);
      setCounties(nextCounties);
      setFlags(nextFlags);
      setBbsLog((prev) => [...newLogs, ...prev].slice(0, 60));
      setLastOutcomeBanner(`[${currentRound.dateLabel} 戰報] ${choice.mediaReaction}`);

      // Check if CCP invades Taiwan -> Launch Strait Defense & Project Guoguang Mini-Game!
      if (
        shouldTriggerStraitWar({
          round: currentRound.round,
          ccpTension: nextStats.ccpTension,
          flags: nextFlags,
          warAlreadyFought,
        })
      ) {
        bbsAudio.playAlertSiren();
        setWarAlreadyFought(true);
        setPhase('STRAIT_WAR');
        return;
      }

      // Check mid-game crisis/meme triggers
      const midEnding = checkMidGameEnding({
        factionId: activeFaction.id,
        round: currentRound.round,
        stats: nextStats,
        nationalShares: nextNational,
        counties: nextCounties,
        flags: nextFlags,
        midGameTrigger: true,
      });

      if (midEnding) {
        finishWithEnding(midEnding, false);
        return;
      }

      // Check if Round 12 just finished
      if (roundIndex >= CAMPAIGN_ROUNDS.length - 1) {
        const finalEnding = evaluateFinalEnding({
          factionId: activeFaction.id,
          round: currentRound.round,
          stats: nextStats,
          nationalShares: nextNational,
          counties: nextCounties,
          flags: nextFlags,
          midGameTrigger: false,
        });
        finishWithEnding(finalEnding, true);
        return;
      }

      setRoundIndex((prev) => prev + 1);
    },
    [
      stats,
      counties,
      activeFaction,
      flags,
      nationalShares.kmt,
      currentRound,
      roundIndex,
      warAlreadyFought,
      finishWithEnding,
    ]
  );

  // Keyboard shortcuts 1..4 for choices during PLAYING phase
  useEffect(() => {
    if (phase !== 'PLAYING' || galleryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < availableChoices.length) {
        e.preventDefault();
        handleSelectChoice(availableChoices[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, galleryOpen, availableChoices, handleSelectChoice]);

  const unlockedCount = Object.keys(unlockedMap).length;

  return (
    <>
      {phase === 'TITLE_MENU' && (
        <TitleScreen
          selectedFaction={selectedFactionId}
          onSelectFaction={(id) => {
            bbsAudio.playKeyClick();
            setSelectedFactionId(id);
          }}
          onStartGame={() => startCampaign(selectedFactionId)}
          onStartWarMode={startInstantWarMode}
          onOpenGallery={() => setGalleryOpen(true)}
          unlockedCount={unlockedCount}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {phase === 'PLAYING' && (
        <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 flex flex-col">
          {/* Top War-Room Broadcast Bar */}
          <header className="border-b border-[#243044] bg-[#0C111B] px-4 py-2.5 lg:px-6">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
              {/* Brand & Round Counter */}
              <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => setPhase('TITLE_MENU')}
                  className="font-mono-bbs text-sm font-black tracking-wide text-white hover:text-blue-400 transition-colors cursor-pointer"
                >
                  KUOMINTANG 2028
                </button>
                <span className="text-slate-600">·</span>
                <span className="font-mono-bbs text-xs font-bold text-amber-300">
                  {currentRound.dateLabel}（第 {currentRound.round}/24 回合）
                </span>
              </div>

              {/* Live National Projected Share Bar */}
              <div className="flex min-w-[260px] flex-1 max-w-md flex-col gap-1">
                <div className="flex items-center justify-between font-mono-bbs text-[11px]">
                  <span className="text-blue-400 font-bold">
                    藍 {nationalShares.kmt.toFixed(1)}%
                  </span>
                  <span className="text-emerald-400 font-bold">
                    綠 {nationalShares.dpp.toFixed(1)}%
                  </span>
                  <span className="text-cyan-400 font-bold">
                    白 {nationalShares.tpp.toFixed(1)}%
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden bg-[#1E293B]">
                  <div
                    className="bg-blue-600 transition-all duration-200"
                    style={{ width: `${nationalShares.kmt}%` }}
                  />
                  <div
                    className="bg-emerald-600 transition-all duration-200"
                    style={{ width: `${nationalShares.dpp}%` }}
                  />
                  <div
                    className="bg-cyan-500 transition-all duration-200"
                    style={{ width: `${nationalShares.tpp}%` }}
                  />
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="flex items-center gap-1.5 border border-[#2C3A52] bg-[#111827] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-blue-500 whitespace-nowrap cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  <span>圖鑑 {unlockedCount}/30</span>
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? '開啟音效' : '靜音'}
                  className="flex items-center gap-1 border border-[#2C3A52] bg-[#111827] px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-500 whitespace-nowrap cursor-pointer"
                >
                  {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => startCampaign(selectedFactionId)}
                  aria-label="重新開始本局"
                  className="flex items-center gap-1 border border-[#2C3A52] bg-[#111827] px-2.5 py-1.5 text-xs text-slate-300 hover:border-rose-500 hover:text-rose-300 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>重開</span>
                </button>
              </div>
            </div>

            {/* 5 Campaign Telemetry Meters */}
            <div className="mx-auto mt-2.5 grid max-w-[1440px] grid-cols-5 gap-2 border-t border-[#1B2435] pt-2 font-mono-bbs text-xs">
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">黨內團結</span>
                <span
                  className={`font-bold ${
                    stats.unity <= 30 ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {stats.unity}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">脆/PTT聲量</span>
                <span className="font-bold text-amber-300">{stats.momentum}%</span>
              </div>
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">競選糧草</span>
                <span
                  className={`font-bold ${
                    stats.funds <= 25 ? 'text-rose-400' : 'text-emerald-300'
                  }`}
                >
                  {stats.funds}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">中共壓力</span>
                <span
                  className={`font-bold ${
                    stats.ccpTension >= 75 ? 'text-red-400' : 'text-slate-200'
                  }`}
                >
                  {stats.ccpTension}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">美日態度</span>
                <span
                  className={`font-bold ${
                    stats.japanPosture <= 25 ? 'text-rose-400' : 'text-cyan-300'
                  }`}
                >
                  {stats.japanPosture}%
                </span>
              </div>
            </div>
          </header>

          {/* Main 2-Column War-Room Workspace */}
          <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-5 p-4 lg:grid-cols-12 lg:p-6">
            {/* Left 7 Cols: BBS / Threads Debate Terminal */}
            <section className="flex flex-col gap-4 lg:col-span-7">
              {/* Active Candidate & Outcome Flash */}
              <div className="flex flex-wrap items-center justify-between gap-3 border border-[#243044] bg-[#0D131F] px-4 py-3">
                <div className="flex items-center gap-3">
                  <PortraitAvatar portraitKey={activeFaction.portraitKey} sizeClass="w-12 h-12" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{activeFaction.name}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs text-blue-400">{activeFaction.factionName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{activeFaction.tagline}</p>
                  </div>
                </div>
                <div className="font-mono-bbs text-xs text-slate-400">
                  快捷鍵 1–{availableChoices.length} 回擊
                </div>
              </div>

              {lastOutcomeBanner && (
                <div className="border border-[#2C3A52] bg-[#131D2E] px-4 py-2.5 text-xs leading-relaxed text-amber-200">
                  {lastOutcomeBanner}
                </div>
              )}

              {/* Current Month BBS Event Briefing */}
              <div className="border border-[#243044] bg-[#0D131F] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243044] pb-2.5 font-mono-bbs text-xs">
                  <span className="font-bold text-amber-300">{currentRound.boardName}</span>
                  <span className="text-slate-400">{currentRound.dateLabel}</span>
                </div>

                <h1 className="mt-3 text-xl font-black text-white leading-snug [text-wrap:balance]">
                  {currentRound.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {currentRound.situationBrief}
                </p>

                {/* CCP & Japan Regional Brief */}
                <div className="mt-3.5 grid grid-cols-1 gap-2 border-t border-[#1E293B] pt-3 text-xs sm:grid-cols-2">
                  <div className="flex items-start gap-2 text-rose-200/90">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <span>
                      <strong className="text-rose-300">北京／台海：</strong>
                      {currentRound.ccpNotice}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sky-200/90">
                    <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                    <span>
                      <strong className="text-sky-300">美日／東海：</strong>
                      {currentRound.japanNotice}
                    </span>
                  </div>
                </div>

                {/* Rival Threads / PTT Attack Post */}
                <div className="mt-4 border border-[#2C3A52] bg-[#090D16] p-4">
                  <div className="flex items-start gap-3">
                    <PortraitAvatar
                      portraitKey={currentRound.rivalPost.portraitKey}
                      sizeClass="w-12 h-12"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-white">
                          {currentRound.rivalPost.authorName}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-emerald-400 font-medium">
                          {currentRound.rivalPost.authorRole}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono-bbs text-slate-400">
                          {currentRound.rivalPost.platform}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-white">
                        {currentRound.rivalPost.headline}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">
                        {currentRound.rivalPost.body}
                      </p>
                      <div className="mt-2 font-mono-bbs text-[11px] text-slate-400">
                        {currentRound.rivalPost.likesLabel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Rhetorical Choice Cards */}
                <div className="mt-5">
                  <div className="mb-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      選擇你的脆文／PTT 戰術回擊（無自定義輸入，點擊即發送）
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {availableChoices.map((choice, idx) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => handleSelectChoice(choice)}
                        className="group flex w-full flex-col border border-[#2C3A52] bg-[#101622] p-3.5 text-left transition-colors hover:border-blue-500 hover:bg-[#132038] cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-bbs text-xs font-bold text-blue-400">
                              [{idx + 1}]
                            </span>
                            <span className="font-mono-bbs text-xs font-semibold text-amber-300">
                              {choice.toneLabel}
                            </span>
                            {choice.factionOnly && (
                              <span className="font-mono-bbs text-[11px] font-bold text-cyan-300">
                                · 派系專屬選項
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-blue-300">
                            發送回擊 →
                          </span>
                        </div>

                        <div className="mt-1.5 text-sm font-bold text-white leading-snug">
                          {choice.label}
                        </div>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {choice.speechText}
                        </p>
                        <div className="mt-2 font-mono-bbs text-[11px] text-slate-400">
                          戰情預判：{choice.hint}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live PTT Push/Boo Feed Log */}
              <div className="border border-[#243044] bg-[#080B10] p-4">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 font-mono-bbs text-xs text-slate-400">
                  <span>PTT / Threads 即時推噓戰況紀錄</span>
                  <span>即時更新</span>
                </div>
                <div className="bbs-scroll mt-2.5 max-h-48 overflow-y-auto space-y-1.5 font-mono-bbs text-xs">
                  {bbsLog.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="shrink-0 text-slate-500">[{entry.dateLabel}]</span>
                      <span
                        className={`shrink-0 font-bold ${
                          entry.type === '推'
                            ? 'text-amber-300'
                            : entry.type === '噓'
                              ? 'text-rose-400'
                              : entry.type === '系統'
                                ? 'text-blue-400'
                                : 'text-slate-400'
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span className="shrink-0 text-cyan-300">{entry.author}:</span>
                      <span className="text-slate-200">{entry.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right 5 Cols: Real-Time 22-County Map + County Quick Selector */}
            <aside className="flex flex-col gap-4 lg:col-span-5">
              <TaiwanGeopoliticalMap
                counties={counties}
                selectedCountyId={selectedCountyId}
                onSelectCounty={(id) => {
                  bbsAudio.playKeyClick();
                  setSelectedCountyId(id);
                }}
                stats={stats}
                flags={flags}
                mapMode={mapMode}
                onChangeMapMode={(m) => {
                  bbsAudio.playKeyClick();
                  setMapMode(m);
                }}
              />

              {/* Compact 22-County Quick Grid for Instant Scanning */}
              <div className="border border-[#243044] bg-[#0D131F] p-3.5">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-xs">
                  <span className="font-bold text-slate-200">22 縣市即時戰況速覽</span>
                  <span className="font-mono-bbs text-slate-400">點擊切換地圖檢視</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {counties.map((c) => {
                    const leader =
                      c.current.kmt >= c.current.dpp && c.current.kmt >= c.current.tpp
                        ? 'KMT'
                        : c.current.dpp >= c.current.kmt && c.current.dpp >= c.current.tpp
                          ? 'DPP'
                          : 'TPP';
                    const isSel = c.id === selectedCountyId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          bbsAudio.playKeyClick();
                          setSelectedCountyId(c.id);
                        }}
                        className={`flex items-center justify-between border px-2 py-1.5 text-left font-mono-bbs text-[11px] transition-colors cursor-pointer ${
                          isSel
                            ? 'border-amber-400 bg-[#182235]'
                            : 'border-[#1E293B] bg-[#0A0F18] hover:border-slate-500'
                        }`}
                      >
                        <span className="truncate font-sans text-xs font-medium text-slate-200">
                          {c.id}
                        </span>
                        <span
                          className={`ml-1 shrink-0 font-bold ${
                            leader === 'KMT'
                              ? 'text-blue-400'
                              : leader === 'DPP'
                                ? 'text-emerald-400'
                                : 'text-cyan-400'
                          }`}
                        >
                          {c.current.kmt.toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </main>
        </div>
      )}

      {phase === 'STRAIT_WAR' && (
        <StraitWarMiniGame
          faction={activeFaction}
          counties={counties}
          stats={stats}
          flags={flags}
          onResolveWar={(endingId, finalOccupied) => {
            setWarOccupiedCounties(finalOccupied);
            if (endingId === 15) {
              setFlags((prev) => Array.from(new Set([...prev, 'guoguang_victory'])));
            } else if (endingId === 16) {
              setFlags((prev) => Array.from(new Set([...prev, 'hk_restoration'])));
            }
            const warEnding = ENDINGS.find((e) => e.id === endingId) ?? ENDINGS[14];
            finishWithEnding(warEnding, false);
          }}
        />
      )}

      {phase === 'ELECTION_NIGHT' && (
        <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl border border-[#2C3A52] bg-[#0D131F] p-6">
            <div className="flex items-center justify-between border-b border-[#243044] pb-3">
              <div className="flex items-center gap-2 font-mono-bbs text-sm font-bold text-amber-300">
                <span>2028.01.13 // 中選會即時開票中心連線中</span>
              </div>
              <button
                type="button"
                onClick={() => setPhase('GAME_OVER')}
                className="border border-[#2C3A52] px-3 py-1 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                直接看最終結局 →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono-bbs text-xs">
              {counties.slice(0, tallyRevealCount).map((c) => {
                const win =
                  c.current.kmt >= c.current.dpp && c.current.kmt >= c.current.tpp
                    ? '藍勝'
                    : c.current.dpp >= c.current.kmt && c.current.dpp >= c.current.tpp
                      ? '綠勝'
                      : '白勝';
                return (
                  <div
                    key={c.id}
                    className="border border-[#243044] bg-[#101622] px-2.5 py-2 flex items-center justify-between"
                  >
                    <span className="font-sans text-slate-200">{c.id}</span>
                    <span
                      className={
                        win === '藍勝'
                          ? 'text-blue-400 font-bold'
                          : win === '綠勝'
                            ? 'text-emerald-400 font-bold'
                            : 'text-cyan-400 font-bold'
                      }
                    >
                      {win} {Math.max(c.current.kmt, c.current.dpp, c.current.tpp).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'GAME_OVER' && activeEnding && (
        <GameOverScreen
          ending={activeEnding}
          faction={activeFaction}
          counties={counties}
          flags={flags}
          nationalShares={nationalShares}
          stats={stats}
          unlockedCount={unlockedCount}
          warOccupiedCounties={warOccupiedCounties}
          onPlayAgain={() => startCampaign(selectedFactionId)}
          onOpenGallery={() => setGalleryOpen(true)}
          onReturnTitle={() => setPhase('TITLE_MENU')}
        />
      )}

      {galleryOpen && (
        <EndingsGalleryModal
          unlockedMap={unlockedMap}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
