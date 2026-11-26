import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import taiwanTopologyRaw from 'taiwan-atlas/counties-10t.json';
import eastAsiaGeoRaw from '../data/eastAsiaGeo.json';
import { CampaignStats, CountyState, FactionLeader } from '../types/game';
import { bbsAudio } from '../utils/sound';

interface TaiwanCountyProps {
  COUNTYID: string;
  COUNTYCODE: string;
  COUNTYNAME: string;
  COUNTYENG: string;
}

interface WarUnit {
  id: string;
  name: string;
  role: 'DEFENSE' | 'OFFENSE' | 'HYBRID';
  apCost: number;
  taiwanAction: boolean;
  mainlandGain: number;
  hkGain: number;
  desc: string;
}

type TargetId = 'xiamen' | 'fuzhou' | 'guangzhou' | 'hongkong';

interface MainlandTarget {
  id: TargetId;
  name: string;
  coords: [number, number];
  progress: number;
}

interface StraitWarMiniGameProps {
  faction: FactionLeader;
  counties: CountyState[];
  stats: CampaignStats;
  flags: string[];
  onResolveWar: (endingId: 15 | 16 | 17 | 18, finalOccupied: string[]) => void;
}

const MAX_WAVES = 6;

const INITIAL_OCCUPIED = new Set<string>([
  '金門縣',
  '連江縣',
  '澎湖縣',
  '桃園市',
  '台南市',
  '花蓮縣',
  '新竹市',
]);

const INVASION_ORDER = [
  '新竹縣',
  '苗栗縣',
  '高雄市',
  '屏東縣',
  '台中市',
  '彰化縣',
  '雲林縣',
  '嘉義縣',
  '嘉義市',
  '新北市',
  '基隆市',
  '宜蘭縣',
  '台東縣',
  '南投縣',
  '桃園市',
  '台南市',
  '花蓮縣',
  '台北市',
];

function getWaveApBudget(stats: CampaignStats): number {
  if (stats.funds >= 70 && stats.unity >= 55) return 4;
  if (stats.funds <= 35) return 2;
  return 3;
}

function buildWaveUnits(
  wave: number,
  faction: FactionLeader,
  stats: CampaignStats,
  flags: string[]
): WarUnit[] {
  const hkBonus = flags.includes('hk_restoration') ? 10 : 0;
  const units: WarUnit[] = [
    {
      id: `w${wave}-armor`,
      name: '國軍裝甲 584 旅',
      role: 'DEFENSE',
      apCost: 1,
      taiwanAction: true,
      mainlandGain: 0,
      hkGain: 0,
      desc: '耗 1 AP｜拖曳至台灣「淪陷區」光復失土並固守本波',
    },
    {
      id: `w${wave}-marines`,
      name: '國光兩棲登陸師',
      role: 'OFFENSE',
      apCost: 2,
      taiwanAction: false,
      mainlandGain: 38,
      hkGain: 25,
      desc: '耗 2 AP｜猛攻大陸橋頭堡 +38%（或已解鎖之香港 +25%）',
    },
    {
      id: `w${wave}-hf3`,
      name: '雄風三型機動飛彈旅',
      role: 'HYBRID',
      apCost: 1,
      taiwanAction: true,
      mainlandGain: 24,
      hkGain: 18,
      desc: '耗 1 AP｜光復台灣淪陷區，或跨海打擊廈/福/廣 +24%',
    },
    {
      id: `w${wave}-hk`,
      name: '港台自由突擊先鋒',
      role: 'OFFENSE',
      apCost: 2,
      taiwanAction: false,
      mainlandGain: 26,
      hkGain: 35 + hkBonus,
      desc: `耗 2 AP｜突破後專攻香港 +${35 + hkBonus}%（廣州/廈門 +26%）`,
    },
  ];

  if (stats.japanPosture >= 60) {
    units.push({
      id: `w${wave}-usjp`,
      name: '美日第 7 艦隊聯合支援',
      role: 'HYBRID',
      apCost: 2,
      taiwanAction: true,
      mainlandGain: 45,
      hkGain: 38,
      desc: '耗 2 AP｜美日態度 ≥60% 解鎖！對岸 +45%／香港 +38% 或光復台島',
    });
  }

  if (faction.id === 'ma' && wave % 2 === 1) {
    units.push({
      id: `w${wave}-grip`,
      name: '馬氏死亡之握因果旅',
      role: 'HYBRID',
      apCost: 1,
      taiwanAction: true,
      mainlandGain: 45,
      hkGain: 35,
      desc: '耗 1 AP｜馬英九專屬！光復淪陷區或跨海突擊 +45%',
    });
  }

  return units.slice(0, 4);
}

