import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import taiwanTopologyRaw from 'taiwan-atlas/counties-10t.json';
import eastAsiaGeoRaw from '../data/eastAsiaGeo.json';
import { ALL_CHINA_PROVINCES, CHINA_PROVINCE_THEATERS, ChinaProvinceId } from '../data/chinaProvinces';
import { CampaignStats, CountyState, FactionLeader } from '../types/game';
import { bbsAudio } from '../utils/sound';
import { ChinaTheaterFlag } from './ChinaTheaterFlags';

interface TaiwanCountyProps {
  COUNTYID: string;
  COUNTYCODE: string;
  COUNTYNAME: string;
  COUNTYENG: string;
}

type UnitRole = 'DEFENSE' | 'OFFENSE' | 'HYBRID' | 'NAVAL' | 'NAVAL_ALLY' | 'INFOWAR';

interface WarUnit {
  id: string;
  name: string;
  role: UnitRole;
  apCost: number;
  taiwanAction: boolean;
  navalAction: boolean;
  infoAction: boolean;
  mainlandGain: number;
  hkGain: number;
  supplyCut: number;
  desc: string;
}

type TargetId =
  | 'minnan'
  | 'minbei'
  | 'guangzhou'
  | 'shanghai'
  | 'nanjing'
  | 'hongkong'
  | 'yongxing'
  | 'meiji';

type SeaLaneId = 'strait_line' | 'miyako_sasebo' | 'scs_lane';
type RocScsOutpostId = 'dongsha' | 'taiping';
type LabelAlign = 'left' | 'right' | 'top' | 'bottom';

interface MainlandTarget {
  id: TargetId;
  name: string;
  coords: [number, number];
  progress: number;
  labelAlign: LabelAlign;
  isScs?: boolean;
}

interface SeaLaneNode {
  id: SeaLaneId;
  name: string;
  shortName: string;
  coords: [number, number];
  blockaded: boolean;
  supplyReduction: number;
}

interface StraitWarMiniGameProps {
  faction: FactionLeader;
  counties: CountyState[];
  stats: CampaignStats;
  flags: string[];
  allowContinueCampaign: boolean;
  onResolveWar: (
    endingId: 15 | 16 | 17 | 18,
    finalOccupied: string[],
    postWarAction: 'ENDING' | 'CONTINUE_CAMPAIGN',
    capturedProvinces: ChinaProvinceId[],
    capturedHk: boolean
  ) => void;
}

const MAX_WAVES = 6;
const TAIWAN_FALL_THRESHOLD = 15;

const HARD_INITIAL_OCCUPIED = new Set<string>([
  '金門縣',
  '連江縣',
  '澎湖縣',
  '花蓮縣',
  '屏東縣',
]);

const AIDED_INITIAL_OCCUPIED = new Set<string>([
  '金門縣',
  '連江縣',
  '澎湖縣',
]);

const INVASION_ORDER = [
  '台東縣',
  '嘉義縣',
  '雲林縣',
  '彰化縣',
  '南投縣',
  '苗栗縣',
  '嘉義市',
  '新竹縣',
  '宜蘭縣',
  '基隆市',
  '台南市',
  '高雄市',
  '桃園市',
  '台中市',
  '新竹市',
  '新北市',
  '台北市',
];

