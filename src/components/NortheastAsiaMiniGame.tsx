import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import neaGeoRaw from '../data/neaGeo.json';
import { CampaignStats, FactionLeader } from '../types/game';
import { bbsAudio } from '../utils/sound';

interface NeaFeatureProps {
  name: string;
  name_zh: string;
}

type NeaUnitRole = 'FRONTIER' | 'MANCHURIA' | 'KOREA' | 'NAVAL_ALLY' | 'INFOWAR';

interface NeaWarUnit {
  id: string;
  name: string;
  role: NeaUnitRole;
  apCost: number;
  frontierGain: number;
  manchuriaGain: number;
  koreaGain: number;
  supplyCut: number;
  desc: string;
}

type NeaTargetId =
  | 'outer_mongolia'
  | 'tannu_uriankhai'
  | 'amur_north'
  | 'ussuri_east'
  | 'sakhalin'
  | 'pyongyang'
  | 'wonsan'
  | 'seoul_line';

interface NeaTarget {
  id: NeaTargetId;
  featureName: string;
  name: string;
  subLabel: string;
  theater: 'SAIBEI' | 'WAIDONGBEI' | 'KOREA_OFFENSE' | 'KOREA_DEFENSE';
  progress: number;
  offsetX?: number;
  offsetY?: number;
}

export interface NortheastAsiaMiniGameProps {
  faction: FactionLeader;
  stats: CampaignStats;
  flags: string[];
  allowContinueCampaign: boolean;
  onResolveNeaWar: (
    endingId: 31 | 32 | 33,
    postWarAction: 'ENDING' | 'CONTINUE_CAMPAIGN',
    meta: {
      koreaUnified: boolean;
      saibeiRecovered: boolean;
      waidongbeiRecovered: boolean;
    }
  ) => void;
}

const MAX_WAVES = 5;