export function StraitWarMiniGame({
  faction,
  counties,
  stats,
  flags,
  onResolveWar,
}: StraitWarMiniGameProps) {
  const [wave, setWave] = useState<number>(1);
  const [ap, setAp] = useState<number>(() => getWaveApBudget(stats));
  const [occupiedCounties, setOccupiedCounties] = useState<Set<string>>(
    () => new Set(INITIAL_OCCUPIED)
  );
  const [fortifiedCounties, setFortifiedCounties] = useState<Set<string>>(
    () => new Set([faction.homeCounty])
  );
  const [hitThisWave, setHitThisWave] = useState<Set<TargetId>>(() => new Set());
  const [targets, setTargets] = useState<MainlandTarget[]>([
    {
      id: 'xiamen',
      name: '廈門橋頭堡',
      coords: [118.1, 24.48],
      progress: flags.includes('guoguang_restarted') ? 15 : 0,
    },
    {
      id: 'fuzhou',
      name: '福州馬尾',
      coords: [119.3, 25.95],
      progress: flags.includes('guoguang_restarted') ? 10 : 0,
    },
    {
      id: 'guangzhou',
      name: '廣州 / 深圳樞紐',
      coords: [113.26, 23.13],
      progress: 0,
    },
    {
      id: 'hongkong',
      name: '香港維多利亞港',
      coords: [114.17, 22.32],
      progress: 0,
    },
  ]);

  const [handUnits, setHandUnits] = useState<WarUnit[]>(() =>
    buildWaveUnits(1, faction, stats, flags)
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [resolvedOutcome, setResolvedOutcome] = useState<15 | 16 | 17 | 18 | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([
    '【急電】中共東部與南部戰區同步發起跨海攻台！台灣紅區為「淪陷區」，對岸初期全紅。請善用每波有限 AP 拖曳兵力：欲攻佔香港，必先攻克「廣州 ≥ 60%」或「廈門 ≥ 80% 且美日態度 ≥ 65%」打破粵海封鎖線！',
  ]);

  const { taiwanFeatures, eastAsiaFeatures } = useMemo(() => {
    const topo = taiwanTopologyRaw as unknown as Topology<{
      counties: GeometryCollection<TaiwanCountyProps>;
    }>;
    const tw = topojson.feature(topo, topo.objects.counties) as FeatureCollection<
      Geometry,
      TaiwanCountyProps
    >;
    const ea = eastAsiaGeoRaw as unknown as FeatureCollection<Geometry, { name?: string }>;
    return { taiwanFeatures: tw.features, eastAsiaFeatures: ea.features };
  }, []);

  const SVG_W = 720;
  const SVG_H = 540;

  const mapGeo = useMemo(() => {
    const projection = geoMercator()
      .center([119.2, 23.6])
      .scale(1750)
      .translate([SVG_W * 0.5, SVG_H * 0.52]);
    const pathGen = geoPath().projection(projection);

    const chinaFeatures = eastAsiaFeatures.filter((f) => f.properties?.name === 'China');
    const chinaPathStrings = chinaFeatures.map((f) => pathGen(f) ?? '').filter(Boolean);

    return {
      eaPaths: eastAsiaFeatures.map((f, idx) => ({
        id: `${f.properties?.name ?? 'ea'}-${idx}`,
        name: f.properties?.name ?? '',
        d: pathGen(f) ?? '',
      })),
      chinaPathStrings,
      twPaths: taiwanFeatures.map((f) => ({
        id: f.properties.COUNTYNAME,
        d: pathGen(f) ?? '',
      })),
      targetPoints: targets.map((t) => ({
        ...t,
        pt: projection(t.coords) ?? [200, 200],
      })),
      diaoyuPt: projection([123.475, 25.745]) ?? [450, 200],
      luzonPt: projection([121.2, 17.8]) ?? [380, 470],
      koreaPt: projection([127.5, 35.5]) ?? [580, 48],
      vietnamPt: projection([107.2, 20.5]) ?? [46, 405],
      okinawaPt: projection([127.68, 26.21]) ?? [615, 190],
    };
  }, [eastAsiaFeatures, taiwanFeatures, targets]);

  const xiamenProg = targets.find((t) => t.id === 'xiamen')?.progress ?? 0;
  const fuzhouProg = targets.find((t) => t.id === 'fuzhou')?.progress ?? 0;
  const guangzhouProg = targets.find((t) => t.id === 'guangzhou')?.progress ?? 0;
  const hkProg = targets.find((t) => t.id === 'hongkong')?.progress ?? 0;

  const hkUnlocked =
    guangzhouProg >= 60 || (xiamenProg >= 80 && stats.japanPosture >= 65);
  const guoguangComplete = xiamenProg >= 100 && fuzhouProg >= 100 && guangzhouProg >= 100;

  const activeUnit =
    handUnits.find((u) => u.id === (draggingUnitId ?? selectedUnitId)) ?? null;

  const evaluateOutcome = (
    nextOccupied: Set<string>,
    nextTargets: MainlandTarget[]
  ): 15 | 16 | 17 | null => {
    const taipeiFallen = nextOccupied.has('台北市');
    if (taipeiFallen || nextOccupied.size >= 12) return 17;

    const xm = nextTargets.find((t) => t.id === 'xiamen')?.progress ?? 0;
    const fz = nextTargets.find((t) => t.id === 'fuzhou')?.progress ?? 0;
    const gz = nextTargets.find((t) => t.id === 'guangzhou')?.progress ?? 0;
    const hk = nextTargets.find((t) => t.id === 'hongkong')?.progress ?? 0;

    if (xm >= 100 && fz >= 100 && gz >= 100 && nextOccupied.size <= 7) return 15;
    if (hk >= 100 && nextOccupied.size <= 7) return 16;
    return null;
  };

  const deployUnitToCounty = (countyId: string, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】「${unit.name}」需耗費 ${unit.apCost} AP（目前僅剩 ${ap} AP），請改派低耗費兵力或結束本波！`,
        ...prev,
      ]);
      return;
    }
    if (!unit.taiwanAction) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」為跨海登陸師，無法部署至台灣本島，請拖曳至大陸／香港目標！`,
        ...prev,
      ]);
      return;
    }

    const nextOccupied = new Set(occupiedCounties);
    const nextFortified = new Set(fortifiedCounties);
    let msg = '';

    if (nextOccupied.has(countyId)) {
      nextOccupied.delete(countyId);
      nextFortified.add(countyId);
      msg = `【收復淪陷區】${unit.name} 掃蕩「${countyId}」解放成功並構築防線！`;
    } else {
      nextFortified.add(countyId);
      msg = `【防線固守】${unit.name} 進駐「${countyId}」，本波免疫登陸！`;
    }

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setOccupiedCounties(nextOccupied);
    setFortifiedCounties(nextFortified);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [msg, ...prev]);

    const outcome = evaluateOutcome(nextOccupied, targets);
    if (outcome) {
      setResolvedOutcome(outcome);
    }
  };

  const deployUnitToMainland = (targetId: TargetId, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】「${unit.name}」需耗費 ${unit.apCost} AP（剩餘 ${ap} AP）！`,
        ...prev,
      ]);
      return;
    }
    if (unit.role === 'DEFENSE') {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」為本土裝甲守軍，請拖曳至台灣「淪陷區」縣市！`,
        ...prev,
      ]);
      return;
    }
    if (targetId === 'hongkong' && !hkUnlocked) {
      bbsAudio.playAlertSiren();
      setBattleLog((prev) => [
        `【粵海封鎖線攔截】欲攻佔香港必先打開海空走廊！請先推進「廣州 / 深圳 ≥ 60%」或「廈門 ≥ 80% 且 美日態度 ≥ 65%」！`,
        ...prev,
      ]);
      return;
    }

    const gain = targetId === 'hongkong' ? unit.hkGain : unit.mainlandGain;
    const nextTargets = targets.map((t) =>
      t.id === targetId ? { ...t, progress: Math.min(100, t.progress + gain) } : t
    );

    const nextHit = new Set(hitThisWave);
    nextHit.add(targetId);

    const targetObj = nextTargets.find((t) => t.id === targetId)!;
    const reached = targetObj.progress >= 100;

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setTargets(nextTargets);
    setHitThisWave(nextHit);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      reached
        ? `★ 【登陸攻克】${unit.name} 奪下「${targetObj.name}」！對岸地圖已轉為青天白日藍！`
        : `【跨海強攻】${unit.name} 突擊「${targetObj.name}」，進度 +${gain}%（目前 ${targetObj.progress}%）！`,
      ...prev,
    ]);

    const outcome = evaluateOutcome(occupiedCounties, nextTargets);
    if (outcome) {
      if (outcome === 15) bbsAudio.playElectionFanfare(true);
      setResolvedOutcome(outcome);
    }
  };

  const handleEndWave = () => {
    if (resolvedOutcome) return;

    // 1. PLA launches counter-invasions on Taiwan counties
    const nextOccupied = new Set(occupiedCounties);
    const availableToInvade = INVASION_ORDER.filter(
      (cid) => !nextOccupied.has(cid) && !fortifiedCounties.has(cid)
    );

    const strikes = stats.ccpTension >= 82 ? 4 : 3;
    const newlyFallen: string[] = [];
    for (let i = 0; i < strikes && i < availableToInvade.length; i++) {
      nextOccupied.add(availableToInvade[i]);
      newlyFallen.push(availableToInvade[i]);
    }

    // 2. PLA counter-reinforces Mainland & HK nodes that aren't 100% captured or weren't suppressed this wave
    const nextTargets = targets.map((t) => {
      if (t.progress <= 0 || t.progress >= 100) return t;
      if (t.id === 'hongkong') {
        const gzDone = (targets.find((x) => x.id === 'guangzhou')?.progress ?? 0) >= 100;
        const decay = gzDone ? 5 : 15;
        return { ...t, progress: Math.max(0, t.progress - decay) };
      }
      if (!hitThisWave.has(t.id)) {
        return { ...t, progress: Math.max(0, t.progress - 10) };
      }
      return t;
    });

    bbsAudio.playAlertSiren();
    setOccupiedCounties(nextOccupied);
    setFortifiedCounties(new Set());
    setTargets(nextTargets);
    setHitThisWave(new Set());

    const instant = evaluateOutcome(nextOccupied, nextTargets);
    if (instant) {
      setResolvedOutcome(instant);
      return;
    }

    if (wave >= MAX_WAVES) {
      const xm = nextTargets.find((t) => t.id === 'xiamen')?.progress ?? 0;
      const fz = nextTargets.find((t) => t.id === 'fuzhou')?.progress ?? 0;
      const gz = nextTargets.find((t) => t.id === 'guangzhou')?.progress ?? 0;
      const hk = nextTargets.find((t) => t.id === 'hongkong')?.progress ?? 0;

      if (xm >= 100 && fz >= 100 && gz >= 100 && nextOccupied.size <= 7) {
        setResolvedOutcome(15);
      } else if (hk >= 100 && nextOccupied.size <= 7) {
        setResolvedOutcome(16);
      } else if (nextOccupied.has('台北市') || nextOccupied.size >= 12) {
        setResolvedOutcome(17);
      } else {
        setResolvedOutcome(18);
      }
      return;
    }

    const nextWave = wave + 1;
    setWave(nextWave);
    setAp(getWaveApBudget(stats));
    setHandUnits(buildWaveUnits(nextWave, faction, stats, flags));
    setSelectedUnitId(null);
    setBattleLog((prev) => [
      `【第 ${wave} 波敵軍反撲】解放軍強登 ${
        newlyFallen.length > 0 ? newlyFallen.join('、') + ' 淪為淪陷區！' : '受阻於我方防線！'
      } 對岸未壓制據點防禦回補！`,
      ...prev,
    ]);
  };

  const freeCount = counties.length - occupiedCounties.size;
  const fujianLibRatio = Math.min(1, (xiamenProg + fuzhouProg) / 200);
  const guangdongLibRatio = Math.min(1, guangzhouProg / 100);

  const xmPt = mapGeo.targetPoints.find((t) => t.id === 'xiamen')?.pt ?? [230, 260];
  const fzPt = mapGeo.targetPoints.find((t) => t.id === 'fuzhou')?.pt ?? [255, 225];
  const gzPt = mapGeo.targetPoints.find((t) => t.id === 'guangzhou')?.pt ?? [140, 300];

  const isGuoguangVictory = resolvedOutcome === 15 || guoguangComplete;
  const isTaiwanLost = resolvedOutcome === 17;

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 p-4 lg:p-6">
      <div className="mx-auto max-w-[1380px] border border-red-800/80 bg-[#0D131F]">
        {/* War Alert Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-red-900/70 bg-[#260D12] px-5 py-3">
          <div>
            <div className="font-mono-bbs text-xs font-bold text-red-300">
              緊急戰時體制 // 第 {wave} / {MAX_WAVES} 波台海攻防與國光反攻戰
            </div>
            <h1 className="text-xl font-black text-white sm:text-2xl">
              {isGuoguangVictory
                ? '★ 國光計畫大捷！中國大陸全境已光復為青天白日藍！'
                : resolvedOutcome === 16
                  ? '★ 香港再光成功！維多利亞港重現青天白日！'
                  : resolvedOutcome === 17
                    ? '▲ 台北失守！進入〈中華人民共和國台灣省〉結局'
                    : '中共渡海攻台戰爭爆發！運用有限軍需 AP 光復淪陷區或反攻大陸！'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono-bbs text-xs">
            <span className="border border-amber-500/60 bg-[#1B160B] px-2.5 py-1 text-amber-300 font-bold">
              軍需 AP：{ap}
            </span>
            <span className="text-blue-300 font-bold">自由台灣：{freeCount}</span>
            <span className="text-red-400 font-bold">淪陷區：{occupiedCounties.size}/12</span>
            {resolvedOutcome ? (
              <button
                type="button"
                onClick={() => onResolveWar(resolvedOutcome, Array.from(occupiedCounties))}
                className="bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
              >
                進入歷史結局結算 →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEndWave}
                className="bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
              >
                {wave >= MAX_WAVES ? '結束最終波（結算戰果）→' : `結束第 ${wave} 波（敵軍反撲）`}
              </button>
            )}
          </div>
        </div>

        {/* Main Drag-and-Drop Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Interactive Drag Map */}
          <div className="lg:col-span-8 border-b border-[#243044] lg:border-b-0 lg:border-r bg-[#07101E] relative">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block h-auto w-full select-none">
              <defs>
                <clipPath id="warChinaClip">
                  {mapGeo.chinaPathStrings.map((d, idx) => (
                    <path key={idx} d={d} />
                  ))}
                </clipPath>
                <radialGradient id="fujianBlueGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.95" />
                  <stop offset="65%" stopColor="#2563EB" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="guangdongBlueGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.95" />
                  <stop offset="65%" stopColor="#2563EB" stopOpacity="0.72" />
                  <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Base Neighboring Polygons (HK, Macao, Japan, Neutral Philippines/Korea/Vietnam, China base) */}
              {mapGeo.eaPaths.map((ea) => {
                const isHk = ea.name === 'Hong Kong';
                const isChina = ea.name === 'China';
                const isMacao = ea.name === 'Macao';
                const isJapan = ea.name === 'Japan';
                const isNeutral =
                  ea.name === 'Philippines' ||
                  ea.name === 'South Korea' ||
                  ea.name === 'North Korea' ||
                  ea.name === 'Vietnam';

                let fill = '#1E293B';
                let stroke = '#475569';
                if (isChina) {
                  fill = isGuoguangVictory ? '#1D4ED8' : '#3B1117';
                  stroke = isGuoguangVictory ? '#FACC15' : '#991B1B';
                } else if (isHk) {
                  fill = hkProg >= 100 || isGuoguangVictory ? '#2563EB' : '#9F1239';
                  stroke = hkProg >= 100 || isGuoguangVictory ? '#FACC15' : '#FB7185';
                } else if (isMacao) {
                  fill = isGuoguangVictory ? '#2563EB' : '#6B212E';
                  stroke = isGuoguangVictory ? '#FACC15' : '#FB7185';
                } else if (isJapan) {
                  fill = stats.japanPosture >= 60 ? '#132B3E' : '#182430';
                  stroke = '#38BDF8';
                } else if (isNeutral) {
                  fill = '#1C262B';
                  stroke = '#4B636E';
                }

                return (
                  <path
                    key={ea.id}
                    d={ea.d}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isHk ? 1.5 : isChina && isGuoguangVictory ? 1.3 : 0.8}
                  />
                );
              })}

              {/* Dynamic Mainland China Liberation Color Waves clipped cleanly to China coastline! */}
              {!isGuoguangVictory && (
                <g clipPath="url(#warChinaClip)">
                  {fujianLibRatio > 0 && (
                    <circle
                      cx={(xmPt[0] + fzPt[0]) / 2}
                      cy={(xmPt[1] + fzPt[1]) / 2}
                      r={24 + fujianLibRatio * 150}
                      fill="url(#fujianBlueGrad)"
                    />
                  )}
                  {guangdongLibRatio > 0 && (
                    <circle
                      cx={gzPt[0]}
                      cy={gzPt[1]}
                      r={22 + guangdongLibRatio * 145}
                      fill="url(#guangdongBlueGrad)"
                    />
                  )}
                </g>
              )}

              {/* China Outline Highlight when Guoguang progresses or succeeds */}
              {isGuoguangVictory &&
                mapGeo.chinaPathStrings.map((d, idx) => (
                  <path
                    key={`win-${idx}`}
                    d={d}
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth={1.4}
                    pointerEvents="none"
                  />
                ))}

              {/* Neutral Countries & Geopolitical Map Labels */}
              {mapGeo.luzonPt[1] < SVG_H - 12 && (
                <text
                  x={mapGeo.luzonPt[0]}
                  y={mapGeo.luzonPt[1]}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  菲律賓（中立國）
                </text>
              )}
              {mapGeo.koreaPt[1] > 10 && (
                <text
                  x={mapGeo.koreaPt[0]}
                  y={mapGeo.koreaPt[1]}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  南韓（中立）
                </text>
              )}
              {mapGeo.vietnamPt[0] > 8 && (
                <text
                  x={Math.max(36, mapGeo.vietnamPt[0])}
                  y={mapGeo.vietnamPt[1]}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  越南（中立）
                </text>
              )}
              <text
                x={Math.min(SVG_W - 60, mapGeo.okinawaPt[0])}
                y={mapGeo.okinawaPt[1] - 6}
                textAnchor="middle"
                fill="#7DD3FC"
                fontSize="9.5"
                fontWeight="700"
              >
                美日沖繩（態度 {stats.japanPosture}%）
              </text>

              {/* Diaoyu Islands Marker */}
              <g transform={`translate(${mapGeo.diaoyuPt[0]}, ${mapGeo.diaoyuPt[1]})`}>
                <polygon points="0,-5 5,0 0,5 -5,0" fill="#FACC15" stroke="#090D16" strokeWidth="1" />
                <text x="8" y="3" fill="#FDE68A" fontSize="9.5" fontWeight="700">
                  釣魚島
                </text>
              </g>

              {/* Mainland Theater Label */}
              <g transform="translate(18, 22)">
                <rect
                  width="225"
                  height="38"
                  fill={isGuoguangVictory ? '#0F2557' : '#1E0D12'}
                  fillOpacity="0.92"
                  stroke={isGuoguangVictory ? '#FACC15' : '#991B1B'}
                />
                <text
                  x="10"
                  y="16"
                  fill={isGuoguangVictory ? '#93C5FD' : '#FCA5A5'}
                  fontSize="11"
                  fontWeight="800"
                >
                  {isGuoguangVictory
                    ? '中華民國大陸光復區（全境變藍！）'
                    : '中國大陸戰場（隨反攻進度轉藍）'}
                </text>
                <text x="10" y="31" fill="#CBD5E1" fontSize="9.5" className="font-mono-bbs">
                  {isGuoguangVictory
                    ? '國光計畫 100% 完成 · 青天白日重返大陸'
                    : `閩戰區 ${Math.round(fujianLibRatio * 100)}% · 粵戰區 ${Math.round(guangdongLibRatio * 100)}%`}
                </text>
              </g>

              {/* 22 Taiwan Counties (Drop Targets for Defense / Liberation) */}
              {mapGeo.twPaths.map((tp) => {
                const isOccupied = isTaiwanLost || occupiedCounties.has(tp.id);
                const isFortified = fortifiedCounties.has(tp.id);
                const isDragHover = hoverTargetId === tp.id;

                return (
                  <path
                    key={tp.id}
                    d={tp.d}
                    fill={
                      isOccupied
                        ? '#DC2626'
                        : isFortified
                          ? '#1D4ED8'
                          : '#2563EB'
                    }
                    fillOpacity={isDragHover ? 1 : 0.9}
                    stroke={isDragHover ? '#FACC15' : isOccupied ? '#FCA5A5' : '#0B1220'}
                    strokeWidth={isDragHover ? 2.4 : isOccupied ? 1.1 : 0.7}
                    className="cursor-pointer transition-opacity"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverTargetId(tp.id);
                    }}
                    onDragLeave={() => setHoverTargetId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverTargetId(null);
                      const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                      const unit = handUnits.find((u) => u.id === uid);
                      if (unit) deployUnitToCounty(tp.id, unit);
                    }}
                    onClick={() => {
                      if (activeUnit) deployUnitToCounty(tp.id, activeUnit);
                    }}
                  >
                    <title>
                      {`${tp.id}（${isOccupied ? '淪陷區 — 拖曳守軍光復' : isFortified ? '已固守' : '自由地區'}）`}
                    </title>
                  </path>
                );
              })}

              {/* Mainland & Hong Kong Guoguang Landing Drop Targets */}
              {mapGeo.targetPoints.map((tp) => {
                const isHover = hoverTargetId === tp.id;
                const done = tp.progress >= 100;
                const locked = tp.id === 'hongkong' && !hkUnlocked;
                const labelYOffset = tp.id === 'hongkong' ? 28 : 19;

                return (
                  <g
                    key={tp.id}
                    className="cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverTargetId(tp.id);
                    }}
                    onDragLeave={() => setHoverTargetId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverTargetId(null);
                      const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                      const unit = handUnits.find((u) => u.id === uid);
                      if (unit) deployUnitToMainland(tp.id, unit);
                    }}
                    onClick={() => {
                      if (activeUnit) deployUnitToMainland(tp.id, activeUnit);
                    }}
                  >
                    <circle
                      cx={tp.pt[0]}
                      cy={tp.pt[1]}
                      r={isHover ? 18 : 14}
                      fill={done ? '#2563EB' : locked ? '#1F2937' : '#450A0A'}
                      fillOpacity={0.92}
                      stroke={done || isHover ? '#FACC15' : locked ? '#94A3B8' : '#F87171'}
                      strokeWidth={isHover ? 2.5 : 1.5}
                      strokeDasharray={done ? undefined : '4 2'}
                    />
                    <text
                      x={tp.pt[0]}
                      y={tp.pt[1] + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontWeight="800"
                      className="font-mono-bbs pointer-events-none"
                    >
                      {locked ? '封鎖' : `${tp.progress}%`}
                    </text>
                    <rect
                      x={tp.pt[0] - 58}
                      y={tp.pt[1] + labelYOffset}
                      width="116"
                      height="18"
                      fill="#090D16"
                      fillOpacity="0.92"
                      stroke={done ? '#3B82F6' : locked ? '#475569' : '#7F1D1D'}
                    />
                    <text
                      x={tp.pt[0]}
                      y={tp.pt[1] + labelYOffset + 12}
                      textAnchor="middle"
                      fill={done ? '#93C5FD' : locked ? '#CBD5E1' : '#FCA5A5'}
                      fontSize="9"
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      {tp.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right: Draggable Unit Cards & Tactical Objectives */}
          <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-[#0D131F]">
            <div>
              <div className="border-b border-[#243044] pb-2.5">
                <h2 className="text-sm font-bold text-amber-300">
                  拖曳兵力卡至地圖（每波限用 {getWaveApBudget(stats)} AP）
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  <strong className="text-blue-300">國光大捷條件：</strong>
                  守住台北且淪陷區 ≤ 7，並將「廈門＋福州＋廣州」全推至 100%（大陸全境變藍）！
                  <br />
                  <strong className="text-cyan-300">香港再光條件：</strong>
                  須先攻克「廣州 ≥ 60%」或「廈門 ≥ 80% 且美日態度 ≥ 65%」破除粵海封鎖線，方可登陸香港推滿 100%！
                </p>
              </div>

              {/* Draggable Cards */}
              <div className="mt-3 space-y-2">
                {resolvedOutcome ? (
                  <div className="border border-blue-500 bg-[#102347] p-4 text-center">
                    <div className="text-sm font-black text-white">戰局已定！</div>
                    <p className="mt-1 text-xs text-slate-200">
                      請點擊右上角「進入歷史結局結算 →」觀看最終報紙頭條。
                    </p>
                  </div>
                ) : handUnits.length === 0 || ap === 0 ? (
                  <div className="border border-[#243044] bg-[#101622] p-4 text-center text-xs text-slate-300">
                    {ap === 0 ? '本波軍需 AP 已耗盡！' : '本波兵力已全數部署！'}
                    請點擊右上角紅色按鈕進入下一波！
                  </div>
                ) : (
                  handUnits.map((unit) => {
                    const isSel = selectedUnitId === unit.id;
                    const cantAfford = ap < unit.apCost;
                    return (
                      <div
                        key={unit.id}
                        draggable={!cantAfford}
                        onDragStart={(e) => {
                          if (cantAfford) return;
                          e.dataTransfer.setData('text/plain', unit.id);
                          setDraggingUnitId(unit.id);
                          setSelectedUnitId(unit.id);
                        }}
                        onDragEnd={() => setDraggingUnitId(null)}
                        onClick={() => {
                          if (!cantAfford) {
                            setSelectedUnitId((prev) => (prev === unit.id ? null : unit.id));
                          }
                        }}
                        className={`border p-2.5 transition-colors select-none ${
                          cantAfford
                            ? 'border-[#1E293B] bg-[#0B0F18] opacity-45 cursor-not-allowed'
                            : isSel
                              ? 'border-amber-400 bg-[#1B2740] cursor-grab active:cursor-grabbing'
                              : 'border-[#2C3A52] bg-[#101622] hover:border-blue-500 cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{unit.name}</span>
                          <span className="font-mono-bbs text-[11px] font-bold text-amber-300">
                            {unit.apCost} AP ·{' '}
                            {unit.role === 'DEFENSE'
                              ? '守備光復'
                              : unit.role === 'OFFENSE'
                                ? '跨海登陸'
                                : '全能支援'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300">{unit.desc}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Occupied Counties Quick Status */}
              <div className="mt-3.5 border-t border-[#243044] pt-2.5">
                <div className="text-xs font-bold text-rose-300">
                  目前淪陷區縣市（點擊或拖兵至此收復，≥12 即淪陷）：
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Array.from(occupiedCounties).map((cid) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => {
                        if (activeUnit) deployUnitToCounty(cid, activeUnit);
                      }}
                      className={`border px-2 py-1 text-xs font-medium cursor-pointer ${
                        cid === '台北市'
                          ? 'border-red-500 bg-red-900 text-white'
                          : 'border-red-700 bg-red-950/70 text-red-200 hover:border-amber-400'
                      }`}
                    >
                      {cid}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* War Log */}
            <div className="mt-3.5 border-t border-[#243044] pt-2.5">
              <div className="font-mono-bbs text-xs text-slate-400">戰情室即時通報</div>
              <div className="bbs-scroll mt-1.5 max-h-32 overflow-y-auto space-y-1.5 font-mono-bbs text-xs text-slate-200">
                {battleLog.map((line, i) => (
                  <div key={i} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