function clampMorale(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

function getWaveApBudget(
  stats: CampaignStats,
  hasUsJpKrPact: boolean,
  rocMorale: number
): number {
  let base = 4;
  if (stats.funds >= 70 && stats.unity >= 55) base = 5;
  else if (stats.funds <= 30) base = 3;
  return base + (hasUsJpKrPact ? 1 : 0) + (rocMorale >= 88 ? 1 : 0);
}

function buildWaveUnits(
  wave: number,
  faction: FactionLeader,
  stats: CampaignStats,
  flags: string[],
  hasUsJpKrPact: boolean
): WarUnit[] {
  const hkBonus = flags.includes('hk_restoration') ? 10 : 0;
  const transferDiscount = flags.includes('diaoyu_transferred') ? 1 : 0;
  const infoBonus = flags.includes('info_war_ready') ? 6 : 0;

  const units: WarUnit[] = [
    {
      id: `w${wave}-armor`,
      name: '國軍裝甲 584 旅',
      role: 'DEFENSE',
      apCost: 1,
      taiwanAction: true,
      navalAction: false,
      infoAction: false,
      mainlandGain: 0,
      hkGain: 0,
      supplyCut: 0,
      desc: '耗 1 AP｜光復台灣「淪陷區」、固守東沙/太平島（國軍士氣 +6）',
    },
    {
      id: `w${wave}-infowar`,
      name: '資通電軍＆PTT脆對共信息戰隊',
      role: 'INFOWAR',
      apCost: 1,
      taiwanAction: false,
      navalAction: false,
      infoAction: true,
      mainlandGain: 16 + infoBonus,
      hkGain: 18 + infoBonus,
      supplyCut: 12,
      desc: `耗 1 AP｜對共信息戰：重創共軍士氣 -${16 + infoBonus}%、切斷補給 -12%、洗爆對岸防線 +${16 + infoBonus}%`,
    },
    {
      id: `w${wave}-roc-navy`,
      name: '國軍紀德＆海鯤潛艦隊',
      role: 'NAVAL',
      apCost: 1,
      taiwanAction: false,
      navalAction: true,
      infoAction: false,
      mainlandGain: 32,
      hkGain: 26,
      supplyCut: 28,
      desc: '耗 1 AP｜部署三海線「遏制中共補給 -28%」或突擊閩南/永興/美濟礁',
    },
    {
      id: `w${wave}-marines`,
      name: '國光兩棲登陸師',
      role: 'OFFENSE',
      apCost: 2,
      taiwanAction: false,
      navalAction: false,
      infoAction: false,
      mainlandGain: 48,
      hkGain: 36,
      supplyCut: 0,
      desc: '耗 2 AP｜強攻閩南/閩北/廣東/上海＋浙江/南京戰區 +48%',
    },
    {
      id: `w${wave}-hf3`,
      name: '雄風三型機動飛彈旅',
      role: 'HYBRID',
      apCost: 1,
      taiwanAction: true,
      navalAction: false,
      infoAction: false,
      mainlandGain: 30,
      hkGain: 25,
      supplyCut: 0,
      desc: '耗 1 AP｜光復台島縣市，或精準打擊對岸各省／南京戰區／南海島礁',
    },
    {
      id: `w${wave}-hk`,
      name: '港台自由突擊先鋒',
      role: 'OFFENSE',
      apCost: 2,
      taiwanAction: false,
      navalAction: false,
      infoAction: false,
      mainlandGain: 32,
      hkGain: 44 + hkBonus,
      supplyCut: 0,
      desc: `耗 2 AP｜突破封鎖後專攻香港 +${44 + hkBonus}%（各省戰區 +32%）`,
    },
  ];

  if (hasUsJpKrPact || stats.japanPosture >= 55) {
    units.push({
      id: `w${wave}-us7`,
      name: '美國海軍第 7 艦隊打擊群',
      role: 'NAVAL_ALLY',
      apCost: Math.max(1, 2 - transferDiscount),
      taiwanAction: true,
      navalAction: true,
      infoAction: false,
      mainlandGain: 50,
      hkGain: 44,
      supplyCut: 36,
      desc: `耗 ${Math.max(1, 2 - transferDiscount)} AP｜截斷海線 -36% 補給、各省 +50%（重創共軍士氣）`,
    });
  }

  if (hasUsJpKrPact || stats.japanPosture >= 50) {
    units.push({
      id: `w${wave}-sasebo`,
      name: '日本海自・佐世保護衛艦群',
      role: 'NAVAL_ALLY',
      apCost: 1,
      taiwanAction: true,
      navalAction: true,
      infoAction: false,
      mainlandGain: 38,
      hkGain: 30,
      supplyCut: 30,
      desc: '耗 1 AP｜東海/台海護航截斷 -30% 補給、猛攻上海＋浙江/南京/閩北 +38%',
    });
  }

  if (hasUsJpKrPact) {
    units.push({
      id: `w${wave}-kr-aegis`,
      name: '南韓海軍・世宗大王神盾艦群',
      role: 'NAVAL_ALLY',
      apCost: 1,
      taiwanAction: true,
      navalAction: true,
      infoAction: false,
      mainlandGain: 36,
      hkGain: 28,
      supplyCut: 28,
      desc: '耗 1 AP｜美日韓共防出動！封鎖東海線 -28% 或遠距壓制南京戰區/上海 +36%',
    });
  }

  if (faction.id === 'ma' && wave % 2 === 1) {
    units.push({
      id: `w${wave}-grip`,
      name: '馬氏死亡之握因果旅',
      role: 'HYBRID',
      apCost: 1,
      taiwanAction: true,
      navalAction: true,
      infoAction: true,
      mainlandGain: 54,
      hkGain: 46,
      supplyCut: 32,
      desc: '耗 1 AP｜馬英九專屬！全戰場因果律打擊 +54%（共軍士氣暴跌）',
    });
  }

  return units.slice(0, 7);
}

export function StraitWarMiniGame({
  faction,
  stats,
  flags,
  allowContinueCampaign,
  onResolveWar,
}: StraitWarMiniGameProps) {
  const hasDiaoyuTransfer = flags.includes('diaoyu_transferred');
  const hasUsJpKrPact =
    flags.includes('us_jp_kr_pact') ||
    hasDiaoyuTransfer ||
    flags.includes('pro_japan_security') ||
    stats.japanPosture >= 65;
  const hasScsBonus = flags.includes('scs_reinforced');
  const hasInfoWarBonus = flags.includes('info_war_ready');

  const initialRocMorale = clampMorale(
    (stats.unity >= 65 ? 74 : 66) + (hasUsJpKrPact ? 8 : 0)
  );
  const initialCcpMorale = clampMorale(
    (hasUsJpKrPact ? 76 : 86) - (hasInfoWarBonus ? 8 : 0)
  );

  const [wave, setWave] = useState<number>(1);
  const [rocMorale, setRocMorale] = useState<number>(initialRocMorale);
  const [ccpMorale, setCcpMorale] = useState<number>(initialCcpMorale);
  const [ap, setAp] = useState<number>(() =>
    getWaveApBudget(stats, hasUsJpKrPact, initialRocMorale)
  );
  const [occupiedCounties, setOccupiedCounties] = useState<Set<string>>(
    () => new Set(hasUsJpKrPact ? AIDED_INITIAL_OCCUPIED : HARD_INITIAL_OCCUPIED)
  );
  const [fortifiedCounties, setFortifiedCounties] = useState<Set<string>>(
    () => new Set([faction.homeCounty])
  );
  const [rocScsStatus, setRocScsStatus] = useState<
    Record<RocScsOutpostId, 'SECURE' | 'FORTIFIED'>
  >({
    dongsha: hasScsBonus ? 'FORTIFIED' : 'SECURE',
    taiping: hasScsBonus ? 'FORTIFIED' : 'SECURE',
  });
  const [ccpSupply, setCcpSupply] = useState<number>(() =>
    hasDiaoyuTransfer ? 76 : hasScsBonus ? 88 : 100
  );
  const [infoWarHits, setInfoWarHits] = useState<number>(hasInfoWarBonus ? 1 : 0);

  // Carefully positioned sea lanes so ZERO overlap with Taiwan (especially Hsinchu/Miaoli!)
  const [seaLanes, setSeaLanes] = useState<SeaLaneNode[]>([
    {
      id: 'strait_line',
      name: '台海封鎖線',
      shortName: '台海線',
      coords: [118.1, 22.15],
      blockaded: false,
      supplyReduction: 28,
    },
    {
      id: 'miyako_sasebo',
      name: '東海・日韓線',
      shortName: '東海線',
      coords: [124.9, 28.0],
      blockaded: false,
      supplyReduction: 28,
    },
    {
      id: 'scs_lane',
      name: '南海航道截斷',
      shortName: '南海線',
      coords: [114.6, 18.85],
      blockaded: false,
      supplyReduction: 26,
    },
  ]);

  const [hitThisWave, setHitThisWave] = useState<Set<TargetId>>(() => new Set());
  const [targets, setTargets] = useState<MainlandTarget[]>([
    {
      id: 'minnan',
      name: '閩南(廈漳泉)',
      coords: [117.75, 24.48],
      progress: flags.includes('guoguang_restarted') ? 25 : 0,
      labelAlign: 'left',
    },
    {
      id: 'minbei',
      name: '閩北(福州)',
      coords: [118.85, 26.25],
      progress: flags.includes('guoguang_restarted') ? 20 : 0,
      labelAlign: 'left',
    },
    {
      id: 'guangzhou',
      name: '廣東(廣深湛)',
      coords: [113.26, 23.13],
      progress: 0,
      labelAlign: 'top',
    },
    {
      id: 'shanghai',
      name: '上海＋浙江',
      coords: [120.85, 29.85],
      progress: 0,
      labelAlign: 'right',
    },
    {
      id: 'nanjing',
      name: '南京戰區',
      coords: [118.79, 32.06],
      progress: 0,
      labelAlign: 'left',
    },
    {
      id: 'hongkong',
      name: '香港維多利亞港',
      coords: [114.25, 22.25],
      progress: 0,
      labelAlign: 'bottom',
    },
    {
      id: 'yongxing',
      name: '中共・西沙永興島',
      coords: [112.34, 16.83],
      progress: 0,
      labelAlign: 'right',
      isScs: true,
    },
    {
      id: 'meiji',
      name: '中共・南沙美濟礁',
      coords: [115.53, 9.9],
      progress: 0,
      labelAlign: 'right',
      isScs: true,
    },
  ]);

  const [handUnits, setHandUnits] = useState<WarUnit[]>(() =>
    buildWaveUnits(1, faction, stats, flags, hasUsJpKrPact)
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [hoverTargetId, setHoverTargetId] = useState<string | null>(null);
  const [resolvedOutcome, setResolvedOutcome] = useState<15 | 16 | 17 | 18 | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>(() => [
    hasUsJpKrPact
      ? '【美日韓共防協定生效】美第7艦隊、佐世保海自與南韓世宗大王神盾艦同步驰援！可運用海軍斷補與「對共信息戰」瓦解敵軍士氣，光復真實省界戰區！'
      : '【台海防衛＆反攻戰】善用海軍封鎖三海線與「對共信息戰」打垮共軍士氣，守住台灣本島並反攻閩南、閩北、廣東、上海＋浙江與南京戰區！',
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
      .center([118.2, 24.6])
      .scale(1320)
      .translate([345, 296]);
    const pathGen = geoPath().projection(projection);

    // South China Sea interactive corner inset placed cleanly in bottom-right ocean (X=504..708, Y=382..528)
    const scsProjection = geoMercator()
      .center([112.4, 12.6])
      .scale(540)
      .translate([604, 464]);
    const scsPathGen = geoPath().projection(scsProjection);
    const scsLandPaths = eastAsiaFeatures
      .filter((f) =>
        [
          'China',
          'Vietnam',
          'Laos',
          'Cambodia',
          'Thailand',
          'Malaysia',
          'Indonesia',
          'Brunei',
          'Singapore',
          'Philippines',
        ].includes(f.properties?.name ?? '')
      )
      .map((f, idx) => ({
        id: `war-scs-${idx}`,
        name: f.properties?.name ?? '',
        d: scsPathGen(f) ?? '',
      }));

    const eaPaths = eastAsiaFeatures.map((f, idx) => ({
      id: `${f.properties?.name ?? 'ea'}-${idx}`,
      name: f.properties?.name ?? '',
      d: pathGen(f) ?? '',
    }));

    const chinaPaths = eaPaths.filter((p) => p.name === 'China').map((p) => p.d);
    const allChinaProvincePaths = ALL_CHINA_PROVINCES.map((f, idx) => ({
      id: `war-all-prov-${f.properties.name}-${idx}`,
      name: f.properties.name,
      d: pathGen(f) ?? '',
    }));
    const provincePaths = CHINA_PROVINCE_THEATERS.map((prov) => ({
      ...prov,
      paths: prov.features.map((f) => pathGen(f) ?? '').filter(Boolean),
    }));

    return {
      eaPaths,
      chinaPaths,
      allChinaProvincePaths,
      provincePaths,
      twPaths: taiwanFeatures.map((f) => ({
        id: f.properties.COUNTYNAME,
        d: pathGen(f) ?? '',
      })),
      mainTargets: targets
        .filter((t) => !t.isScs)
        .map((t) => ({
          ...t,
          pt: projection(t.coords) ?? [200, 200],
        })),
      scsTargets: targets
        .filter((t) => t.isScs)
        .map((t) => ({
          ...t,
          pt: scsProjection(t.coords) ?? [585, 440],
        })),
      scsLandPaths,
      dongshaPt: projection([116.73, 20.7]) ?? [311, 392],
      taipingInsetPt: scsProjection([114.36, 10.37]) ?? [616, 504],
      seaLanePts: seaLanes.map((s) => ({
        ...s,
        pt: projection(s.coords) ?? [360, 280],
      })),
      diaoyuPt: projection([123.475, 25.745]) ?? [467, 267],
      koreaPt: projection([127.2, 35.6]) ?? [555, 25],
      vietnamPt: projection([106.8, 19.6]) ?? [82, 420],
      okinawaPt: projection([127.68, 26.21]) ?? [565, 256],
      chinaFlagPt: projection([112.2, 27.6]) ?? [208, 220],
    };
  }, [eastAsiaFeatures, taiwanFeatures, targets, seaLanes]);

  const getProg = (id: TargetId) => targets.find((t) => t.id === id)?.progress ?? 0;
  const minnanProg = getProg('minnan');
  const minbeiProg = getProg('minbei');
  const guangzhouProg = getProg('guangzhou');
  const shanghaiProg = getProg('shanghai');
  const nanjingProg = getProg('nanjing');
  const hkProg = getProg('hongkong');

  const nanjingUnlocked = shanghaiProg >= 50 || ccpMorale <= 55 || infoWarHits >= 2;
  const hkUnlocked =
    guangzhouProg >= 55 || ccpSupply <= 45 || (minnanProg >= 75 && hasUsJpKrPact);

  const provinceProgressMap: Record<ChinaProvinceId, number> = {
    minnan: minnanProg,
    minbei: minbeiProg,
    guangdong: guangzhouProg,
    shanghai_zhejiang: shanghaiProg,
    nanjing: nanjingProg,
  };

  const guoguangComplete =
    minnanProg >= 100 &&
    minbeiProg >= 100 &&
    guangzhouProg >= 100 &&
    shanghaiProg >= 100 &&
    (nanjingProg >= 100 || ccpMorale <= 15);

  const activeUnit =
    handUnits.find((u) => u.id === (draggingUnitId ?? selectedUnitId)) ?? null;

  const offenseMultiplier =
    (rocMorale >= 80 ? 1.25 : rocMorale <= 35 ? 0.8 : 1.0) *
    (ccpMorale <= 35 ? 1.2 : 1.0);

  const evaluateOutcome = (
    nextOccupied: Set<string>,
    nextTargets: MainlandTarget[],
    nextCcpMorale: number
  ): 15 | 16 | 17 | null => {
    const taipeiFallen = nextOccupied.has('台北市');
    if (taipeiFallen || nextOccupied.size >= TAIWAN_FALL_THRESHOLD) return 17;

    const p = (id: TargetId) => nextTargets.find((t) => t.id === id)?.progress ?? 0;
    const mainlandTotal =
      p('minnan') + p('minbei') + p('guangzhou') + p('shanghai') + p('nanjing');
    const ggReady =
      (p('minnan') >= 100 &&
        p('minbei') >= 100 &&
        p('guangzhou') >= 100 &&
        p('shanghai') >= 100 &&
        (p('nanjing') >= 100 || nextCcpMorale <= 15)) ||
      (nextCcpMorale <= 0 && mainlandTotal >= 200);

    if (ggReady && nextOccupied.size <= 8) return 15;
    if (p('hongkong') >= 100 && nextOccupied.size <= 8) return 16;
    return null;
  };

  const launchGlobalInfoWar = (unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】發動對共信息戰需 ${unit.apCost} AP（剩餘 ${ap} AP）！`,
        ...prev,
      ]);
      return;
    }

    const moraleDrop = hasInfoWarBonus ? 22 : 16;
    const waveBoost = hasInfoWarBonus ? 22 : 16;
    const nextCcpMorale = clampMorale(ccpMorale - moraleDrop);
    const nextRocMorale = clampMorale(rocMorale + 6);
    const nextSupply = Math.max(0, ccpSupply - 12);

    const nextTargets = targets.map((t) => {
      if (t.isScs || t.progress >= 100) return t;
      if (t.id === 'nanjing' && nextCcpMorale > 55 && shanghaiProg < 50) return t;
      if (t.id === 'hongkong' && !hkUnlocked) return t;
      return { ...t, progress: Math.min(100, t.progress + waveBoost) };
    });

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setInfoWarHits((h) => h + 1);
    setCcpMorale(nextCcpMorale);
    setRocMorale(nextRocMorale);
    setCcpSupply(nextSupply);
    setTargets(nextTargets);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      `📡 【對共信息戰大捷】微博與解放軍內網遭大量貪腐真相＆反戰迷因癱瘓！共軍士氣暴跌 -${moraleDrop} → ${nextCcpMorale}%、各省防線動搖 +${waveBoost}%！`,
      ...prev,
    ]);

    const outcome = evaluateOutcome(occupiedCounties, nextTargets, nextCcpMorale);
    if (outcome) {
      if (outcome === 15) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
      }
      setResolvedOutcome(outcome);
    }
  };

  const deployUnitToCounty = (countyId: string, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】「${unit.name}」需 ${unit.apCost} AP（剩餘 ${ap} AP）！`,
        ...prev,
      ]);
      return;
    }
    if (!unit.taiwanAction) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」專責海上封鎖、信息戰或跨海突擊，無法進駐台灣本島縣市！`,
        ...prev,
      ]);
      return;
    }

    const nextOccupied = new Set(occupiedCounties);
    const nextFortified = new Set(fortifiedCounties);
    let nextRocMorale = rocMorale;
    let nextCcpMorale = ccpMorale;
    let msg = '';

    if (nextOccupied.has(countyId)) {
      nextOccupied.delete(countyId);
      nextFortified.add(countyId);
      nextRocMorale = clampMorale(rocMorale + 6);
      nextCcpMorale = clampMorale(ccpMorale - 4);
      msg = `【收復淪陷區】${unit.name} 掃蕩「${countyId}」成功！國軍士氣 +6 → ${nextRocMorale}%`;
    } else {
      nextFortified.add(countyId);
      nextRocMorale = clampMorale(rocMorale + 3);
      msg = `【防線固守】${unit.name} 進駐「${countyId}」，本波免疫登陸！（國軍士氣 +3）`;
    }

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setOccupiedCounties(nextOccupied);
    setFortifiedCounties(nextFortified);
    setRocMorale(nextRocMorale);
    setCcpMorale(nextCcpMorale);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [msg, ...prev]);

    const outcome = evaluateOutcome(nextOccupied, targets, nextCcpMorale);
    if (outcome) {
      if (outcome === 15) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
      }
      setResolvedOutcome(outcome);
    }
  };

  const deployUnitToSeaLane = (laneId: SeaLaneId, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】「${unit.name}」需 ${unit.apCost} AP（剩餘 ${ap} AP）！`,
        ...prev,
      ]);
      return;
    }
    if (!unit.navalAction) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」非海軍艦隊，請派遣「海軍艦隊」部署至海上封鎖線！`,
        ...prev,
      ]);
      return;
    }

    const laneObj = seaLanes.find((s) => s.id === laneId)!;
    const nextSupply = Math.max(0, ccpSupply - unit.supplyCut);
    const nextLanes = seaLanes.map((s) =>
      s.id === laneId ? { ...s, blockaded: true } : s
    );
    const nextRocMorale = clampMorale(rocMorale + 5);
    const nextCcpMorale = clampMorale(ccpMorale - 7);

    let nextTargets = targets;
    if (unit.role === 'NAVAL_ALLY') {
      const autoHit: TargetId =
        laneId === 'miyako_sasebo'
          ? 'shanghai'
          : laneId === 'scs_lane'
            ? 'yongxing'
            : 'minnan';
      nextTargets = targets.map((t) =>
        t.id === autoHit ? { ...t, progress: Math.min(100, t.progress + 20) } : t
      );
    }

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setCcpSupply(nextSupply);
    setSeaLanes(nextLanes);
    setTargets(nextTargets);
    setRocMorale(nextRocMorale);
    setCcpMorale(nextCcpMorale);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      `【海權封鎖成功】${unit.name} 部署於「${laneObj.name}」，共軍補給降至 ${nextSupply}%、共軍士氣 -7 → ${nextCcpMorale}%！`,
      ...prev,
    ]);

    const outcome = evaluateOutcome(occupiedCounties, nextTargets, nextCcpMorale);
    if (outcome) {
      if (outcome === 15) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
      }
      setResolvedOutcome(outcome);
    }
  };

  const deployUnitToRocScs = (outpost: RocScsOutpostId, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      return;
    }
    if (!unit.taiwanAction && !unit.navalAction) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」無法進駐東沙／太平島防禦陣地！`,
        ...prev,
      ]);
      return;
    }

    const label = outpost === 'dongsha' ? '東沙群島' : '南沙太平島';
    const nextSupply = Math.max(0, ccpSupply - 12);
    const nextRocMorale = clampMorale(rocMorale + 4);
    const nextCcpMorale = clampMorale(ccpMorale - 4);
    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setRocScsStatus((prev) => ({ ...prev, [outpost]: 'FORTIFIED' }));
    setCcpSupply(nextSupply);
    setRocMorale(nextRocMorale);
    setCcpMorale(nextCcpMorale);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      `【南海聯防固守】${unit.name} 進駐「${label}」，共軍補給降至 ${nextSupply}%、國軍士氣 +4！`,
      ...prev,
    ]);
  };

  const deployUnitToMainland = (targetId: TargetId, unit: WarUnit) => {
    if (resolvedOutcome) return;
    if (ap < unit.apCost) {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `【AP 不足】「${unit.name}」需 ${unit.apCost} AP（剩餘 ${ap} AP）！`,
        ...prev,
      ]);
      return;
    }
    if (unit.role === 'DEFENSE') {
      bbsAudio.playPushChime(false);
      setBattleLog((prev) => [
        `「${unit.name}」為本土裝甲守軍，請拖曳至台灣「淪陷區」或南海東沙/太平島！`,
        ...prev,
      ]);
      return;
    }
    if (targetId === 'hongkong' && !hkUnlocked) {
      bbsAudio.playAlertSiren();
      setBattleLog((prev) => [
        '【粵海封鎖線攔截】攻佔香港需先達成：「廣東 ≥ 55%」或「中共海上補給 ≤ 45%」或「閩南 ≥ 75% 且美日韓共防」！',
        ...prev,
      ]);
      return;
    }
    if (targetId === 'nanjing' && !nanjingUnlocked) {
      bbsAudio.playAlertSiren();
      setBattleLog((prev) => [
        '【長江防線未破】突破「南京戰區」需先達成：「上海＋浙江 ≥ 50%」或「共軍士氣 ≤ 55%」或「發動兩次對共信息戰」！',
        ...prev,
      ]);
      return;
    }

    const baseGain = targetId === 'hongkong' ? unit.hkGain : unit.mainlandGain;
    const gain = Math.round(baseGain * offenseMultiplier);

    const nextTargets = targets.map((t) =>
      t.id === targetId ? { ...t, progress: Math.min(100, t.progress + gain) } : t
    );

    const nextHit = new Set(hitThisWave);
    nextHit.add(targetId);

    const targetObj = nextTargets.find((t) => t.id === targetId)!;
    const reached = targetObj.progress >= 100;

    let nextSupply = ccpSupply;
    if ((targetId === 'yongxing' || targetId === 'meiji') && reached) {
      nextSupply = Math.max(0, ccpSupply - 25);
      setCcpSupply(nextSupply);
    } else if (unit.infoAction) {
      nextSupply = Math.max(0, ccpSupply - unit.supplyCut);
      setCcpSupply(nextSupply);
      setInfoWarHits((h) => h + 1);
    }

    const rocBoost = reached ? (targetObj.isScs ? 7 : 8) : 4;
    const extraInfoMoraleDrop = unit.infoAction ? 10 : 0;
    const ccpDrop = (reached ? (targetObj.isScs ? 10 : 14) : 6) + extraInfoMoraleDrop;
    const nextRocMorale = clampMorale(rocMorale + rocBoost);
    const nextCcpMorale = clampMorale(ccpMorale - ccpDrop);

    bbsAudio.playPushChime(true);
    setAp((p) => p - unit.apCost);
    setTargets(nextTargets);
    setHitThisWave(nextHit);
    setRocMorale(nextRocMorale);
    setCcpMorale(nextCcpMorale);
    setHandUnits((prev) => prev.filter((u) => u.id !== unit.id));
    setSelectedUnitId(null);
    setDraggingUnitId(null);
    setBattleLog((prev) => [
      reached
        ? `★ 【省區光復泛藍】${unit.name} 攻克「${targetObj.name}」！真實省界已呈現青天白日藍＋內部泛光（共軍士氣 -${ccpDrop} → ${nextCcpMorale}%）`
        : `【${unit.infoAction ? '對共信息戰心戰突破' : '跨海強攻'}】${unit.name} 打擊「${targetObj.name}」+${gain}%（目前 ${targetObj.progress}%，共軍士氣 -${ccpDrop}）`,
      ...prev,
    ]);

    const outcome = evaluateOutcome(occupiedCounties, nextTargets, nextCcpMorale);
    if (outcome) {
      if (outcome === 15) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
      }
      setResolvedOutcome(outcome);
    }
  };

  const handleEndWave = () => {
    if (resolvedOutcome) return;

    // Calibrated PLA counter-offensive (challenging without naval blockade or InfoWar)
    const baseStrikes = hasUsJpKrPact ? 2 : stats.ccpTension >= 85 ? 3 : 2;
    const supplyPenalty = ccpSupply <= 35 ? 2 : ccpSupply <= 65 ? 1 : 0;
    const moralePenalty = ccpMorale <= 35 ? 1 : 0;
    const strikes =
      ccpMorale <= 0 || (ccpSupply <= 25 && ccpMorale <= 30)
        ? 0
        : Math.max(0, baseStrikes - supplyPenalty - moralePenalty);

    const nextOccupied = new Set(occupiedCounties);
    const availableToInvade = INVASION_ORDER.filter(
      (cid) => !nextOccupied.has(cid) && !fortifiedCounties.has(cid)
    );
    const newlyFallen: string[] = [];
    for (let i = 0; i < strikes && i < availableToInvade.length; i++) {
      nextOccupied.add(availableToInvade[i]);
      newlyFallen.push(availableToInvade[i]);
    }

    const canReinforce = ccpSupply > 45 && ccpMorale > 32;
    const nextTargets = targets.map((t) => {
      if (t.progress <= 0 || t.progress >= 100) return t;
      if (!canReinforce) return t;
      if (t.id === 'hongkong') {
        const gzDone = getProg('guangzhou') >= 100;
        const decay = gzDone ? 4 : 10;
        return { ...t, progress: Math.max(0, t.progress - decay) };
      }
      if (!hitThisWave.has(t.id)) {
        return { ...t, progress: Math.max(0, t.progress - 7) };
      }
      return t;
    });

    const anyBlockade = seaLanes.some((s) => s.blockaded);
    const nextSupply = anyBlockade ? ccpSupply : Math.min(100, ccpSupply + 10);

    const rocDrop = newlyFallen.length * 5;
    const rocBonus = newlyFallen.length === 0 ? 6 : 0;
    const nextRocMorale = clampMorale(rocMorale - rocDrop + rocBonus);
    const ccpSupplyDrain = nextSupply <= 45 ? 7 : 0;
    const ccpGainFromLandings = newlyFallen.length * 4;
    const nextCcpMorale = clampMorale(ccpMorale - ccpSupplyDrain + ccpGainFromLandings);

    bbsAudio.playAlertSiren();
    setOccupiedCounties(nextOccupied);
    setFortifiedCounties(new Set());
    setTargets(nextTargets);
    setHitThisWave(new Set());
    setCcpSupply(nextSupply);
    setRocMorale(nextRocMorale);
    setCcpMorale(nextCcpMorale);
    setSeaLanes((prev) => prev.map((s) => ({ ...s, blockaded: false })));

    const instant = evaluateOutcome(nextOccupied, nextTargets, nextCcpMorale);
    if (instant) {
      if (instant === 15) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
        setCcpMorale(0);
        setCcpSupply(0);
      }
      setResolvedOutcome(instant);
      return;
    }

    if (wave >= MAX_WAVES) {
      const p = (id: TargetId) => nextTargets.find((t) => t.id === id)?.progress ?? 0;
      const mainlandTotal =
        p('minnan') + p('minbei') + p('guangzhou') + p('shanghai') + p('nanjing');
      const ggReady =
        (p('minnan') >= 100 &&
          p('minbei') >= 100 &&
          p('guangzhou') >= 100 &&
          p('shanghai') >= 100 &&
          (p('nanjing') >= 100 || nextCcpMorale <= 15)) ||
        (nextCcpMorale <= 0 && mainlandTotal >= 200);
      const hk = p('hongkong');

      if (ggReady && nextOccupied.size <= 8) {
        bbsAudio.playElectionFanfare(true);
        setOccupiedCounties(new Set());
        setCcpMorale(0);
        setCcpSupply(0);
        setResolvedOutcome(15);
      } else if (hk >= 100 && nextOccupied.size <= 8) {
        setResolvedOutcome(16);
      } else if (nextOccupied.has('台北市') || nextOccupied.size >= TAIWAN_FALL_THRESHOLD) {
        setResolvedOutcome(17);
      } else {
        setResolvedOutcome(18);
      }
      return;
    }

    const nextWave = wave + 1;
    setWave(nextWave);
    setAp(getWaveApBudget(stats, hasUsJpKrPact, nextRocMorale));
    setHandUnits(buildWaveUnits(nextWave, faction, stats, flags, hasUsJpKrPact));
    setSelectedUnitId(null);
    setBattleLog((prev) => [
      `【第 ${wave} 波反撲結算】敵登陸：${
        newlyFallen.length > 0 ? newlyFallen.join('、') + ' 淪陷！' : '全面受阻零登陸！'
      }${!canReinforce ? '（共軍補給或士氣崩潰，對岸無法回防！）' : ''}`,
      ...prev,
    ]);
  };

  const taiwanTotalCount = 22;
  const isGuoguangVictory = resolvedOutcome === 15 || guoguangComplete;
  const isTaiwanLost = resolvedOutcome === 17;
  const effectiveOccupiedCount = isGuoguangVictory ? 0 : occupiedCounties.size;
  const freeCount = taiwanTotalCount - effectiveOccupiedCount;
  const displayCcpMorale = isGuoguangVictory ? 0 : ccpMorale;
  const displayCcpSupply = isGuoguangVictory ? 0 : ccpSupply;

  const getCapturedProvinceList = (): ChinaProvinceId[] => {
    if (resolvedOutcome === 15 || guoguangComplete) {
      return ['minnan', 'minbei', 'guangdong', 'shanghai_zhejiang', 'nanjing'];
    }
    const result: ChinaProvinceId[] = [];
    if (minnanProg >= 100) result.push('minnan');
    if (minbeiProg >= 100) result.push('minbei');
    if (guangzhouProg >= 100) result.push('guangdong');
    if (shanghaiProg >= 100) result.push('shanghai_zhejiang');
    if (nanjingProg >= 100) result.push('nanjing');
    return result;
  };

  const rocMoraleTag =
    rocMorale >= 80
      ? '士氣如虹(+25%攻勢)'
      : rocMorale <= 35
        ? '軍心動搖(-20%)'
        : '戰志穩健';
  const ccpMoraleTag = isGuoguangVictory
    ? '中共政權瓦解・全軍投降！'
    : ccpMorale <= 15
      ? '南京瓦解！'
      : ccpMorale <= 32
        ? '軍心潰散(無法回防)'
        : '尚可應戰';

  const infoWarUnitInHand = handUnits.find((u) => u.role === 'INFOWAR') ?? null;

  return (
    <div className="bbs-scanlines min-h-screen w-full bg-[#090C12] text-slate-100 p-3 lg:p-5">
      <div className="mx-auto max-w-[1420px] border border-red-800/80 bg-[#0D131F]">
        {/* War Alert Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-900/70 bg-[#260D12] px-5 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-mono-bbs text-xs font-bold text-red-300">
              <span>緊急戰時體制 // 第 {wave} / {MAX_WAVES} 波真實省界＆台海決戰</span>
              {hasUsJpKrPact && (
                <span className="border border-cyan-400/70 bg-cyan-950/80 px-2 py-0.5 text-cyan-300">
                  美日韓共防聯軍生效 (+1 AP / 減登陸)
                </span>
              )}
              {hasDiaoyuTransfer && (
                <span className="border border-blue-400/70 bg-blue-950/80 px-2 py-0.5 text-blue-300">
                  日本已歸還釣魚台給中華民國
                </span>
              )}
            </div>
            <h1 className="mt-0.5 text-lg font-black text-white sm:text-xl">
              {isGuoguangVictory
                ? '★ 國光計畫大捷！閩南、閩北、廣東、上海＋浙江、南京全數光復翻藍！'
                : resolvedOutcome === 16
                  ? '★ 香港再光成功！維港重現青天白日，港台選票即將大暴增！'
                  : resolvedOutcome === 17
                    ? '▲ 台北失守！進入〈中華人民共和國台灣省〉（台港同步變紅）'
                    : resolvedOutcome === 18
                      ? '★ 成功擊退共軍守住台灣與太平島！愛國選票即將大暴增！'
                      : '部署海軍截斷補給、發動對共信息戰瓦解敵軍士氣，反攻真實省界戰區！'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono-bbs text-xs tabular-nums">
            <span className="border border-amber-500/60 bg-[#1B160B] px-2.5 py-1 text-amber-300 font-bold">
              軍需 AP：{ap}
            </span>
            <span className="border border-cyan-500/50 bg-[#0B1829] px-2.5 py-1 text-cyan-300 font-bold">
              共軍補給：{displayCcpSupply}%
            </span>
            <span className="text-blue-300 font-bold">自由台島：{freeCount}</span>
            <span className="text-red-400 font-bold">
              淪陷：{effectiveOccupiedCount}/{TAIWAN_FALL_THRESHOLD}
            </span>

            {resolvedOutcome ? (
              <div className="flex flex-wrap items-center gap-2">
                {allowContinueCampaign && resolvedOutcome !== 17 && (
                  <button
                    type="button"
                    onClick={() =>
                      onResolveWar(
                        resolvedOutcome,
                        resolvedOutcome === 15 ? [] : Array.from(occupiedCounties),
                        'CONTINUE_CAMPAIGN',
                        getCapturedProvinceList(),
                        hkProg >= 100 || resolvedOutcome === 15 || resolvedOutcome === 16
                      )
                    }
                    className="bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                  >
                    帶著暴增選票＋臨時選區續戰 2028 →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onResolveWar(
                      resolvedOutcome,
                      resolvedOutcome === 15 ? [] : Array.from(occupiedCounties),
                      'ENDING',
                      getCapturedProvinceList(),
                      hkProg >= 100 || resolvedOutcome === 15 || resolvedOutcome === 16
                    )
                  }
                  className="bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 cursor-pointer"
                >
                  直接進入歷史結局結算 →
                </button>
              </div>
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

        {/* Dual-Army Morale Bar Strip (兩軍士氣系統) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-[#243044] bg-[#0B101A] px-5 py-2.5">
          <div>
            <div className="flex items-center justify-between text-xs font-mono-bbs tabular-nums">
              <span className="font-bold text-blue-300">
                ★ 國軍／美日韓聯軍士氣：{rocMorale}%
              </span>
              <span className="text-sky-200">{rocMoraleTag}</span>
            </div>
            <div className="mt-1 h-2 w-full bg-[#151E30] border border-[#243044]">
              <div
                className={`h-full transition-all ${
                  rocMorale >= 80
                    ? 'bg-cyan-400'
                    : rocMorale <= 35
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                }`}
                style={{ width: `${rocMorale}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-mono-bbs tabular-nums">
              <span className={`font-bold ${isGuoguangVictory ? 'text-blue-300' : 'text-red-400'}`}>
                {isGuoguangVictory
                  ? `★ 中共政權全面瓦解：0%`
                  : `▲ 共軍東部／南部戰區士氣：${displayCcpMorale}%`}
              </span>
              <span className={isGuoguangVictory ? 'text-blue-200' : 'text-rose-200'}>
                {ccpMoraleTag}
              </span>
            </div>
            <div className="mt-1 h-2 w-full bg-[#1F1218] border border-[#3B1D26]">
              <div
                className={`h-full transition-all ${
                  displayCcpMorale <= 32 ? 'bg-amber-600' : 'bg-red-600'
                }`}
                style={{ width: `${displayCcpMorale}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Drag-and-Drop Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Clean Non-Overlapping Interactive War Map */}
          <div className="lg:col-span-8 border-b border-[#243044] lg:border-b-0 lg:border-r bg-[#07101E] relative">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="block h-auto w-full select-none">
              <defs>
                <pattern id="warSeaGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#132238" strokeWidth="0.7" />
                </pattern>
                <clipPath id="warChinaMasterClip">
                  {mapGeo.chinaPaths.map((d, idx) => (
                    <path key={`wmc-${idx}`} d={d} />
                  ))}
                </clipPath>
                {mapGeo.provincePaths.map((prov) => (
                  <clipPath key={`w-clip-${prov.id}`} id={`war-prov-clip-${prov.id}`}>
                    {prov.paths.map((pd, i) => (
                      <path key={`${prov.id}-wcp-${i}`} d={pd} />
                    ))}
                  </clipPath>
                ))}
              </defs>

              <rect width={SVG_W} height={SVG_H} fill="url(#warSeaGrid)" />

              {/* Seamless Base Countries (Whole China + full Southeast Asia + US-JP-KR Pact!) */}
              {mapGeo.eaPaths.map((ea) => {
                const isChina = ea.name === 'China';
                const isHk = ea.name === 'Hong Kong';
                const isMacao = ea.name === 'Macao';
                const isJapan = ea.name === 'Japan';
                const isSouthKorea = ea.name === 'South Korea';
                const isSeaNeutral =
                  ea.name === 'Philippines' ||
                  ea.name === 'North Korea' ||
                  ea.name === 'Vietnam' ||
                  ea.name === 'Laos' ||
                  ea.name === 'Cambodia' ||
                  ea.name === 'Thailand' ||
                  ea.name === 'Myanmar' ||
                  ea.name === 'Malaysia' ||
                  ea.name === 'Indonesia' ||
                  ea.name === 'Brunei' ||
                  ea.name === 'Singapore';

                let fill = '#1E293B';
                let stroke = '#475569';

                if (isChina) {
                  fill = isTaiwanLost ? '#450A0A' : isGuoguangVictory ? '#1D4ED8' : '#3B1117';
                  stroke = isGuoguangVictory && !isTaiwanLost ? '#FACC15' : '#991B1B';
                } else if (isHk) {
                  fill = isTaiwanLost
                    ? '#9F1239'
                    : hkProg >= 100 || isGuoguangVictory
                      ? '#2563EB'
                      : '#9F1239';
                  stroke = isTaiwanLost
                    ? '#FB7185'
                    : hkProg >= 100 || isGuoguangVictory
                      ? '#FACC15'
                      : '#FB7185';
                } else if (isMacao) {
                  fill = isTaiwanLost ? '#6B212E' : isGuoguangVictory ? '#2563EB' : '#6B212E';
                  stroke = isTaiwanLost ? '#FB7185' : isGuoguangVictory ? '#FACC15' : '#FB7185';
                } else if (isJapan) {
                  fill = hasUsJpKrPact ? '#132B3E' : '#182430';
                  stroke = '#38BDF8';
                } else if (isSouthKorea) {
                  fill = hasUsJpKrPact ? '#132B3E' : '#1C262B';
                  stroke = hasUsJpKrPact ? '#38BDF8' : '#4B636E';
                } else if (isSeaNeutral) {
                  fill = '#1C262B';
                  stroke = '#4B636E';
                }

                return (
                  <path
                    key={ea.id}
                    d={ea.d}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isHk ? 1.5 : isChina ? 1.0 : 0.75}
                  />
                );
              })}

              {/* Real Natural Earth 10m Provincial Borders + Captured Province Internal Glow */}
              <g clipPath="url(#warChinaMasterClip)">
                {mapGeo.allChinaProvincePaths.map((cp) => (
                  <path
                    key={cp.id}
                    d={cp.d}
                    fill="none"
                    stroke={isGuoguangVictory && !isTaiwanLost ? '#60A5FA' : '#6A2732'}
                    strokeWidth="0.65"
                    strokeOpacity={isGuoguangVictory ? 0.5 : 0.8}
                    pointerEvents="none"
                  />
                ))}

                {mapGeo.provincePaths.map((prov) => {
                  const prog = provinceProgressMap[prov.id];
                  const captured = !isTaiwanLost && (isGuoguangVictory || prog >= 100);
                  const partial = !isTaiwanLost && !captured && prog >= 45;

                  if (captured) {
                    return (
                      <g key={prov.id} clipPath={`url(#war-prov-clip-${prov.id})`}>
                        {prov.paths.map((pd, i) => (
                          <g key={`${prov.id}-cap-${i}`}>
                            <path d={pd} fill="#1D4ED8" stroke="#93C5FD" strokeWidth="0.85" />
                            <path
                              d={pd}
                              fill="none"
                              stroke="#60A5FA"
                              strokeWidth="10"
                              strokeOpacity="0.36"
                            />
                            <path
                              d={pd}
                              fill="none"
                              stroke="#BAE6FD"
                              strokeWidth="2.5"
                              strokeOpacity="0.7"
                            />
                          </g>
                        ))}
                      </g>
                    );
                  }

                  if (partial) {
                    return (
                      <g key={prov.id}>
                        {prov.paths.map((pd, i) => (
                          <path
                            key={`${prov.id}-part-${i}`}
                            d={pd}
                            fill="#1E3A8A"
                            fillOpacity="0.85"
                            stroke="#60A5FA"
                            strokeWidth="0.85"
                            strokeDasharray="4 2"
                          />
                        ))}
                      </g>
                    );
                  }

                  return null;
                })}
              </g>

              {/* Outer China Coastline Highlight when Guoguang Complete */}
              {isGuoguangVictory && !isTaiwanLost &&
                mapGeo.chinaPaths.map((d, idx) => (
                  <path
                    key={`gg-outer-${idx}`}
                    d={d}
                    fill="none"
                    stroke="#FACC15"
                    strokeWidth="1.35"
                    pointerEvents="none"
                  />
                ))}

              <ChinaTheaterFlag
                x={mapGeo.chinaFlagPt[0]}
                y={mapGeo.chinaFlagPt[1]}
                width={84}
                height={56}
                liberated={isGuoguangVictory}
                taiwanFallen={isTaiwanLost}
              />

              {/* Allied / Neighbor Labels */}
              <text
                x={Math.min(SVG_W - 68, mapGeo.koreaPt[0])}
                y={Math.max(18, mapGeo.koreaPt[1])}
                textAnchor="middle"
                fill={hasUsJpKrPact ? '#7DD3FC' : '#94A3B8'}
                fontSize="9"
                fontWeight="700"
              >
                {hasUsJpKrPact ? '南韓（美日韓共防）' : '南韓（中立）'}
              </text>
              <text
                x={Math.max(58, mapGeo.vietnamPt[0])}
                y={mapGeo.vietnamPt[1]}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontWeight="600"
              >
                中南半島（中立）
              </text>
              <text
                x={Math.min(SVG_W - 76, mapGeo.okinawaPt[0] + 10)}
                y={mapGeo.okinawaPt[1] - 10}
                textAnchor="middle"
                fill="#7DD3FC"
                fontSize="9"
                fontWeight="700"
              >
                {hasUsJpKrPact ? '美日韓駐沖繩 / 佐世保' : '美日駐沖繩群島'}
              </text>

              {/* Diaoyu / Senkaku Islands */}
              <g transform={`translate(${mapGeo.diaoyuPt[0]}, ${mapGeo.diaoyuPt[1]})`}>
                <polygon
                  points="0,-5.5 5.5,0 0,5.5 -5.5,0"
                  fill={hasDiaoyuTransfer ? '#2563EB' : '#FACC15'}
                  stroke={hasDiaoyuTransfer ? '#FACC15' : '#090D16'}
                  strokeWidth="1.2"
                />
                <text
                  x="8"
                  y="3"
                  fill={hasDiaoyuTransfer ? '#93C5FD' : '#FDE68A'}
                  fontSize="9"
                  fontWeight="700"
                >
                  {hasDiaoyuTransfer ? '釣魚島(已歸還我國)' : '釣魚島'}
                </text>
              </g>

              {/* Compact Theater Summary Header Box (Top-Left, clear of Nanjing) */}
              <g transform="translate(12, 10)">
                <rect
                  width="238"
                  height="44"
                  fill={isGuoguangVictory ? '#0F2557' : '#1E0D12'}
                  fillOpacity="0.93"
                  stroke={isGuoguangVictory ? '#FACC15' : '#991B1B'}
                />
                <text
                  x="9"
                  y="16"
                  fill={isGuoguangVictory ? '#93C5FD' : '#FCA5A5'}
                  fontSize="10"
                  fontWeight="800"
                >
                  {isGuoguangVictory
                    ? '中華民國五省戰區（真實省界全境翻藍！）'
                    : '真實省界戰區 · 光復即內部泛藍'}
                </text>
                <text x="9" y="33" fill="#CBD5E1" fontSize="9" className="font-mono-bbs">
                  {isGuoguangVictory
                    ? '閩南藍 閩北藍 粵藍 滬浙藍 寧藍'
                    : `閩南${minnanProg >= 100 ? '藍' : '紅'} 閩北${minbeiProg >= 100 ? '藍' : '紅'} 粵${guangzhouProg >= 100 ? '藍' : '紅'} 滬浙${shanghaiProg >= 100 ? '藍' : '紅'} 寧${nanjingProg >= 100 ? '藍' : '紅'}`}
                </text>
              </g>

              {/* InfoWar Disruption Pill (when active) */}
              {infoWarHits > 0 && !isTaiwanLost && (
                <g transform="translate(12, 60)">
                  <rect width="194" height="22" fill="#0B1E36" fillOpacity="0.92" stroke="#38BDF8" strokeWidth="0.9" />
                  <text x="8" y="14" fill="#7DD3FC" fontSize="9" fontWeight="700" className="font-mono-bbs">
                    {`📡 對共信息戰 ×${infoWarHits}：微博癱瘓中`}
                  </text>
                </g>
              )}

              {/* 22 Taiwan Counties (100% Unobstructed — Hsinchu/Miaoli/Taichung completely clear!) */}
              {mapGeo.twPaths.map((tp) => {
                const isOccupied = isTaiwanLost || (!isGuoguangVictory && occupiedCounties.has(tp.id));
                const isFortified = fortifiedCounties.has(tp.id);
                const isDragHover = hoverTargetId === tp.id;

                return (
                  <path
                    key={tp.id}
                    d={tp.d}
                    fill={isOccupied ? '#DC2626' : isFortified ? '#1D4ED8' : '#2563EB'}
                    fillOpacity={isDragHover ? 1 : 0.92}
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

              {/* ROC Dongsha Islands (東沙群島) */}
              <g
                className="cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverTargetId('dongsha');
                }}
                onDragLeave={() => setHoverTargetId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setHoverTargetId(null);
                  const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                  const unit = handUnits.find((u) => u.id === uid);
                  if (unit) deployUnitToRocScs('dongsha', unit);
                }}
                onClick={() => {
                  if (activeUnit) deployUnitToRocScs('dongsha', activeUnit);
                }}
              >
                <polygon
                  points={`${mapGeo.dongshaPt[0]},${mapGeo.dongshaPt[1] - 7} ${mapGeo.dongshaPt[0] + 7},${mapGeo.dongshaPt[1]} ${mapGeo.dongshaPt[0]},${mapGeo.dongshaPt[1] + 7} ${mapGeo.dongshaPt[0] - 7},${mapGeo.dongshaPt[1]}`}
                  fill={isTaiwanLost ? '#DC2626' : '#2563EB'}
                  stroke={hoverTargetId === 'dongsha' ? '#FACC15' : '#93C5FD'}
                  strokeWidth={hoverTargetId === 'dongsha' ? 2.4 : 1.3}
                />
                <text
                  x={mapGeo.dongshaPt[0]}
                  y={mapGeo.dongshaPt[1] + 18}
                  textAnchor="middle"
                  fill={isTaiwanLost ? '#FCA5A5' : '#93C5FD'}
                  fontSize="8.5"
                  fontWeight="700"
                >
                  東沙({rocScsStatus.dongsha === 'FORTIFIED' ? '固守' : '駐防'})
                </text>
              </g>

              {/* Naval Interdiction Sea Lanes (Open-Ocean Positions, Zero Overlap with Taiwan!) */}
              {mapGeo.seaLanePts.map((lane) => {
                const isHover = hoverTargetId === lane.id;
                return (
                  <g
                    key={lane.id}
                    className="cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverTargetId(lane.id);
                    }}
                    onDragLeave={() => setHoverTargetId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setHoverTargetId(null);
                      const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                      const unit = handUnits.find((u) => u.id === uid);
                      if (unit) deployUnitToSeaLane(lane.id, unit);
                    }}
                    onClick={() => {
                      if (activeUnit) deployUnitToSeaLane(lane.id, activeUnit);
                    }}
                  >
                    <rect
                      x={lane.pt[0] - 34}
                      y={lane.pt[1] - 10}
                      width="68"
                      height="20"
                      fill={lane.blockaded ? '#0C4A6E' : '#091526'}
                      fillOpacity={0.95}
                      stroke={isHover ? '#FACC15' : lane.blockaded ? '#38BDF8' : '#0284C7'}
                      strokeWidth={isHover ? 2 : 1.1}
                      strokeDasharray={lane.blockaded ? undefined : '3 2'}
                    />
                    <text
                      x={lane.pt[0]}
                      y={lane.pt[1] + 3}
                      textAnchor="middle"
                      fill={lane.blockaded ? '#7DD3FC' : '#BAE6FD'}
                      fontSize="8"
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      {lane.blockaded ? `⚓已封${lane.shortName}` : `⚓${lane.name}`}
                    </text>
                  </g>
                );
              })}

              {/* Provincial & Hong Kong Drop Targets (Staggered Callouts) */}
              {mapGeo.mainTargets.map((tp) => {
                const isHover = hoverTargetId === tp.id;
                const done = (tp.progress >= 100 || isGuoguangVictory) && !isTaiwanLost;
                const locked =
                  !done &&
                  ((tp.id === 'hongkong' && !hkUnlocked) ||
                    (tp.id === 'nanjing' && !nanjingUnlocked));

                const boxW = 86;
                const boxH = 16;
                let boxX = tp.pt[0] - boxW / 2;
                let boxY = tp.pt[1] + 15;
                if (tp.labelAlign === 'left') {
                  boxX = tp.pt[0] - boxW - 15;
                  boxY = tp.pt[1] - boxH / 2;
                } else if (tp.labelAlign === 'right') {
                  boxX = tp.pt[0] + 15;
                  boxY = tp.pt[1] - boxH / 2;
                } else if (tp.labelAlign === 'top') {
                  boxX = tp.pt[0] - boxW / 2;
                  boxY = tp.pt[1] - boxH - 14;
                }

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
                      r={isHover ? 14 : 11.5}
                      fill={done ? '#2563EB' : locked ? '#1F2937' : '#450A0A'}
                      fillOpacity={0.94}
                      stroke={done || isHover ? '#FACC15' : locked ? '#94A3B8' : '#F87171'}
                      strokeWidth={isHover ? 2.4 : 1.3}
                      strokeDasharray={done ? undefined : '3 2'}
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
                      {locked ? '封鎖' : done ? '100%' : `${tp.progress}%`}
                    </text>
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill="#090D16"
                      fillOpacity="0.93"
                      stroke={done ? '#3B82F6' : locked ? '#475569' : '#7F1D1D'}
                    />
                    <text
                      x={boxX + boxW / 2}
                      y={boxY + 11}
                      textAnchor="middle"
                      fill={done ? '#93C5FD' : locked ? '#CBD5E1' : '#FCA5A5'}
                      fontSize="8.5"
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      {tp.name}
                    </text>
                  </g>
                );
              })}

              {/* Bottom-Right South China Sea Inset Box with Full Southeast Asia Context */}
              <g>
                <defs>
                  <clipPath id="warScsClip">
                    <rect x="504" y="382" width="204" height="146" />
                  </clipPath>
                </defs>
                <rect
                  x="504"
                  y="382"
                  width="204"
                  height="146"
                  fill="#071324"
                  fillOpacity="0.95"
                  stroke="#0284C7"
                  strokeWidth="1.2"
                />
                <g clipPath="url(#warScsClip)">
                  {mapGeo.scsLandPaths.map((sl) => (
                    <path
                      key={sl.id}
                      d={sl.d}
                      fill={
                        sl.name === 'China'
                          ? isTaiwanLost
                            ? '#450A0A'
                            : isGuoguangVictory
                              ? '#1D4ED8'
                              : '#3B1117'
                          : '#1C262B'
                      }
                      stroke={
                        sl.name === 'China'
                          ? isGuoguangVictory && !isTaiwanLost
                            ? '#FACC15'
                            : '#7F1D1D'
                          : '#4B636E'
                      }
                      strokeWidth="0.7"
                    />
                  ))}
                </g>
                <text x="512" y="398" fill="#7DD3FC" fontSize="9.5" fontWeight="800">
                  南海＆東南亞戰區 · 太平島＆島礁
                </text>

                {/* ROC Taiping Island inside SCS Inset */}
                <g
                  className="cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverTargetId('taiping');
                  }}
                  onDragLeave={() => setHoverTargetId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setHoverTargetId(null);
                    const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                    const unit = handUnits.find((u) => u.id === uid);
                    if (unit) deployUnitToRocScs('taiping', unit);
                  }}
                  onClick={() => {
                    if (activeUnit) deployUnitToRocScs('taiping', activeUnit);
                  }}
                >
                  <circle
                    cx={mapGeo.taipingInsetPt[0]}
                    cy={mapGeo.taipingInsetPt[1]}
                    r={hoverTargetId === 'taiping' ? 10 : 7.5}
                    fill={isTaiwanLost ? '#DC2626' : '#2563EB'}
                    stroke="#FACC15"
                    strokeWidth="1.3"
                  />
                  <text
                    x={mapGeo.taipingInsetPt[0] - 11}
                    y={mapGeo.taipingInsetPt[1] + 3}
                    textAnchor="end"
                    fill={isTaiwanLost ? '#FCA5A5' : '#93C5FD'}
                    fontSize="8"
                    fontWeight="700"
                  >
                    太平島({rocScsStatus.taiping === 'FORTIFIED' ? '固守' : '駐防'})
                  </text>
                </g>

                {/* CCP South China Sea Targets (Yongxing & Meiji Reef) */}
                {mapGeo.scsTargets.map((st) => {
                  const done = (st.progress >= 100 || isGuoguangVictory) && !isTaiwanLost;
                  const isHover = hoverTargetId === st.id;
                  return (
                    <g
                      key={st.id}
                      className="cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverTargetId(st.id);
                      }}
                      onDragLeave={() => setHoverTargetId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setHoverTargetId(null);
                        const uid = e.dataTransfer.getData('text/plain') || draggingUnitId;
                        const unit = handUnits.find((u) => u.id === uid);
                        if (unit) deployUnitToMainland(st.id, unit);
                      }}
                      onClick={() => {
                        if (activeUnit) deployUnitToMainland(st.id, activeUnit);
                      }}
                    >
                      <circle
                        cx={st.pt[0]}
                        cy={st.pt[1]}
                        r={isHover ? 11.5 : 9.5}
                        fill={done ? '#2563EB' : '#450A0A'}
                        stroke={done || isHover ? '#FACC15' : '#F87171'}
                        strokeWidth="1.3"
                      />
                      <text
                        x={st.pt[0]}
                        y={st.pt[1] + 2.5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="7"
                        fontWeight="800"
                        className="font-mono-bbs pointer-events-none"
                      >
                        {done ? '100%' : `${st.progress}%`}
                      </text>
                      <text
                        x={st.pt[0] + 12}
                        y={st.pt[1] + 3}
                        textAnchor="start"
                        fill={done ? '#93C5FD' : '#FCA5A5'}
                        fontSize="8"
                        fontWeight="700"
                        className="pointer-events-none"
                      >
                        {st.name.replace('中共・', '')}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Right: Draggable Unit Cards, InfoWar Launch & Tactical Objectives */}
          <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-[#0D131F]">
            <div>
              <div className="border-b border-[#243044] pb-2">
                <h2 className="text-sm font-bold text-amber-300">
                  點選或拖曳兵力至地圖（本波 {getWaveApBudget(stats, hasUsJpKrPact, rocMorale)} AP）
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                  <strong className="text-cyan-300">士氣＆信息戰：</strong>
                  對共信息戰可重創共軍士氣並洗爆各省防線；壓低共軍士氣 ≤32% 或補給 ≤45% 可中斷敵軍回防！
                  <br />
                  <strong className="text-blue-300">國光大捷：</strong>
                  守住台灣（淪陷 ≤8、上限 {TAIWAN_FALL_THRESHOLD}）且光復閩南＋閩北＋廣東＋上海浙江＋南京（或共軍士氣 ≤15%），五省與香港臨時選區即全面開票！
                </p>

                {!resolvedOutcome && infoWarUnitInHand && (
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
                    📡 直接發動全網對共信息戰（耗 1 AP · 共軍士氣 -{hasInfoWarBonus ? 22 : 16}% / 全線動搖）
                  </button>
                )}
              </div>

              {/* Draggable Cards */}
              <div className="mt-2.5 space-y-1.5">
                {resolvedOutcome ? (
                  <div className="border border-blue-500 bg-[#102347] p-4 text-center">
                    <div className="text-sm font-black text-white">戰局已定！</div>
                    <p className="mt-1 text-xs text-slate-200">
                      請點擊右上角綠色按鈕帶著暴增選票＋臨時選區續戰 2028，或直接結算結局！
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
                    const roleTag =
                      unit.role === 'DEFENSE'
                        ? '守備光復'
                        : unit.role === 'INFOWAR'
                          ? '對共信息戰'
                          : unit.role === 'NAVAL'
                            ? '海軍封鎖'
                            : unit.role === 'NAVAL_ALLY'
                              ? '美日韓聯軍'
                              : unit.role === 'OFFENSE'
                                ? '跨海登陸'
                                : '全能支援';
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
                            {unit.apCost} AP · {roleTag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-300">{unit.desc}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Occupied Counties Quick Status */}
              <div className="mt-3 border-t border-[#243044] pt-2">
                <div className="text-xs font-bold text-rose-300">
                  目前淪陷區縣市（點擊或拖兵收復，≥{TAIWAN_FALL_THRESHOLD} 失守）：
                </div>
                {isGuoguangVictory || occupiedCounties.size === 0 ? (
                  <div className="mt-1.5 border border-blue-700/70 bg-blue-950/60 px-2.5 py-1.5 text-xs font-bold text-blue-300">
                    ★ 台澎金馬全境光復！無任何淪陷區
                  </div>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {Array.from(occupiedCounties).map((cid) => (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => {
                          if (activeUnit) deployUnitToCounty(cid, activeUnit);
                        }}
                        className={`border px-2 py-0.5 text-xs font-medium cursor-pointer ${
                          cid === '台北市'
                            ? 'border-red-500 bg-red-900 text-white'
                            : 'border-red-700 bg-red-950/70 text-red-200 hover:border-amber-400'
                        }`}
                      >
                        {cid}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* War Log */}
            <div className="mt-3 border-t border-[#243044] pt-2">
              <div className="font-mono-bbs text-xs text-slate-400">戰情室即時通報</div>
              <div className="bbs-scroll mt-1 max-h-32 overflow-y-auto space-y-1 font-mono-bbs text-[11px] text-slate-200">
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