function clamp(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

function getNeaWaveAp(hasUsJpKrPact: boolean, alliedMorale: number, koreaUnified: boolean): number {
  let base = 4;
  if (hasUsJpKrPact) base += 1;
  if (alliedMorale >= 85) base += 1;
  if (koreaUnified) base += 1;
  return base;
}

function buildNeaUnits(
  wave: number,
  faction: FactionLeader,
  stats: CampaignStats,
  hasUsJpKrPact: boolean
): NeaWarUnit[] {
  const units: NeaWarUnit[] = [
    {
      id: `nea-w${wave}-suiyuan`,
      name: '國軍綏遠裝甲騎兵旅',
      role: 'FRONTIER',
      apCost: 1,
      frontierGain: 52,
      manchuriaGain: 28,
      koreaGain: 22,
      supplyCut: 0,
      desc: '耗 1 AP｜漠北長途奔襲！外蒙古／唐努烏梁海 +52%',
    },
    {
      id: `nea-w${wave}-ne-corps`,
      name: '國軍東北機械化第 1 軍團',
      role: 'MANCHURIA',
      apCost: 2,
      frontierGain: 34,
      manchuriaGain: 52,
      koreaGain: 42,
      supplyCut: 0,
      desc: '耗 2 AP｜強渡黑龍江＆鴨綠江！外東北三地 +52%（平壤/元山 +42%）',
    },
    {
      id: `nea-w${wave}-rok`,
      name: '大韓民國・白虎裝甲師團',
      role: 'KOREA',
      apCost: 1,
      frontierGain: 15,
      manchuriaGain: 28,
      koreaGain: 54,
      supplyCut: 0,
      desc: '耗 1 AP｜韓戰主力！固守首爾三十八度線 +35% 或猛攻平壤/元山 +54%',
    },
    {
      id: `nea-w${wave}-infowar`,
      name: '資通電軍＆東北亞心戰旅',
      role: 'INFOWAR',
      apCost: 1,
      frontierGain: 24,
      manchuriaGain: 24,
      koreaGain: 24,
      supplyCut: 16,
      desc: '耗 1 AP｜全戰區心戰：重創北方敵軍士氣 -18%、切斷補給 -16%、全線推進 +24%',
    },
    {
      id: `nea-w${wave}-rocaf`,
      name: '空軍瀋陽＆長春戰術聯隊',
      role: 'MANCHURIA',
      apCost: 1,
      frontierGain: 34,
      manchuriaGain: 36,
      koreaGain: 34,
      supplyCut: 10,
      desc: '耗 1 AP｜制空突擊外興安嶺／海參崴／漠北 +34–36%',
    },
  ];

  if (hasUsJpKrPact || stats.japanPosture >= 52) {
    units.push({
      id: `nea-w${wave}-us7`,
      name: '美國海軍第 7 艦隊（日本海戰鬥群）',
      role: 'NAVAL_ALLY',
      apCost: 1,
      frontierGain: 22,
      manchuriaGain: 48,
      koreaGain: 50,
      supplyCut: 28,
      desc: '耗 1 AP｜海空制壓庫頁島／海參崴／元山 +48–50%，並切斷敵補給 -28%',
    });
    units.push({
      id: `nea-w${wave}-sasebo`,
      name: '日本海上自衛隊・佐世保＆舞鶴艦隊',
      role: 'NAVAL_ALLY',
      apCost: 1,
      frontierGain: 16,
      manchuriaGain: 44,
      koreaGain: 42,
      supplyCut: 24,
      desc: '耗 1 AP｜北上宗谷海峽！專攻庫頁島／海參崴／元山 +44% ＆ 協助首爾防空',
    });
  }

  if (faction.id === 'chiang' || faction.id === 'ma') {
    units.push({
      id: `nea-w${wave}-special`,
      name: faction.id === 'chiang' ? '國府先總統紀念裝甲禁衛旅' : '馬氏東北亞握手特遣旅',
      role: 'MANCHURIA',
      apCost: 1,
      frontierGain: 46,
      manchuriaGain: 48,
      koreaGain: 48,
      supplyCut: 15,
      desc: '耗 1 AP｜派系彩蛋王牌！漠北／外東北／北韓全目標 +48%',
    });
  }

  return units.slice(0, 7);
}

export function NortheastAsiaMiniGame({
  faction,
  stats,
  flags,
  allowContinueCampaign,
  onResolveNeaWar,
}: NortheastAsiaMiniGameProps) {
  const hasUsJpKrPact =
    flags.includes('us_jp_kr_pact') ||
    flags.includes('diaoyu_transferred') ||
    flags.includes('pro_japan_security') ||
    stats.japanPosture >= 60;

  const alreadyHasSaibei = flags.includes('saibei_recovered');

  const [wave, setWave] = useState<number>(1);
  const [alliedMorale, setAlliedMorale] = useState<number>(hasUsJpKrPact ? 84 : 74);
  const [enemyMorale, setEnemyMorale] = useState<number>(hasUsJpKrPact ? 76 : 85);
  const [enemySupply, setEnemySupply] = useState<number>(hasUsJpKrPact ? 85 : 100);
  const [seoulStability, setSeoulStability] = useState<number>(85);
  const [ap, setAp] = useState<number>(() =>
    getNeaWaveAp(hasUsJpKrPact, hasUsJpKrPact ? 84 : 74, false)
  );

  const [targets, setTargets] = useState<NeaTarget[]>(() => [
    {
      id: 'outer_mongolia',
      featureName: 'OuterMongolia',
      name: '漠北（外蒙古・庫倫）',
      subLabel: '塞北選區',
      theater: 'SAIBEI',
      progress: alreadyHasSaibei ? 100 : 0,
      offsetX: 16,
      offsetY: 4,
    },
    {
      id: 'tannu_uriankhai',
      featureName: 'TannuUriankhai',
      name: '圖瓦共和國(烏梁海)',
      subLabel: '塞北選區・圖瓦',
      theater: 'SAIBEI',
      progress: alreadyHasSaibei ? 100 : 0,
      offsetX: -14,
      offsetY: -18,
    },
    {
      id: 'amur_north',
      featureName: 'QingAmurNorth',
      name: '外興安嶺・黑龍江北岸',
      subLabel: '清代外東北（江東六十四屯）',
      theater: 'WAIDONGBEI',
      progress: 0,
      offsetX: 0,
      offsetY: -10,
    },
    {
      id: 'ussuri_east',
      featureName: 'QingUssuriEast',
      name: '烏蘇里江東岸・海參崴',
      subLabel: '清代外東北（永明城・伯力）',
      theater: 'WAIDONGBEI',
      progress: 0,
      offsetX: -18,
      offsetY: 16,
    },
    {
      id: 'sakhalin',
      featureName: 'QingSakhalin',
      name: '庫頁島（苦兀）',
      subLabel: '清代外東北・宗谷北疆',
      theater: 'WAIDONGBEI',
      progress: 0,
      offsetX: 0,
      offsetY: 0,
    },
    {
      id: 'pyongyang',
      featureName: 'NorthKorea',
      name: '平壤防線',
      subLabel: '北韓西翼・助韓統一',
      theater: 'KOREA_OFFENSE',
      progress: 0,
      offsetX: -24,
      offsetY: -12,
    },
    {
      id: 'wonsan',
      featureName: 'NorthKorea',
      name: '元山・咸興登陸區',
      subLabel: '北韓東岸・助韓統一',
      theater: 'KOREA_OFFENSE',
      progress: 0,
      offsetX: 28,
      offsetY: 10,
    },
    {
      id: 'seoul_line',
      featureName: 'SouthKorea',
      name: '首爾＆三十八度線',
      subLabel: '第二次韓戰防衛樞紐',
      theater: 'KOREA_DEFENSE',
      progress: 85,
      offsetX: -6,
      offsetY: 22,
    },
  ]);

  const [handUnits, setHandUnits] = useState<NeaWarUnit[]>(() =>
    buildNeaUnits(1, faction, stats, hasUsJpKrPact)
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [resolvedEnding, setResolvedEnding] = useState<31 | 32 | 33 | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([
    '【第二次韓戰暨北疆大戰爆發！】還都南京後北疆生變！三十八度線全面開火，可選擇：① 專注防禦簽署「維持現狀」停火；② 奪回「漠北＆唐努烏梁海」；③ 聯手美日韓助韓軍統一朝鮮半島，並收回清代「黑龍江北岸・海參崴・庫頁島」外東北故土！',
  ]);

  const SVG_W = 720;
  const SVG_H = 540;

  const neaGeo = useMemo(() => {
    const collection = neaGeoRaw as unknown as FeatureCollection<Geometry, NeaFeatureProps>;
    const projection = geoMercator().fitExtent(
      [
        [20, 22],
        [SVG_W - 20, SVG_H - 22],
      ],
      collection
    );
    const pathGen = geoPath().projection(projection);

    const featurePaths = collection.features.map((f, idx) => {
      const centroid = pathGen.centroid(f);
      return {
        id: `nea-${f.properties.name}-${idx}`,
        name: f.properties.name,
        nameZh: f.properties.name_zh,
        d: pathGen(f) ?? '',
        centroid: [Number.isFinite(centroid[0]) ? centroid[0] : 360, Number.isFinite(centroid[1]) ? centroid[1] : 270] as [number, number],
      };
    });

    const centroidMap = new Map<string, [number, number]>();
    for (const fp of featurePaths) {
      centroidMap.set(fp.name, fp.centroid);
    }

    const mappedTargets = targets.map((t) => {
      const basePt = centroidMap.get(t.featureName) ?? [360, 270];
      return {
        ...t,
        pt: [basePt[0] + (t.offsetX ?? 0), basePt[1] + (t.offsetY ?? 0)] as [number, number],
      };
    });

    return { featurePaths, mappedTargets };
  }, [targets]);

  const getProg = (id: NeaTargetId) => targets.find((t) => t.id === id)?.progress ?? 0;

  const saibeiRecovered =
    getProg('outer_mongolia') >= 100 && getProg('tannu_uriankhai') >= 100;
  const waidongbeiRecovered =
    getProg('amur_north') >= 100 &&
    getProg('ussuri_east') >= 100 &&
    getProg('sakhalin') >= 100;
  const koreaUnified = getProg('pyongyang') >= 100 && getProg('wonsan') >= 100;

  const activeUnit =
    handUnits.find((u) => u.id === (draggingUnitId ?? selectedUnitId)) ?? null;

  const offenseMult =
    (alliedMorale >= 80 ? 1.2 : 1.0) * (enemyMorale <= 38 ? 1.2 : 1.0);

  const checkInstantOutcome = (nextTargets: NeaTarget[]): 32 | 33 | null => {
    const p = (id: NeaTargetId) => nextTargets.find((t) => t.id === id)?.progress ?? 0;
    if (p('amur_north') >= 100 && p('ussuri_east') >= 100 && p('sakhalin') >= 100) {
      return 33;
    }
    return null;
  };

  const launchGlobalInfoWar = (unit: NeaWarUnit) => {
    if (resolvedEnding) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      return;
    }

    const nextEnemyMorale = clamp(enemyMorale - 18);
    const nextEnemySupply = Math.max(0, enemySupply - unit.supplyCut);
    const nextAlliedMorale = clamp(alliedMorale + 6);
    const nextTargets = targets.map((t) => {
      if (t.theater === 'KOREA_DEFENSE' || t.progress >= 100) return t;
      return { ...t, progress: Math.min(100, t.progress + 24) };
    });

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setEnemyMorale(nextEnemyMorale);
    setEnemySupply(nextEnemySupply);
    setAlliedMorale(nextAlliedMorale);
    setTargets(nextTargets);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      `📡 【東北亞心戰網攻大捷】敵方北方防線通訊癱瘓，士氣暴跌 → ${nextEnemyMorale}%、補給 → ${nextEnemySupply}%、全線推進 +24%！`,
      ...prev,
    ]);

    const instant = checkInstantOutcome(nextTargets);
    if (instant) {
      bbsAudio.playElectionFanfare(true);
      setResolvedEnding(instant);
    }
  };

  const deployUnitToTarget = (targetId: NeaTargetId, unit: NeaWarUnit) => {
    if (resolvedEnding) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [`【AP 不足】「${unit.name}」需 ${unit.apCost} AP！`, ...prev]);
      return;
    }

    const target = targets.find((t) => t.id === targetId)!;

    if (target.theater === 'KOREA_DEFENSE') {
      const nextSeoul = Math.min(100, seoulStability + 35);
      const nextTargets = targets.map((t) =>
        t.id === 'seoul_line' ? { ...t, progress: nextSeoul } : t
      );
      bbsAudio.playPushChime(true);
      setAp((p) => p - unit.apCost);
      setSeoulStability(nextSeoul);
      setTargets(nextTargets);
      setAlliedMorale((m) => clamp(m + 6));
      setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
      setSelectedUnitId(null);
      setDraggingUnitId(null);
      setBattleLog((prev) => [
        `🛡 【首爾＆三十八度線固守】${unit.name} 馳援南韓防線，穩定度升至 ${nextSeoul}%！（國軍＆韓軍士氣 +6）`,
        ...prev,
      ]);
      return;
    }

    const baseGain =
      target.theater === 'SAIBEI'
        ? unit.frontierGain
        : target.theater === 'WAIDONGBEI'
          ? unit.manchuriaGain
          : unit.koreaGain;

    const koreaBonusMult =
      target.theater === 'WAIDONGBEI' && koreaUnified ? 1.25 : 1.0;
    const gain = Math.round(baseGain * offenseMult * koreaBonusMult);

    const nextTargets = targets.map((t) =>
      t.id === targetId ? { ...t, progress: Math.min(100, t.progress + gain) } : t
    );

    const updatedTarget = nextTargets.find((t) => t.id === targetId)!;
    const reached = updatedTarget.progress >= 100;

    const nextEnemyMorale = clamp(enemyMorale - (reached ? 14 : 6));
    const nextEnemySupply = Math.max(0, enemySupply - unit.supplyCut);
    const nextAlliedMorale = clamp(alliedMorale + (reached ? 8 : 3));

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setTargets(nextTargets);
    setEnemyMorale(nextEnemyMorale);
    setEnemySupply(nextEnemySupply);
    setAlliedMorale(nextAlliedMorale);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);

    const p = (id: NeaTargetId) => nextTargets.find((t) => t.id === id)?.progress ?? 0;
    const justUnifiedKorea =
      (targetId === 'pyongyang' || targetId === 'wonsan') &&
      p('pyongyang') >= 100 &&
      p('wonsan') >= 100 &&
      !koreaUnified;

    setBattleLog((prev) => [
      justUnifiedKorea
        ? `★ 【大韓民國統一朝鮮半島！】${unit.name} 攻克「${updatedTarget.name}」，北韓防線徹底瓦解！美日韓聯軍士氣大振，對清代外東北攻勢全面 +25%！`
        : reached
          ? `★ 【光復故土】${unit.name} 收復「${updatedTarget.name}」達 100%！青天白日藍旗升起！`
          : `【北疆進軍】${unit.name} 推進「${updatedTarget.name}」+${gain}%（目前 ${updatedTarget.progress}%）`,
      ...prev,
    ]);

    const instant = checkInstantOutcome(nextTargets);
    if (instant) {
      bbsAudio.playElectionFanfare(true);
      setResolvedEnding(instant);
    }
  };

  const handleEndWave = () => {
    if (resolvedEnding) return;

    // North Korean / Northern counterattack pressure
    const seoulDrop = koreaUnified ? 0 : enemySupply <= 45 ? 10 : 18;
    const nextSeoul = Math.max(20, seoulStability - seoulDrop);
    const nextTargets = targets.map((t) => {
      if (t.id === 'seoul_line') return { ...t, progress: nextSeoul };
      if (t.progress > 0 && t.progress < 100 && enemyMorale > 36 && enemySupply > 45) {
        return { ...t, progress: Math.max(0, t.progress - 6) };
      }
      return t;
    });

    setSeoulStability(nextSeoul);
    setTargets(nextTargets);

    if (wave >= MAX_WAVES) {
      const p = (id: NeaTargetId) => nextTargets.find((t) => t.id === id)?.progress ?? 0;
      if (p('amur_north') >= 100 && p('ussuri_east') >= 100 && p('sakhalin') >= 100) {
        bbsAudio.playElectionFanfare(true);
        setResolvedEnding(33);
      } else if (p('outer_mongolia') >= 100 && p('tannu_uriankhai') >= 100) {
        bbsAudio.playElectionFanfare(true);
        setResolvedEnding(32);
      } else {
        bbsAudio.playPushChime(true);
        setResolvedEnding(31);
      }
      return;
    }

    const nextWave = wave + 1;
    bbsAudio.playAlertSiren();
    setWave(nextWave);
    setAp(getNeaWaveAp(hasUsJpKrPact, alliedMorale, koreaUnified));
    setHandUnits(buildNeaUnits(nextWave, faction, stats, hasUsJpKrPact));
    setSelectedUnitId(null);
    setBattleLog((prev) => [
      koreaUnified
        ? `【第 ${wave} 波結算】朝鮮半島已統一，韓軍全力協防外東北！進入第 ${nextWave} 波。`
        : `【第 ${wave} 波結算】北韓對三十八度線發動砲擊（首爾防線穩定度 → ${nextSeoul}%），請注意援韓與北伐節奏！`,
      ...prev,
    ]);
  };

  const handleCeasefireStatusQuo = () => {
    if (resolvedEnding) return;
    bbsAudio.playPushChime(true);
    if (waidongbeiRecovered) {
      setResolvedEnding(33);
    } else if (saibeiRecovered) {
      setResolvedEnding(32);
    } else {
      setResolvedEnding(31);
    }
  };

  const infoWarUnitInHand = handUnits.find((u) => u.role === 'INFOWAR') ?? null;

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 p-3 lg:p-5">
      <div className="mx-auto max-w-[1420px] border border-blue-800/80 bg-[#0D131F]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/70 bg-[#0E1B33] px-5 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono-bbs text-xs font-bold text-cyan-300">
              <span>東北亞戰區 // 第 {wave} / {MAX_WAVES} 波・第二次韓戰＆北疆決戰</span>
              {hasUsJpKrPact && (
                <span className="border border-cyan-400/70 bg-cyan-950/80 px-2 py-0.5 text-cyan-200">
                  美第7艦隊＋佐世保海自＋南韓白虎師聯軍出動
                </span>
              )}
              {koreaUnified && (
                <span className="border border-amber-400 bg-blue-900/80 px-2 py-0.5 text-amber-200">
                  ★ 大韓民國已統一朝鮮半島 (+1 AP / 攻外東北 +25%)
                </span>
              )}
            </div>
            <h1 className="mt-0.5 text-lg font-black text-white sm:text-xl">
              {resolvedEnding === 33
                ? '★ 結局33達成：收回清代外東北（黑龍江北岸・海參崴・庫頁島）'
                : resolvedEnding === 32
                  ? '★ 結局32達成：奪回漠北外蒙古＆唐努烏梁海！秋海棠全圓！'
                  : resolvedEnding === 31
                    ? '★ 結局31達成：東北亞維持現狀停火！穩守三十八度線與長城北疆'
                    : '支援南韓統一半島、奪回漠北外蒙古，或收回清代外東北三省故土！'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono-bbs text-xs tabular-nums">
            <span className="border border-amber-500/60 bg-[#1B160B] px-2.5 py-1 text-amber-300 font-bold">
              軍需 AP：{ap}
            </span>
            <span className="border border-cyan-500/50 bg-[#0B1829] px-2.5 py-1 text-cyan-300 font-bold">
              首爾防線：{koreaUnified ? '已統一 100%' : `${seoulStability}%`}
            </span>

            {resolvedEnding ? (
              <div className="flex flex-wrap items-center gap-2">
                {allowContinueCampaign && (
                  <button
                    type="button"
                    onClick={() =>
                      onResolveNeaWar(resolvedEnding, 'CONTINUE_CAMPAIGN', {
                        koreaUnified,
                        saibeiRecovered,
                        waidongbeiRecovered,
                      })
                    }
                    className="bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    帶著北疆新選區續戰 2028 大選 →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onResolveNeaWar(resolvedEnding, 'ENDING', {
                      koreaUnified,
                      saibeiRecovered,
                      waidongbeiRecovered,
                    })
                  }
                  className="bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                >
                  進入東北亞歷史結局結算 →
                </button>
              </div>
            ) : (
              <>
                {saibeiRecovered && !waidongbeiRecovered && (
                  <button
                    type="button"
                    onClick={() => {
                      bbsAudio.playElectionFanfare(true);
                      setResolvedEnding(32);
                    }}
                    className="bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                  >
                    見好就收：宣佈奪回漠北（結局32）
                  </button>
                )}
                {wave >= 2 && !saibeiRecovered && !waidongbeiRecovered && (
                  <button
                    type="button"
                    onClick={handleCeasefireStatusQuo}
                    className="border border-slate-500 bg-[#152033] px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400 cursor-pointer"
                  >
                    簽署停火：維持現狀（結局31）
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleEndWave}
                  className="bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 cursor-pointer"
                >
                  {wave >= MAX_WAVES ? '結束最終波（結算戰果）→' : `結束第 ${wave} 波（敵軍反撲）`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Morale Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-[#243044] bg-[#0B101A] px-5 py-2.5 font-mono-bbs text-xs">
          <div>
            <div className="flex justify-between text-blue-300 font-bold">
              <span>★ 中美日韓聯軍士氣：{alliedMorale}%</span>
              <span>{koreaUnified ? '韓國統一加成中' : '聯防作戰中'}</span>
            </div>
            <div className="mt-1 h-2 w-full bg-[#151E30] border border-[#243044]">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${alliedMorale}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-rose-300 font-bold">
              <span>▲ 北韓＆北方殘餘防線士氣：{enemyMorale}%</span>
              <span>補給線：{enemySupply}%</span>
            </div>
            <div className="mt-1 h-2 w-full bg-[#1F1218] border border-[#3B1D26]">
              <div className="h-full bg-red-600 transition-all" style={{ width: `${enemyMorale}%` }} />
            </div>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Real Northeast Asia & Qing Outer Manchuria SVG Map */}
          <div className="lg:col-span-8 border-b border-[#243044] lg:border-b-0 lg:border-r bg-[#07101E]">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="block h-auto w-full select-none"
              role="img"
              aria-label="東北亞決戰地圖：中華民國東北華北、漠北外蒙古、唐努烏梁海、清代外東北、南北韓與日本"
            >
              <defs>
                <pattern id="neaSeaGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#132238" strokeWidth="0.7" />
                </pattern>
              </defs>

              <rect width={SVG_W} height={SVG_H} fill="url(#neaSeaGrid)" />

              {/* Polygons from neaGeo.json */}
              {neaGeo.featurePaths.map((fp) => {
                let fill = '#1C262B';
                let stroke = '#4B636E';
                let glow = false;
                let glowColor = '#93C5FD';

                if (fp.name === 'SiberiaContext') {
                  fill = '#111923';
                  stroke = '#273549';
                } else if (fp.name === 'China') {
                  fill = '#1D4ED8';
                  stroke = '#FACC15';
                } else if (fp.name === 'OuterMongolia') {
                  const done = getProg('outer_mongolia') >= 100;
                  fill = done ? '#1D4ED8' : '#2C1822';
                  stroke = done ? '#FACC15' : '#A855F7';
                  glow = done;
                } else if (fp.name === 'TannuUriankhai') {
                  const done = getProg('tannu_uriankhai') >= 100;
                  fill = done ? '#0284C7' : '#5B21B6';
                  stroke = done ? '#FACC15' : '#E879F9';
                  glow = true;
                  glowColor = done ? '#38BDF8' : '#C084FC';
                } else if (fp.name === 'QingAmurNorth') {
                  const done = getProg('amur_north') >= 100;
                  fill = done ? '#1D4ED8' : '#3B1117';
                  stroke = done ? '#FACC15' : '#F87171';
                  glow = done;
                } else if (fp.name === 'QingUssuriEast') {
                  const done = getProg('ussuri_east') >= 100;
                  fill = done ? '#1D4ED8' : '#3B1117';
                  stroke = done ? '#FACC15' : '#F87171';
                  glow = done;
                } else if (fp.name === 'QingSakhalin') {
                  const done = getProg('sakhalin') >= 100;
                  fill = done ? '#1D4ED8' : '#3B1117';
                  stroke = done ? '#FACC15' : '#F87171';
                  glow = done;
                } else if (fp.name === 'NorthKorea') {
                  fill = koreaUnified ? '#2563EB' : '#6B121B';
                  stroke = koreaUnified ? '#FACC15' : '#FB7185';
                  glow = koreaUnified;
                } else if (fp.name === 'SouthKorea') {
                  fill = koreaUnified ? '#2563EB' : '#0E3A66';
                  stroke = koreaUnified ? '#FACC15' : '#38BDF8';
                  glow = koreaUnified;
                } else if (fp.name === 'Japan') {
                  fill = hasUsJpKrPact ? '#132B3E' : '#182330';
                  stroke = hasUsJpKrPact ? '#38BDF8' : '#3E556B';
                }

                return (
                  <g key={fp.id}>
                    {glow && (
                      <path
                        d={fp.d}
                        fill="none"
                        stroke={glowColor}
                        strokeWidth={5}
                        strokeOpacity={0.38}
                        pointerEvents="none"
                      />
                    )}
                    <path
                      d={fp.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={
                        fp.name === 'TannuUriankhai' || fp.name === 'China' || glow ? 1.45 : 0.85
                      }
                      opacity={fp.name === 'SiberiaContext' ? 0.78 : 0.94}
                    >
                      <title>{fp.nameZh}</title>
                    </path>
                  </g>
                );
              })}

              {/* Explicit Tuva Republic Map Callout Badge */}
              {(() => {
                const tuvaPoly = neaGeo.featurePaths.find((fp) => fp.name === 'TannuUriankhai');
                if (!tuvaPoly) return null;
                const tuvaDone = getProg('tannu_uriankhai') >= 100;
                return (
                  <g className="pointer-events-none">
                    <text
                      x={tuvaPoly.centroid[0]}
                      y={tuvaPoly.centroid[1] + 3}
                      textAnchor="middle"
                      fill={tuvaDone ? '#FEF08A' : '#F5D0FE'}
                      fontSize="9"
                      fontWeight="800"
                    >
                      圖瓦共和國
                    </text>
                  </g>
                );
              })()}

              {/* Top-left Legend / Status Box */}
              <g transform="translate(14, 12)">
                <rect width="276" height="48" fill="#0A1426" fillOpacity="0.93" stroke="#3B82F6" />
                <text x="10" y="18" fill="#93C5FD" fontSize="10.5" fontWeight="800">
                  清代歷史疆域版圖 · 東北亞＆第二次韓戰
                </text>
                <text x="10" y="36" fill="#CBD5E1" fontSize="9.5" className="font-mono-bbs">
                  {`漠北${saibeiRecovered ? '★全圓' : '待收'} · 外東北${waidongbeiRecovered ? '★全收' : '待收'} · 半島${koreaUnified ? '★統一' : '交戰中'}`}
                </text>
              </g>

              {/* US-JP Navy Presence on Sea of Japan */}
              <g transform="translate(560, 412)">
                <rect width="142" height="32" fill="#0B1B2E" fillOpacity="0.92" stroke="#38BDF8" strokeWidth="0.9" />
                <text x="71" y="13" textAnchor="middle" fill="#7DD3FC" fontSize="9.5" fontWeight="700">
                  日本海・佐世保＆第7艦隊
                </text>
                <text x="71" y="25" textAnchor="middle" fill="#CBD5E1" fontSize="8.5" className="font-mono-bbs">
                  {hasUsJpKrPact ? '美日韓聯防支援中' : '日韓美海域巡弋中'}
                </text>
              </g>

              {/* Interactive Target Circles */}
              {neaGeo.mappedTargets.map((tp) => {
                const isHover = hoverTargetId === tp.id;
                const done = tp.theater !== 'KOREA_DEFENSE' && tp.progress >= 100;
                const isDefense = tp.theater === 'KOREA_DEFENSE';

                const fillCircle = isDefense
                  ? koreaUnified
                    ? '#2563EB'
                    : seoulStability >= 60
                      ? '#0284C7'
                      : '#D97706'
                  : done
                    ? '#2563EB'
                    : tp.theater === 'SAIBEI'
                      ? '#4C1D95'
                      : '#450A0A';

                const strokeCircle = isHover
                  ? '#FACC15'
                  : done || koreaUnified
                    ? '#FACC15'
                    : isDefense
                      ? '#38BDF8'
                      : '#F87171';

                const boxW = 104;
                const boxH = 18;
                const boxX = Math.max(8, Math.min(SVG_W - boxW - 8, tp.pt[0] - boxW / 2));
                const boxY = Math.min(SVG_H - boxH - 6, tp.pt[1] + 15);

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
                      if (unit) deployUnitToTarget(tp.id, unit);
                    }}
                    onClick={() => {
                      if (activeUnit) deployUnitToTarget(tp.id, activeUnit);
                    }}
                  >
                    <circle
                      cx={tp.pt[0]}
                      cy={tp.pt[1]}
                      r={isHover ? 15 : 12.5}
                      fill={fillCircle}
                      fillOpacity={0.95}
                      stroke={strokeCircle}
                      strokeWidth={isHover ? 2.4 : 1.4}
                      strokeDasharray={done || isDefense ? undefined : '3 2'}
                    />
                    <text
                      x={tp.pt[0]}
                      y={tp.pt[1] + 3}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="800"
                      className="font-mono-bbs pointer-events-none"
                    >
                      {isDefense
                        ? koreaUnified
                          ? '統一'
                          : `${seoulStability}%`
                        : done
                          ? '100%'
                          : `${tp.progress}%`}
                    </text>

                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill="#090D16"
                      fillOpacity="0.93"
                      stroke={done ? '#3B82F6' : isDefense ? '#0284C7' : '#7F1D1D'}
                    />
                    <text
                      x={boxX + boxW / 2}
                      y={boxY + 12}
                      textAnchor="middle"
                      fill={done ? '#93C5FD' : isDefense ? '#7DD3FC' : '#FCA5A5'}
                      fontSize="8.5"
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

          {/* Right: Unit Cards & Ending Matrix */}
          <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-[#0D131F]">
            <div>
              <div className="border-b border-[#243044] pb-2">
                <h2 className="text-sm font-bold text-amber-300">
                  點選或拖曳兵力至東北亞目標（剩餘 {ap} AP）
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  <strong className="text-cyan-300">韓戰統一線：</strong>
                  攻克「平壤＋元山」助大韓民國統一半島，不僅解除首爾壓力，更令外東北全線攻勢 +25%！
                  <br />
                  <strong className="text-blue-300">三種歷史結局：</strong>
                  全收「外蒙古＋唐努烏梁海」得<strong>結局32</strong>；全收清代「黑龍江北岸＋海參崴＋庫頁島」得<strong>結局33</strong>；亦可簽署停火得<strong>結局31 維持現狀</strong>！
                </p>

                {!resolvedEnding && infoWarUnitInHand && (
                  <button
                    type="button"
                    disabled={ap < infoWarUnitInHand.apCost}
                    onClick={() => launchGlobalInfoWar(infoWarUnitInHand)}
                    className={`mt-2 w-full border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                      ap >= infoWarUnitInHand.apCost
                        ? 'border-cyan-400 bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900'
                        : 'border-[#1E293B] bg-[#0B0F18] text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    📡 發動東北亞全網心戰（耗 1 AP · 敵軍士氣 -18% / 全目標 +24%）
                  </button>
                )}
              </div>

              <div className="mt-2.5 space-y-1.5">
                {resolvedEnding ? (
                  <div className="border border-blue-500 bg-[#102347] p-4 text-center">
                    <div className="text-sm font-black text-white">東北亞大局已定！</div>
                    <p className="mt-1 text-xs text-slate-200">
                      請點擊上方綠色按鈕帶著新選區續戰 2028，或直接進入結局結算！
                    </p>
                  </div>
                ) : handUnits.length === 0 || ap === 0 ? (
                  <div className="border border-[#243044] bg-[#101622] p-4 text-center text-xs text-slate-300">
                    {ap === 0 ? '本波軍需 AP 已耗盡！' : '本波兵力已全數部署！'}
                    請點擊右上角紅色按鈕進入下一波，或選擇簽署維持現狀停火！
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
                        className={`border p-2 transition-colors select-none ${
                          cantAfford
                            ? 'border-[#1E293B] bg-[#0B0F18] opacity-45 cursor-not-allowed'
                            : isSel
                              ? 'border-amber-400 bg-[#1B2740] cursor-grab active:cursor-grabbing'
                              : 'border-[#2C3A52] bg-[#101622] hover:border-blue-500 cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white">{unit.name}</span>
                          <span className="font-mono-bbs text-[11px] font-bold text-amber-300 tabular-nums">
                            {unit.apCost} AP
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300">{unit.desc}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 border-t border-[#243044] pt-2">
              <div className="font-mono-bbs text-xs text-slate-400">東北亞聯軍戰情通報</div>
              <div className="bbs-scroll mt-1 max-h-36 overflow-y-auto space-y-1 font-mono-bbs text-[11px] text-slate-200">
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
