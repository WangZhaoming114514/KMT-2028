import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  VolumeX,
  BookOpen,
  RotateCcw,
  Radio,
  ShieldAlert,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  BadgeCheck,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { FACTION_LEADERS } from './data/factions';
import { CAMPAIGN_ROUNDS, getRoundEventForFaction } from './data/rounds';
import {
  ENDINGS,
  checkMidGameEnding,
  evaluateEarnedSubEndings,
  evaluateFallbackMajorForSub,
  evaluateFinalEnding,
  loadUnlockedEndings,
  saveUnlockedEndings,
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
  appendTemporaryDistrictsForFlags,
  applyChoiceToCounties,
  applyWarVictoryOutcomeToCounties,
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
import { NortheastAsiaMiniGame } from './components/NortheastAsiaMiniGame';

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
  const [earnedSubEndings, setEarnedSubEndings] = useState<EndingDefinition[]>([]);
  const [unlockedMap, setUnlockedMap] = useState<Record<number, string>>(() =>
    loadUnlockedEndings()
  );
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [tallyRevealCount, setTallyRevealCount] = useState<number>(0);
  const [warAlreadyFought, setWarAlreadyFought] = useState<boolean>(false);
  const [warLaunchedFromTitle, setWarLaunchedFromTitle] = useState<boolean>(false);
  const [warOccupiedCounties, setWarOccupiedCounties] = useState<string[] | undefined>(undefined);
  const [nanjingIntroPlayed, setNanjingIntroPlayed] = useState<boolean>(false);
  const [feedTab, setFeedTab] = useState<'THREADS' | 'PTT'>('THREADS');

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
      setEarnedSubEndings([]);
      setTallyRevealCount(0);
      setWarAlreadyFought(false);
      setWarLaunchedFromTitle(false);
      setWarOccupiedCounties(undefined);
      setNanjingIntroPlayed(false);
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
    setWarLaunchedFromTitle(true);
    setWarOccupiedCounties(undefined);
    setNanjingIntroPlayed(false);
    setPhase('STRAIT_WAR');
  }, [activeFaction]);

  const startInstantNeaWarMode = useCallback(() => {
    const leader = activeFaction;
    const baseFlags = ['guoguang_victory', 'hk_restoration', 'minge_party_entered', 'us_jp_kr_pact'];
    bbsAudio.playAlertSiren();
    setCounties(
      applyWarVictoryOutcomeToCounties(initCountiesForFaction(leader), 15, [], true, false, false)
    );
    setStats({ ...leader.startingStats, ccpTension: 0, japanPosture: 82 });
    setFlags(baseFlags);
    setWarAlreadyFought(true);
    setWarLaunchedFromTitle(true);
    setWarOccupiedCounties(undefined);
    setNanjingIntroPlayed(false);
    setPhase('NORTHEAST_ASIA_WAR');
  }, [activeFaction]);

  const finishWithEnding = useCallback(
    (
      ending: EndingDefinition,
      useElectionAnimation: boolean,
      subEndings: EndingDefinition[] = []
    ) => {
      const updatedMap = saveUnlockedEndings([ending.id, ...subEndings.map((s) => s.id)]);
      setUnlockedMap(updatedMap);
      setActiveEnding(ending);
      setEarnedSubEndings(subEndings);
      if (useElectionAnimation) {
        setTallyRevealCount(0);
        setPhase('ELECTION_NIGHT');
      } else {
        bbsAudio.playAlertSiren();
        setPhase('GAME_OVER');
      }
    },
    []
  );

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
      const nextFlags = choice.setFlags
        ? Array.from(new Set([...flags, ...choice.setFlags]))
        : flags;

      const guoguangWon = nextFlags.includes('guoguang_victory');
      const warCcpCrushed =
        guoguangWon ||
        nextFlags.includes('war_hk_victory') ||
        nextFlags.includes('war_defense_victory');

      const nextStats: CampaignStats = {
        unity: clampStat(stats.unity + (choice.statDelta.unity ?? 0)),
        momentum: clampStat(stats.momentum + (choice.statDelta.momentum ?? 0)),
        funds: clampStat(stats.funds + (choice.statDelta.funds ?? 0)),
        ccpTension: warCcpCrushed
          ? 0
          : clampStat(stats.ccpTension + (choice.statDelta.ccpTension ?? 0)),
        japanPosture: clampStat(stats.japanPosture + (choice.statDelta.japanPosture ?? 0)),
      };

      let nextCounties = applyChoiceToCounties(counties, choice, activeFaction, nextStats);
      if (nextFlags.includes('saibei_recovered') && warCcpCrushed) {
        nextCounties = appendTemporaryDistrictsForFlags(nextCounties, nextFlags);
      }
      const nextNational = computeNationalShares(nextCounties);

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
        !warCcpCrushed &&
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

      // After Guoguang Victory (還都南京), Second Korean War & Northern Frontier crisis erupts around Round 18+
      if (
        guoguangWon &&
        !nextFlags.includes('nea_war_fought') &&
        currentRound.round >= 18 &&
        roundIndex < CAMPAIGN_ROUNDS.length - 1
      ) {
        bbsAudio.playAlertSiren();
        setPhase('NORTHEAST_ASIA_WAR');
        return;
      }

      // Check mid-game crisis/meme triggers (do not overwrite Guoguang victory!)
      const midEnding = guoguangWon
        ? null
        : checkMidGameEnding({
            factionId: activeFaction.id,
            round: currentRound.round,
            stats: nextStats,
            nationalShares: nextNational,
            counties: nextCounties,
            flags: nextFlags,
            midGameTrigger: true,
          });

      if (midEnding) {
        const evalCtx = {
          factionId: activeFaction.id,
          round: currentRound.round,
          stats: nextStats,
          nationalShares: nextNational,
          counties: nextCounties,
          flags: nextFlags,
          midGameTrigger: true,
        };
        const parentMajor = evaluateFallbackMajorForSub(evalCtx, midEnding.id);
        finishWithEnding(parentMajor, false, [midEnding]);
        return;
      }

      // Check if Final Round 24 just finished (Election Simulator First: resolves 15 MAJOR + unlocks earned SUB endings)
      if (roundIndex >= CAMPAIGN_ROUNDS.length - 1) {
        const evalCtx = {
          factionId: activeFaction.id,
          round: currentRound.round,
          stats: nextStats,
          nationalShares: nextNational,
          counties: nextCounties,
          flags: nextFlags,
          midGameTrigger: false,
        };
        const finalEnding = evaluateFinalEnding(evalCtx);
        const subEndings = evaluateEarnedSubEndings(evalCtx);
        if (nextFlags.includes('guoguang_victory') || nextFlags.includes('hk_restoration')) {
          setCounties((prev) => appendTemporaryDistrictsForFlags(prev, nextFlags));
        }
        finishWithEnding(finalEnding, true, subEndings);
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
          onStartNeaWarMode={startInstantNeaWarMode}
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
                <div className="flex items-center justify-between gap-2 font-mono-bbs text-[11px]">
                  <span className="text-blue-400 font-bold">
                    藍 {nationalShares.kmt.toFixed(1)}%
                  </span>
                  <span className="text-emerald-400 font-bold">
                    綠 {nationalShares.dpp.toFixed(1)}%
                  </span>
                  <span className="text-cyan-400 font-bold">
                    白 {nationalShares.tpp.toFixed(1)}%
                  </span>
                  {(nationalShares.minge ?? 0) > 0 && (
                    <span className="text-purple-400 font-bold">
                      民革 {(nationalShares.minge ?? 0).toFixed(1)}%
                    </span>
                  )}
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
                  {(nationalShares.minge ?? 0) > 0 && (
                    <div
                      className="bg-purple-600 transition-all duration-200"
                      style={{ width: `${nationalShares.minge ?? 0}%` }}
                    />
                  )}
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
                  <span>圖鑑 {unlockedCount}/40</span>
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
                <span className="text-slate-400">
                  {flags.includes('guoguang_victory')
                    ? '大陸戰況'
                    : flags.includes('war_hk_victory') || flags.includes('war_defense_victory')
                      ? '台海戰況'
                      : '中共壓力'}
                </span>
                <span
                  className={`font-bold ${
                    flags.includes('guoguang_victory')
                      ? 'text-blue-400'
                      : flags.includes('war_hk_victory') || flags.includes('war_defense_victory')
                        ? 'text-cyan-300'
                        : stats.ccpTension >= 75
                          ? 'text-red-400'
                          : 'text-slate-200'
                  }`}
                >
                  {flags.includes('guoguang_victory')
                    ? '0% 三民主義統一'
                    : flags.includes('war_hk_victory') || flags.includes('war_defense_victory')
                      ? '0% 共軍全滅'
                      : `${stats.ccpTension}%`}
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#101622] px-2.5 py-1 border border-[#1E293B]">
                <span className="text-slate-400">
                  {flags.includes('us_jp_kr_pact') ? '美日韓共防' : '美日韓態度'}
                </span>
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
                    <ShieldAlert
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        flags.includes('guoguang_victory') ? 'text-blue-400' : 'text-rose-400'
                      }`}
                    />
                    <span>
                      <strong
                        className={
                          flags.includes('guoguang_victory')
                            ? 'text-blue-300'
                            : flags.includes('war_hk_victory') ||
                                flags.includes('war_defense_victory')
                              ? 'text-sky-300'
                              : 'text-rose-300'
                        }
                      >
                        {flags.includes('guoguang_victory')
                          ? '三民主義統一中國：'
                          : flags.includes('war_hk_victory') ||
                              flags.includes('war_defense_victory')
                            ? '台海戰後局勢：'
                            : '北京／台海：'}
                      </strong>
                      {flags.includes('guoguang_victory')
                        ? '已正式還都南京（金門連江併入福建，改設香港・北平・南京特別市及六大地理區開票，民革參選）！'
                        : flags.includes('war_hk_victory') || flags.includes('war_defense_victory')
                          ? '敵軍渡海主力已被我軍殲滅潰敗，封鎖線全面解除，台海制海權穩固。'
                          : currentRound.ccpNotice}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sky-200/90">
                    <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                    <span>
                      <strong className="text-sky-300">美日韓／東海：</strong>
                      {currentRound.japanNotice}
                    </span>
                  </div>
                </div>

                {flags.includes('guoguang_victory') && !flags.includes('nea_war_fought') && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-cyan-500/60 bg-[#0D1E38] px-3.5 py-2 text-xs">
                    <span className="font-bold text-cyan-200">
                      🧭 【東北亞緊急戰情】還都南京後北疆＆三十八度線緊張升高，可立即出兵漠北＆清代外東北！
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        bbsAudio.playAlertSiren();
                        setPhase('NORTHEAST_ASIA_WAR');
                      }}
                      className="bg-blue-600 px-3 py-1 font-bold text-white hover:bg-blue-500 cursor-pointer"
                    >
                      啟動〈蒙古＆清代外東北決戰・韓戰〉→
                    </button>
                  </div>
                )}

                {/* Authentic Threads (脆) / PTT Dual-Style Attack Post */}
                <div className="mt-4 rounded-xl border border-[#282A2E] bg-[#101010] p-4 font-sans">
                  <div className="flex items-center justify-between border-b border-[#222428] pb-2 text-[11px] text-[#777777]">
                    <span className="font-semibold text-[#F3F5F7]">
                      {currentRound.rivalPost.platform}
                    </span>
                    <span className="font-mono-bbs">{currentRound.dateLabel} · 即時發文</span>
                  </div>

                  <div className="mt-3 flex gap-3">
                    {/* Avatar + Vertical Thread Spine */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <PortraitAvatar
                          key={currentRound.rivalPost.portraitKey}
                          portraitKey={currentRound.rivalPost.portraitKey}
                          sizeClass="w-10 h-10 rounded-full"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#101010] bg-white text-black">
                          <Plus className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      </div>
                      <div className="mt-2 w-0.5 flex-1 bg-[#2F3135]" />
                    </div>

                    {/* Thread Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-bold text-[#F3F5F7]">
                            {currentRound.rivalPost.authorName}
                          </span>
                          <BadgeCheck className="h-3.5 w-3.5 text-[#0095F6]" />
                          <span className="text-[#777777]">
                            {currentRound.rivalPost.authorHandle}
                          </span>
                          <span className="text-[#555555]">·</span>
                          <span className="text-emerald-400 font-medium">
                            {currentRound.rivalPost.authorRole}
                          </span>
                        </div>
                        <MoreHorizontal className="h-4 w-4 shrink-0 text-[#777777]" />
                      </div>

                      <p className="mt-1.5 text-sm font-bold text-white leading-snug">
                        {currentRound.rivalPost.headline}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#D4D6D9]">
                        {currentRound.rivalPost.body}
                      </p>

                      {/* Threads Action Bar */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[#8E9297]">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <Heart className="h-4 w-4 text-rose-500" />
                            <span className="tabular-nums">推爆</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MessageCircle className="h-4 w-4" />
                            <span>筆戰</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Repeat2 className="h-4 w-4" />
                            <span>轉發</span>
                          </span>
                          <Send className="h-4 w-4" />
                        </div>
                        <span className="font-mono-bbs text-[11px] text-[#777777]">
                          {currentRound.rivalPost.likesLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Your Candidate Waiting on Thread Spine */}
                  <div className="mt-2.5 flex items-center gap-3 pl-1">
                    <PortraitAvatar
                      key={activeFaction.portraitKey}
                      portraitKey={activeFaction.portraitKey}
                      sizeClass="w-7 h-7 rounded-full"
                    />
                    <span className="text-xs text-[#8E9297]">
                      輪到 <strong className="text-blue-400">{activeFaction.name}</strong> 回串戰到底（從下方擇一送出）…
                    </span>
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

              {/* Dual Threads (脆) / PTT Live Feed Log */}
              <div className="border border-[#243044] bg-[#080B10] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFeedTab('THREADS')}
                      className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                        feedTab === 'THREADS'
                          ? 'bg-[#262626] text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      @ Threads 脆即時串流
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedTab('PTT')}
                      className={`px-2.5 py-1 font-mono-bbs text-xs font-bold cursor-pointer ${
                        feedTab === 'PTT'
                          ? 'bg-blue-700 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      PTT 八卦／政黑推噓
                    </button>
                  </div>
                  <span className="font-mono-bbs text-slate-500">即時輿論演算法</span>
                </div>

                {feedTab === 'THREADS' ? (
                  <div className="bbs-scroll mt-2.5 min-h-[340px] max-h-[500px] overflow-y-auto divide-y divide-[#1E1F23]">
                    {bbsLog.map((entry) => (
                      <div key={entry.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-[11px] ${
                            entry.type === '系統'
                              ? 'bg-blue-700 text-white'
                              : entry.type === '噓'
                                ? 'bg-rose-900/80 text-rose-200'
                                : 'bg-[#242529] text-slate-200'
                          }`}
                        >
                          {entry.author.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">@{entry.author}</span>
                            {entry.type === '系統' && (
                              <BadgeCheck className="h-3.5 w-3.5 text-[#0095F6]" />
                            )}
                            <span className="text-[#777777] text-[11px]">{entry.dateLabel}</span>
                          </div>
                          <p className="mt-0.5 text-[#D4D6D9] leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2.5 font-mono-bbs text-xs">
                    {/* Classic PTT BBS Article Header */}
                    <div className="border border-[#1E293B] bg-[#0B1220] px-3 py-2 text-[11px] space-y-0.5">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span>
                          <span className="bg-blue-800 px-1 text-white">作者</span>{' '}
                          <span className="text-cyan-300">{activeFaction.id}_2028</span>
                        </span>
                        <span>
                          <span className="bg-blue-800 px-1 text-white">看板</span>{' '}
                          <span className="text-amber-300">Gossiping / HatePolitics</span>
                        </span>
                      </div>
                      <div>
                        <span className="bg-blue-800 px-1 text-white">標題</span>{' '}
                        <span className="text-white font-bold">
                          [爆卦] {currentRound.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between text-slate-400">
                        <span>時間 {currentRound.dateLabel}（第 {currentRound.round}/24 回合）</span>
                        <span>
                          累計推文：
                          <strong className="text-amber-300">
                            {bbsLog.filter((b) => b.type === '推').length} 推
                          </strong>{' '}
                          /{' '}
                          <strong className="text-rose-400">
                            {bbsLog.filter((b) => b.type === '噓').length} 噓
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="bbs-scroll mt-2 min-h-[300px] max-h-[440px] overflow-y-auto space-y-1.5 px-1">
                      <div className="border-b border-dashed border-[#243044] pb-2 text-slate-300 leading-relaxed">
                        ※ 發信站: 批踢踢實業坊(ptt.cc), 來自: 台北重慶南路戰情室
                        <br />
                        ※ 主旨熱議：{currentRound.situationBrief}
                      </div>
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
                )}
              </div>
            </section>

            {/* Right 5 Cols: Real-Time Map + Dynamic Electoral Districts Grid */}
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
                shouldAutoPlayNanjing={!nanjingIntroPlayed}
                onNanjingAnimDone={() => setNanjingIntroPlayed(true)}
              />

              {/* Compact Quick Grid for 22 Counties + Temporary Constitutional Districts */}
              <div className="border border-[#243044] bg-[#0D131F] p-3.5">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 text-xs">
                  <span className="font-bold text-slate-200">
                    {counties.length} 選區即時戰況速覽
                    {counties.length > 22 ? '（含行憲臨時選區）' : ''}
                  </span>
                  <span className="font-mono-bbs text-slate-400">點擊切換地圖檢視</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {counties.map((c) => {
                    const minge = c.current.minge ?? 0;
                    const leader =
                      minge > c.current.kmt && minge > c.current.dpp && minge > c.current.tpp
                        ? 'MINGE'
                        : c.current.kmt >= c.current.dpp && c.current.kmt >= c.current.tpp
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
                                : leader === 'MINGE'
                                  ? 'text-purple-400'
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
          allowContinueCampaign={!warLaunchedFromTitle && roundIndex < CAMPAIGN_ROUNDS.length - 1}
          onResolveWar={(
            endingId,
            finalOccupied,
            postWarAction,
            capturedProvinces,
            capturedHk
          ) => {
            setWarOccupiedCounties(endingId === 17 ? finalOccupied : undefined);
            const updatedCounties = applyWarVictoryOutcomeToCounties(
              counties,
              endingId,
              capturedProvinces,
              capturedHk,
              flags.includes('saibei_recovered'),
              flags.includes('waidongbei_recovered')
            );
            setCounties(updatedCounties);

            const addedFlags: string[] = [];
            if (endingId === 15) {
              addedFlags.push('guoguang_victory', 'hk_restoration', 'minge_party_entered');
            } else if (endingId === 16) {
              addedFlags.push('hk_restoration', 'war_hk_victory');
            } else if (endingId === 18) {
              addedFlags.push('war_defense_victory');
            } else if (endingId === 17) {
              addedFlags.push('taiwan_fallen');
            }

            if (endingId !== 17) {
              if (capturedHk) addedFlags.push('hk_restoration');
              for (const p of capturedProvinces) {
                addedFlags.push(`captured_prov_${p}`);
              }
            }

            const nextFlags = Array.from(new Set([...flags, ...addedFlags]));
            setFlags(nextFlags);

            const nextStats: CampaignStats =
              endingId === 17
                ? { ...stats, ccpTension: 100 }
                : {
                    ...stats,
                    unity: clampStat(stats.unity + 14),
                    momentum: clampStat(stats.momentum + 16),
                    ccpTension: 0,
                  };
            setStats(nextStats);

            const warSubEnding = ENDINGS.find((e) => e.id === endingId) ?? ENDINGS[14];
            const bonusSubs: EndingDefinition[] = [warSubEnding];
            if (endingId === 15 && capturedHk) {
              const hkEnd = ENDINGS.find((e) => e.id === 16);
              if (hkEnd) bonusSubs.push(hkEnd);
            }
            const updatedUnlocked = saveUnlockedEndings(bonusSubs.map((s) => s.id));
            setUnlockedMap(updatedUnlocked);

            if (
              postWarAction === 'CONTINUE_CAMPAIGN' &&
              endingId !== 17 &&
              roundIndex < CAMPAIGN_ROUNDS.length - 1
            ) {
              const tempCount = updatedCounties.filter((c) => c.isTemporary).length;
              const districtLabel =
                endingId === 15
                  ? '已正式還都南京！金門連江併入福建，改設香港・北平・南京特別市及六大地理區納入開票，並引入「民革」新勢力四黨競逐！'
                  : tempCount > 0
                    ? `已成功增設 ${tempCount} 個行憲臨時選區納入 2028 開票！`
                    : '台灣全境愛國選票暴衝，敵軍主力已徹底瓦解！';

              bbsAudio.playElectionFanfare(true);
              setLastOutcomeBanner(
                `★ 【台海勝利戰報】${warSubEnding.title}！台灣各縣市藍營選票大暴增，且${districtLabel}（此戰役領土子結局已附屬收錄，繼續衝刺 2028 大選！）`
              );
              setBbsLog((prev) => [
                {
                  id: `war-win-${Date.now()}`,
                  round: currentRound.round,
                  dateLabel: currentRound.dateLabel,
                  type: '系統',
                  author: '國防部戰報',
                  text: `擊敗敵軍勝利結算：${districtLabel}`,
                },
                ...prev,
              ]);
              setRoundIndex((prev) => prev + 1);
              setPhase('PLAYING');
              return;
            }

            // Sub-endings always attach under a MAJOR ending!
            const parentMajor = evaluateFallbackMajorForSub(
              {
                factionId: activeFaction.id,
                round: currentRound.round,
                stats: nextStats,
                nationalShares: computeNationalShares(updatedCounties),
                counties: updatedCounties,
                flags: nextFlags,
                midGameTrigger: false,
              },
              endingId
            );
            finishWithEnding(parentMajor, false, bonusSubs);
          }}
        />
      )}

      {phase === 'NORTHEAST_ASIA_WAR' && (
        <NortheastAsiaMiniGame
          faction={activeFaction}
          stats={stats}
          flags={flags}
          allowContinueCampaign={!warLaunchedFromTitle && roundIndex < CAMPAIGN_ROUNDS.length - 1}
          onResolveNeaWar={(endingId, postWarAction, meta) => {
            const addedFlags = [
              'nea_war_fought',
              `nea_ending_${endingId}`,
              'guoguang_victory',
              'hk_restoration',
              'minge_party_entered',
            ];
            if (meta.saibeiRecovered) addedFlags.push('saibei_recovered');
            if (meta.waidongbeiRecovered) addedFlags.push('waidongbei_recovered');
            if (meta.koreaUnified) addedFlags.push('korea_unified');

            const nextFlags = Array.from(new Set([...flags, ...addedFlags]));
            setFlags(nextFlags);

            const updatedCounties = applyWarVictoryOutcomeToCounties(
              counties,
              15,
              ['minnan', 'minbei', 'guangdong', 'shanghai_zhejiang', 'nanjing'],
              true,
              meta.saibeiRecovered,
              meta.waidongbeiRecovered
            );
            setCounties(updatedCounties);

            const nextStats: CampaignStats = {
              ...stats,
              unity: clampStat(stats.unity + 10),
              momentum: clampStat(stats.momentum + 12),
              japanPosture: meta.koreaUnified ? clampStat(stats.japanPosture + 14) : stats.japanPosture,
              ccpTension: 0,
            };
            setStats(nextStats);

            const neaSubEnding = ENDINGS.find((e) => e.id === endingId) ?? ENDINGS[30];
            const bonusSubs: EndingDefinition[] = [neaSubEnding];
            if (meta.saibeiRecovered) {
              const tuvaSub = ENDINGS.find((e) => e.id === 34);
              const mobeiSub = ENDINGS.find((e) => e.id === 32);
              if (mobeiSub && mobeiSub.id !== neaSubEnding.id) bonusSubs.push(mobeiSub);
              if (tuvaSub) bonusSubs.push(tuvaSub);
            }
            const guoSub = ENDINGS.find((e) => e.id === 15);
            if (guoSub) bonusSubs.push(guoSub);
            const updatedUnlocked = saveUnlockedEndings(bonusSubs.map((s) => s.id));
            setUnlockedMap(updatedUnlocked);

            if (
              postWarAction === 'CONTINUE_CAMPAIGN' &&
              roundIndex < CAMPAIGN_ROUNDS.length - 1
            ) {
              bbsAudio.playElectionFanfare(true);
              const summaryText =
                endingId === 33
                  ? '收回清代外東北（黑龍江北岸・海參崴・庫頁島）並助大韓民國統一朝鮮半島！新增外東北行憲選區！'
                  : endingId === 32
                    ? '奪回漠北外蒙古與圖瓦共和國（唐努烏梁海）！新增塞北行憲臨時選區！'
                    : '東北亞簽署停火維持現狀協議，鞏固還都南京新局！';
              setLastOutcomeBanner(`★ 【東北亞戰報】${summaryText}`);
              setBbsLog((prev) => [
                {
                  id: `nea-win-${Date.now()}`,
                  round: currentRound.round,
                  dateLabel: currentRound.dateLabel,
                  type: '系統',
                  author: '東北亞聯軍司令部',
                  text: summaryText,
                },
                ...prev,
              ]);
              setRoundIndex((prev) => prev + 1);
              setPhase('PLAYING');
              return;
            }

            // Attach NEA territorial sub-endings under the parent 2028 Election MAJOR ending
            const parentMajor = evaluateFallbackMajorForSub(
              {
                factionId: activeFaction.id,
                round: currentRound.round,
                stats: nextStats,
                nationalShares: computeNationalShares(updatedCounties),
                counties: updatedCounties,
                flags: nextFlags,
                midGameTrigger: false,
              },
              endingId
            );
            finishWithEnding(parentMajor, false, bonusSubs);
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
                const minge = c.current.minge ?? 0;
                const win =
                  minge > c.current.kmt && minge > c.current.dpp && minge > c.current.tpp
                    ? '民革勝'
                    : c.current.kmt >= c.current.dpp && c.current.kmt >= c.current.tpp
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
                            : win === '民革勝'
                              ? 'text-purple-400 font-bold'
                              : 'text-cyan-400 font-bold'
                      }
                    >
                      {win} {Math.max(c.current.kmt, c.current.dpp, c.current.tpp, minge).toFixed(1)}%
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
          earnedSubEndings={earnedSubEndings}
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
