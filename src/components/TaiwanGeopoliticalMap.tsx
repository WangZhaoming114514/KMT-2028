import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import taiwanTopologyRaw from 'taiwan-atlas/counties-10t.json';
import eastAsiaGeoRaw from '../data/eastAsiaGeo.json';
import saibeiGeoRaw from '../data/saibeiGeo.json';
import {
  ALL_CHINA_PROVINCES,
  CHINA_PROVINCE_THEATERS,
  MACRO_MAINLAND_REGIONS,
} from '../data/chinaProvinces';
import { CampaignStats, CountyState, MapMode } from '../types/game';
import { FullContinentChinaFlag } from './ChinaTheaterFlags';

interface TaiwanCountyProps {
  COUNTYID: string;
  COUNTYCODE: string;
  COUNTYNAME: string;
  COUNTYENG: string;
}

interface TaiwanGeopoliticalMapProps {
  counties: CountyState[];
  selectedCountyId: string;
  onSelectCounty: (countyId: string) => void;
  stats: CampaignStats;
  flags: string[];
  mapMode: MapMode;
  onChangeMapMode: (mode: MapMode) => void;
  endingId?: number;
  warOccupiedCounties?: string[];
  shouldAutoPlayNanjing?: boolean;
  onNanjingAnimDone?: () => void;
}

function getCountyFill(
  county: CountyState | undefined,
  endingId?: number,
  warOccupied?: Set<string>,
  clearOccupiedOnVictory?: boolean
): string {
  if (endingId === 17) return '#B91C1C';
  if (!clearOccupiedOnVictory && county && warOccupied?.has(county.id)) return '#DC2626';
  if (!county) return '#1E293B';
  const { kmt, dpp, tpp } = county.current;
  const minge = county.current.minge ?? 0;

  if (minge > kmt && minge > dpp && minge > tpp) {
    return '#9333EA';
  }
  if (kmt >= dpp && kmt >= tpp) {
    const lead = kmt - Math.max(dpp, tpp);
    if (lead >= 15) return '#1D4ED8';
    if (lead >= 6) return '#2563EB';
    return '#3B82F6';
  }
  if (dpp >= kmt && dpp >= tpp) {
    const lead = dpp - Math.max(kmt, tpp);
    if (lead >= 15) return '#15803D';
    if (lead >= 6) return '#16A34A';
    return '#22C55E';
  }
  return '#0891B2';
}

export function TaiwanGeopoliticalMap({
  counties,
  selectedCountyId,
  onSelectCounty,
  stats,
  flags,
  mapMode,
  onChangeMapMode,
  endingId,
  warOccupiedCounties,
  shouldAutoPlayNanjing = false,
  onNanjingAnimDone,
}: TaiwanGeopoliticalMapProps) {
  const [hoveredCountyId, setHoveredCountyId] = useState<string | null>(null);
  const [isNanjingFocusing, setIsNanjingFocusing] = useState<boolean>(false);
  const autoPlayedRef = useRef<boolean>(false);

  const taiwanFallen = endingId === 17 || flags.includes('taiwan_fallen');
  const guoguangVictory =
    !taiwanFallen &&
    (flags.includes('guoguang_victory') ||
      endingId === 15 ||
      endingId === 31 ||
      endingId === 32 ||
      endingId === 33);
  const warCcpDefeated =
    !taiwanFallen &&
    (guoguangVictory ||
      endingId === 16 ||
      endingId === 18 ||
      flags.includes('war_hk_victory') ||
      flags.includes('war_defense_victory'));
  const guoguangActive =
    !taiwanFallen && flags.includes('guoguang_restarted') && !guoguangVictory;

  // Trigger Return-to-Nanjing zoom/pan animation ONCE when enabled, never jumping on hover/mode/remount
  useEffect(() => {
    if (guoguangVictory && mapMode === 'REGIONAL' && shouldAutoPlayNanjing && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      setIsNanjingFocusing(true);
    }
  }, [guoguangVictory, mapMode, shouldAutoPlayNanjing]);

  useEffect(() => {
    if (!isNanjingFocusing) return;
    const timer = window.setTimeout(() => {
      setIsNanjingFocusing(false);
      onNanjingAnimDone?.();
    }, 4650);
    return () => window.clearTimeout(timer);
  }, [isNanjingFocusing, onNanjingAnimDone]);

  useEffect(() => {
    if (mapMode !== 'REGIONAL' && isNanjingFocusing) {
      setIsNanjingFocusing(false);
      onNanjingAnimDone?.();
    }
  }, [mapMode, isNanjingFocusing, onNanjingAnimDone]);

  const countyLookup = useMemo(() => {
    const map = new Map<string, CountyState>();
    for (const c of counties) map.set(c.id, c);
    return map;
  }, [counties]);

  const hkActive =
    !taiwanFallen &&
    (endingId === 15 ||
      endingId === 16 ||
      endingId === 31 ||
      endingId === 32 ||
      endingId === 33 ||
      guoguangVictory ||
      flags.includes('hk_restoration') ||
      flags.includes('war_hk_victory') ||
      Boolean(countyLookup.get('香港')) ||
      Boolean(countyLookup.get('香港行憲特別選區')));

  const diaoyuTransferred = flags.includes('diaoyu_transferred');
  const diaoyuPatrol = flags.includes('diaoyu_patrol');
  const diaoyuStatusQuo =
    flags.includes('diaoyu_status_quo') || flags.includes('diaoyu_compromise');
  const scsReinforced = flags.includes('scs_reinforced');
  const hasUsJpKrPact =
    !taiwanFallen &&
    (flags.includes('us_jp_kr_pact') ||
      diaoyuTransferred ||
      (flags.includes('pro_japan_security') && stats.japanPosture >= 72));

  const warOccupiedSet = useMemo(
    () => (warOccupiedCounties ? new Set(warOccupiedCounties) : undefined),
    [warOccupiedCounties]
  );

  const { taiwanFeatures, eastAsiaFeatures } = useMemo(() => {
    const topo = taiwanTopologyRaw as unknown as Topology<{
      counties: GeometryCollection<TaiwanCountyProps>;
    }>;
    const tw = topojson.feature(topo, topo.objects.counties) as FeatureCollection<
      Geometry,
      TaiwanCountyProps
    >;
    const ea = eastAsiaGeoRaw as unknown as FeatureCollection<Geometry, { name?: string }>;
    return {
      taiwanFeatures: tw.features,
      eastAsiaFeatures: ea.features,
    };
  }, []);

  const SVG_W = 680;
  const SVG_H = 560;

  const regionalGeometry = useMemo(() => {
    const projection =
      mapMode === 'REGIONAL'
        ? geoMercator()
            .center([119.5, 23.8])
            .scale(1480)
            .translate([SVG_W * 0.52, SVG_H * 0.51])
        : geoMercator()
            .center([121.45, 23.85])
            .scale(7700)
            .translate([SVG_W * 0.58, SVG_H * 0.49]);

    const pathGen = geoPath().projection(projection);

    const eaPaths = eastAsiaFeatures.map((f, idx) => ({
      id: `${f.properties?.name ?? 'ea'}-${idx}`,
      name: f.properties?.name ?? '',
      d: pathGen(f) ?? '',
    }));

    const chinaPaths = eaPaths.filter((p) => p.name === 'China').map((p) => p.d);

    const allChinaProvincePaths = ALL_CHINA_PROVINCES.map((f, idx) => ({
      id: `all-prov-${f.properties.name}-${idx}`,
      name: f.properties.name,
      d: pathGen(f) ?? '',
    }));

    const provincePaths = CHINA_PROVINCE_THEATERS.map((prov) => ({
      ...prov,
      paths: prov.features.map((f) => pathGen(f) ?? '').filter(Boolean),
    }));

    const macroRegionPaths = MACRO_MAINLAND_REGIONS.map((mr) => ({
      ...mr,
      paths: mr.features.map((f) => pathGen(f) ?? '').filter(Boolean),
    }));

    const saibeiCollection = saibeiGeoRaw as unknown as FeatureCollection<
      Geometry,
      { name?: string; name_zh?: string }
    >;
    const saibeiPathGen = geoPath().projection(
      geoMercator().fitExtent(
        [
          [504, 30],
          [662, 112],
        ],
        saibeiCollection
      )
    );
    const saibeiInsetPaths = saibeiCollection.features.map((f, idx) => {
      const c = saibeiPathGen.centroid(f);
      return {
        id: `map-saibei-${f.properties?.name ?? idx}`,
        name: f.properties?.name ?? '',
        nameZh: f.properties?.name_zh ?? '',
        d: saibeiPathGen(f) ?? '',
        centroid: [Number.isFinite(c[0]) ? c[0] : 580, Number.isFinite(c[1]) ? c[1] : 70] as [number, number],
      };
    });

    const twPaths = taiwanFeatures.map((f) => ({
      id: f.properties.COUNTYNAME,
      eng: f.properties.COUNTYENG,
      d: pathGen(f) ?? '',
    }));

    const kinmenFeat = taiwanFeatures.find((f) => f.properties.COUNTYNAME === '金門縣');
    const matsuFeat = taiwanFeatures.find((f) => f.properties.COUNTYNAME === '連江縣');
    const penghuFeat = taiwanFeatures.find((f) => f.properties.COUNTYNAME === '澎湖縣');
    const hkFeat = eastAsiaFeatures.find((f) => f.properties?.name === 'Hong Kong');

    const kinmenInsetPath = kinmenFeat
      ? geoPath().projection(
          geoMercator().fitExtent(
            [
              [16, 28],
              [118, 104],
            ],
            kinmenFeat as Feature
          )
        )(kinmenFeat) ?? ''
      : '';

    const matsuInsetPath = matsuFeat
      ? geoPath().projection(
          geoMercator().fitExtent(
            [
              [16, 132],
              [118, 210],
            ],
            matsuFeat as Feature
          )
        )(matsuFeat) ?? ''
      : '';

    const penghuInsetPath = penghuFeat
      ? geoPath().projection(
          geoMercator().fitExtent(
            guoguangVictory
              ? [
                  [16, 28],
                  [118, 104],
                ]
              : [
                  [16, 238],
                  [118, 326],
                ],
            penghuFeat as Feature
          )
        )(penghuFeat) ?? ''
      : '';

    const hkFocusCardPath = hkFeat
      ? geoPath().projection(
          geoMercator().fitExtent(
            [
              [18, 146],
              [116, 212],
            ],
            hkFeat as Feature
          )
        )(hkFeat) ?? ''
      : '';

    // South China Sea Inset Projection placed cleanly at Bottom-Left (X=10..176, Y=444..550)
    const scsProjection = geoMercator()
      .center([112.4, 12.6])
      .scale(500)
      .translate([92, 502]);
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
        id: `scs-${f.properties?.name ?? idx}`,
        name: f.properties?.name ?? '',
        d: scsPathGen(f) ?? '',
      }));

    const scsInsetPts = {
      yongxing: scsProjection([112.34, 16.83]) ?? [60, 466],
      taiping: scsProjection([114.36, 10.37]) ?? [94, 524],
      meiji: scsProjection([115.53, 9.9]) ?? [116, 530],
    };

    const fujianPt = projection([119.3, 25.8]) ?? [280, 220];
    const xiamenPt = projection([118.1, 24.48]) ?? [225, 280];
    const hkPt = projection([114.17, 22.32]) ?? [216, 327];
    const nanjingPt = projection([118.79, 32.06]) ?? [335, 44];
    const medianTop = projection([119.9, 25.8]) ?? [305, 220];
    const medianBot = projection([118.8, 22.4]) ?? [255, 370];
    const diaoyuPt = projection([123.475, 25.745]) ?? [440, 210];
    const yonaguniPt = projection([122.99, 24.47]) ?? [420, 270];
    const okinawaPt = projection([127.68, 26.21]) ?? [580, 200];
    const luzonPt = projection([121.2, 17.8]) ?? [380, 480];
    const koreaPt = projection([127.5, 35.5]) ?? [560, 48];
    const vietnamPt = projection([107.6, 19.6]) ?? [42, 405];
    const thailandPt = projection([102.2, 16.5]) ?? [14, 420];
    const taipeiPt = projection([121.56, 25.04]) ?? [378, 255];
    const kaohsiungPt = projection([120.3, 22.63]) ?? [325, 360];
    const dongshaPt = projection([116.73, 20.7]) ?? [260, 415];

    return {
      eaPaths,
      chinaPaths,
      allChinaProvincePaths,
      provincePaths,
      macroRegionPaths,
      saibeiInsetPaths,
      twPaths,
      kinmenInsetPath,
      matsuInsetPath,
      penghuInsetPath,
      hkFocusCardPath,
      scsLandPaths,
      scsInsetPts,
      fujianPt,
      xiamenPt,
      hkPt,
      nanjingPt,
      medianTop,
      medianBot,
      diaoyuPt,
      yonaguniPt,
      okinawaPt,
      luzonPt,
      koreaPt,
      vietnamPt,
      thailandPt,
      taipeiPt,
      kaohsiungPt,
      dongshaPt,
    };
  }, [eastAsiaFeatures, taiwanFeatures, mapMode, guoguangVictory]);

  const saibeiRecovered =
    !taiwanFallen &&
    (flags.includes('saibei_recovered') || Boolean(countyLookup.get('塞北行憲臨時選區')));
  const waidongbeiRecovered =
    !taiwanFallen &&
    (flags.includes('waidongbei_recovered') || Boolean(countyLookup.get('外東北行憲臨時選區')));
  const koreaUnified = !taiwanFallen && flags.includes('korea_unified');
  const mingeActive = (countyLookup.get('台北市')?.current.minge ?? 0) > 0 || guoguangVictory;

  const hkSelectableId = countyLookup.get('香港')
    ? '香港'
    : countyLookup.get('香港行憲特別選區')
      ? '香港行憲特別選區'
      : null;

  const activeCounty =
    countyLookup.get(hoveredCountyId ?? selectedCountyId) ?? countyLookup.get('台北市')!;

  const ccpLevelLabel = taiwanFallen
    ? '台灣全境淪陷'
    : guoguangVictory
      ? '三民主義統一中國'
      : warCcpDefeated
        ? '共軍徹底瓦解'
        : stats.ccpTension >= 75
          ? '紅色攻台臨界'
          : stats.ccpTension >= 50
            ? '黃色演訓升溫'
            : '常態監控巡航';

  const usJpLevelLabel = hasUsJpKrPact
    ? '美日韓共防聯軍'
    : stats.japanPosture >= 72
      ? '美日聯防力挺'
      : stats.japanPosture >= 40
        ? '一般安保觀察'
        : '疑美疑日降溫';

  const diaoyuStatusLabel = diaoyuTransferred
    ? '日本已歸還中華民國'
    : diaoyuPatrol
      ? '釣魚台強硬護漁'
      : diaoyuStatusQuo
        ? '釣魚台維持現狀'
        : '釣魚台主權爭議';

  return (
    <div className="flex flex-col border border-[#243044] bg-[#0D131F]">
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243044] bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold tracking-wide text-slate-100">即時戰情開票地圖</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-bbs text-slate-400">
            {counties.length} 選區 · 南海諸島 · 釣魚島
          </span>
          {guoguangVictory && mapMode === 'REGIONAL' && (
            <button
              type="button"
              onClick={() => setIsNanjingFocusing(true)}
              className="border border-amber-400/70 bg-blue-950/80 px-2 py-0.5 font-mono-bbs text-[10px] font-bold text-amber-200 hover:bg-blue-900 cursor-pointer"
            >
              {isNanjingFocusing ? '聚焦南京中…' : '重播還都南京聚焦'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#090C12] p-0.5 border border-[#243044]">
          <button
            type="button"
            onClick={() => onChangeMapMode('REGIONAL')}
            className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              mapMode === 'REGIONAL'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            東亞暨南海戰區
          </button>
          <button
            type="button"
            onClick={() => onChangeMapMode('TAIWAN_FOCUS')}
            className={`px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              mapMode === 'TAIWAN_FOCUS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {guoguangVictory ? '台澎＆港平寧選區' : '台灣22縣市特寫'}
          </button>
        </div>
      </div>

      {/* Geopolitical Status Strip */}
      <div className="grid grid-cols-2 border-b border-[#243044] bg-[#0A0F18] text-xs">
        <div className="flex items-center justify-between border-r border-[#243044] px-3 py-1.5">
          <span className="text-slate-400 whitespace-nowrap">
            {guoguangVictory
              ? '還都南京 · 台海南海'
              : warCcpDefeated
                ? '台海戰局 · 南海諸島'
                : '中共壓力 · 台海南海'}
          </span>
          <span
            className={`font-mono-bbs font-semibold whitespace-nowrap tabular-nums ${
              taiwanFallen
                ? 'text-red-400'
                : guoguangVictory
                  ? 'text-blue-400'
                  : warCcpDefeated
                    ? 'text-cyan-300'
                    : stats.ccpTension >= 75
                      ? 'text-red-400'
                      : stats.ccpTension >= 50
                        ? 'text-amber-400'
                        : 'text-slate-300'
            }`}
          >
            {taiwanFallen
              ? '全境淪陷'
              : guoguangVictory
                ? '三民主義統一中國'
                : warCcpDefeated
                  ? '0% 共軍已全滅'
                  : `${stats.ccpTension}% ${ccpLevelLabel}`}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-slate-400 whitespace-nowrap">美日態度 · 釣魚島</span>
          <span
            className={`font-mono-bbs font-semibold whitespace-nowrap tabular-nums ${
              stats.japanPosture >= 72
                ? 'text-cyan-300'
                : stats.japanPosture <= 30
                  ? 'text-rose-400'
                  : 'text-slate-300'
            }`}
          >
            {stats.japanPosture}% {usJpLevelLabel}
          </span>
        </div>
      </div>

      {/* Active Special Geopolitical Campaign Banner */}
      {(taiwanFallen || guoguangVictory || guoguangActive || hkActive || diaoyuTransferred || diaoyuPatrol || scsReinforced || hasUsJpKrPact) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#243044] bg-[#161B2E] px-3 py-1.5 font-mono-bbs text-[11px]">
          {taiwanFallen && (
            <span className="font-bold text-red-400">
              ▲ 台灣與香港全境已淪陷為紅色淪陷區
            </span>
          )}
          {guoguangVictory && (
            <span className="font-bold text-blue-300">
              ★ 還都南京：金馬併入福建（華南），改設香港・北平・南京特別市＋六大地理區開票，民革新勢力參選！
            </span>
          )}
          {waidongbeiRecovered && (
            <span className="font-bold text-amber-300">
              ★ 外東北收復：黑龍江北岸・海參崴・庫頁島重歸版圖！
            </span>
          )}
          {koreaUnified && (
            <span className="font-bold text-cyan-200">
              ★ 美日韓台聯軍助大韓民國統一朝鮮半島！
            </span>
          )}
          {guoguangActive && (
            <span className="font-bold text-amber-300">
              ★ 國光計畫兵推啟動：壓力 ≥ 68% 即觸發跨海反攻戰！
            </span>
          )}
          {hkActive && (
            <span className="font-bold text-cyan-300">
              ★ 香港再光：香港已轉為青天白日藍！
            </span>
          )}
          {diaoyuTransferred && (
            <span className="font-bold text-blue-300">
              ★ 釣魚台主權已由日本正式交還中華民國（圖面轉藍）！
            </span>
          )}
          {hasUsJpKrPact && (
            <span className="font-bold text-cyan-300">
              ★ 美日韓共同防禦條約生效：美第7艦隊＋佐世保＋南韓神盾艦聯防！
            </span>
          )}
          {!diaoyuTransferred && diaoyuPatrol && (
            <span className="font-bold text-amber-200">
              ★ 保釣宣言：{diaoyuStatusLabel}
            </span>
          )}
          {scsReinforced && (
            <span className="font-bold text-emerald-300">
              ★ 南海聯防：東沙＆太平島駐防強化中
            </span>
          )}
        </div>
      )}

      {/* Interactive SVG Map Canvas */}
      <div className="relative w-full overflow-hidden bg-[#07101E]">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label="台灣縣市與中國大陸各省、香港、南海東沙太平島、釣魚島、日本、菲律賓、韓國即時選情地圖"
        >
          <defs>
            <pattern id="seaGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#152338" strokeWidth="0.7" />
            </pattern>
            <marker
              id="guoguangArrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L7,3 z" fill="#FACC15" />
            </marker>
            <clipPath id="mapChinaMasterClip">
              {regionalGeometry.chinaPaths.map((d, idx) => (
                <path key={`mc-${idx}`} d={d} />
              ))}
            </clipPath>
            {regionalGeometry.provincePaths.map((prov) => (
              <clipPath key={`m-clip-${prov.id}`} id={`m-prov-clip-${prov.id}`}>
                {prov.paths.map((pd, i) => (
                  <path key={`${prov.id}-cp-${i}`} d={pd} />
                ))}
              </clipPath>
            ))}
          </defs>

          <g className={isNanjingFocusing && mapMode === 'REGIONAL' ? 'animate-nanjing-pan' : undefined}>
            <rect width={SVG_W} height={SVG_H} fill="url(#seaGrid)" />

            {/* Full-Continent Glowing Flag across Entire Mainland China Landmass */}
            <FullContinentChinaFlag
              clipPathId="mapChinaMasterClip"
              svgWidth={SVG_W}
              svgHeight={SVG_H}
              cantonRight={210}
              cantonBottom={168}
              liberated={guoguangVictory}
              taiwanFallen={taiwanFallen}
              opacity={mapMode === 'REGIONAL' ? 0.96 : 0.35}
            />

            {/* Seamless Base Countries (Hong Kong & Macao rendered AFTER China clip so Guangdong never covers HK!) */}
            {regionalGeometry.eaPaths
              .filter((ea) => ea.name !== 'Hong Kong' && ea.name !== 'Macao')
              .map((ea) => {
                const isChina = ea.name === 'China';
                const isJapan = ea.name === 'Japan';
                const isSouthKorea = ea.name === 'South Korea';
                const isNorthKorea = ea.name === 'North Korea';
                const isSeaNeutral =
                  ea.name === 'Philippines' ||
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
                  fill = 'none';
                  stroke = guoguangVictory
                    ? '#FACC15'
                    : !warCcpDefeated && (stats.ccpTension >= 75 || taiwanFallen)
                      ? '#EF4444'
                      : taiwanFallen
                        ? '#EF4444'
                        : '#991B1B';
                } else if (isJapan) {
                  fill = hasUsJpKrPact || stats.japanPosture >= 72 ? '#132B3E' : '#182330';
                  stroke = hasUsJpKrPact || stats.japanPosture >= 72 ? '#38BDF8' : '#3E556B';
                } else if (isSouthKorea || (isNorthKorea && koreaUnified)) {
                  fill = hasUsJpKrPact || koreaUnified ? '#132B3E' : '#1C262B';
                  stroke = koreaUnified ? '#FACC15' : hasUsJpKrPact ? '#38BDF8' : '#4B636E';
                } else if (isNorthKorea || isSeaNeutral) {
                  fill = '#1C262B';
                  stroke = '#4B636E';
                }

                return (
                  <g key={ea.id}>
                    {isChina && guoguangVictory && (
                      <path
                        d={ea.d}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth={5}
                        strokeOpacity={0.28}
                        opacity={mapMode === 'REGIONAL' ? 1 : 0.35}
                        pointerEvents="none"
                      />
                    )}
                    <path
                      d={ea.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isChina && guoguangVictory ? 1.5 : 0.9}
                      opacity={mapMode === 'REGIONAL' ? 0.96 : 0.38}
                    />
                  </g>
                );
              })}

            {/* Real Natural Earth 10m Provincial Borders + Macro Region Clickable Overlays */}
            <g clipPath="url(#mapChinaMasterClip)" opacity={mapMode === 'REGIONAL' ? 1 : 0.4}>
              {regionalGeometry.allChinaProvincePaths.map((cp) => (
                <path
                  key={cp.id}
                  d={cp.d}
                  fill="none"
                  stroke={guoguangVictory ? '#93C5FD' : '#5E2A34'}
                  strokeWidth="0.65"
                  strokeOpacity={guoguangVictory ? 0.42 : 0.7}
                  pointerEvents="none"
                />
              ))}

              {regionalGeometry.macroRegionPaths.map((mr) => {
                const tempCounty = countyLookup.get(mr.tempCountyId);
                if (guoguangVictory) {
                  return (
                    <g
                      key={`macro-hit-${mr.id}`}
                      className={tempCounty ? 'cursor-pointer' : undefined}
                      onClick={() => {
                        if (tempCounty) onSelectCounty(tempCounty.id);
                      }}
                    >
                      {mr.paths.map((pd, i) => (
                        <path
                          key={`${mr.id}-hit-${i}`}
                          d={pd}
                          fill="transparent"
                          stroke={selectedCountyId === mr.tempCountyId ? '#FACC15' : 'none'}
                          strokeWidth={selectedCountyId === mr.tempCountyId ? 1.2 : 0}
                        />
                      ))}
                      <title>{`${mr.name}（點擊檢視${mr.tempCountyId}）`}</title>
                    </g>
                  );
                }

                if (!taiwanFallen && tempCounty) {
                  return (
                    <g
                      key={`macro-partial-${mr.id}`}
                      className="cursor-pointer"
                      onClick={() => onSelectCounty(tempCounty.id)}
                    >
                      {mr.paths.map((pd, i) => (
                        <g key={`${mr.id}-pfill-${i}`}>
                          <path d={pd} fill="#1D4ED8" fillOpacity="0.88" stroke="#60A5FA" strokeWidth="0.85" />
                          <path
                            d={pd}
                            fill="none"
                            stroke="#BAE6FD"
                            strokeWidth="2"
                            strokeOpacity="0.55"
                          />
                        </g>
                      ))}
                      <title>{`${mr.name}（已納入${tempCounty.id} · 點擊檢視）`}</title>
                    </g>
                  );
                }

                return null;
              })}
            </g>

            {/* Hong Kong & Macao Rendered ABOVE China clipPath so Guangdong NEVER hides HK! */}
            {regionalGeometry.eaPaths
              .filter((ea) => ea.name === 'Hong Kong' || ea.name === 'Macao')
              .map((ea) => {
                const isHongKong = ea.name === 'Hong Kong';
                const controlledBlue = isHongKong ? hkActive : guoguangVictory;
                return (
                  <path
                    key={`top-${ea.id}`}
                    d={ea.d}
                    fill={controlledBlue ? '#2563EB' : '#9F1239'}
                    stroke={controlledBlue ? '#FACC15' : '#FB7185'}
                    strokeWidth={isHongKong ? 1.6 : 1.1}
                    opacity={mapMode === 'REGIONAL' ? 1 : 0.45}
                    className={isHongKong && hkSelectableId ? 'cursor-pointer' : undefined}
                    onClick={() => {
                      if (isHongKong && hkSelectableId) {
                        onSelectCounty(hkSelectableId);
                      }
                    }}
                  >
                    {isHongKong && (
                      <title>
                        {hkActive
                          ? '香港特別市（青天白日藍 · 已光復控制）'
                          : '香港（未收復）'}
                      </title>
                    )}
                  </path>
                );
              })}

          {/* Regional Overlays */}
          {mapMode === 'REGIONAL' && (
            <g>
              <line
                x1={regionalGeometry.medianTop[0]}
                y1={regionalGeometry.medianTop[1]}
                x2={regionalGeometry.medianBot[0]}
                y2={regionalGeometry.medianBot[1]}
                stroke={
                  taiwanFallen
                    ? '#EF4444'
                    : guoguangVictory
                      ? '#60A5FA'
                      : stats.ccpTension >= 70
                        ? '#EF4444'
                        : '#F59E0B'
                }
                strokeWidth={stats.ccpTension >= 70 ? 1.8 : 1.1}
                strokeDasharray="5 4"
                opacity={0.85}
              />

              {(guoguangActive || guoguangVictory) && (
                <g>
                  <line
                    x1={regionalGeometry.taipeiPt[0] - 6}
                    y1={regionalGeometry.taipeiPt[1] - 4}
                    x2={regionalGeometry.fujianPt[0] + 10}
                    y2={regionalGeometry.fujianPt[1] + 4}
                    stroke="#FACC15"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    markerEnd="url(#guoguangArrow)"
                  />
                  <line
                    x1={regionalGeometry.kaohsiungPt[0] - 6}
                    y1={regionalGeometry.kaohsiungPt[1] - 6}
                    x2={regionalGeometry.xiamenPt[0] + 10}
                    y2={regionalGeometry.xiamenPt[1] + 6}
                    stroke="#FACC15"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    markerEnd="url(#guoguangArrow)"
                  />
                  <text
                    x={regionalGeometry.fujianPt[0] - 45}
                    y={regionalGeometry.fujianPt[1] - 14}
                    fill="#FACC15"
                    fontSize="10.5"
                    fontWeight="800"
                  >
                    {guoguangVictory ? '國光大捷！三民主義統一中國' : '國光反攻箭頭'}
                  </text>
                </g>
              )}

              {/* China Label Box */}
              <g
                transform={`translate(${Math.max(12, regionalGeometry.xiamenPt[0] - 156)}, ${Math.max(16, regionalGeometry.xiamenPt[1] - 104)})`}
              >
                <rect
                  width="206"
                  height="36"
                  fill={guoguangVictory || warCcpDefeated ? '#0F2557' : '#181218'}
                  fillOpacity="0.92"
                  stroke={guoguangVictory || warCcpDefeated ? '#FACC15' : '#7F1D1D'}
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y="15"
                  fill={guoguangVictory || warCcpDefeated ? '#93C5FD' : '#FCA5A5'}
                  fontSize="10.5"
                  fontWeight="700"
                >
                  {guoguangVictory
                    ? '還都南京 · 三民主義統一中國'
                    : warCcpDefeated
                      ? '台海大捷 · 敵軍主力已瓦解'
                      : '中共 · 東部/南部戰區'}
                </text>
                <text x="8" y="29" fill="#E2E8F0" fontSize="9.5" className="font-mono-bbs">
                  {guoguangVictory
                    ? '六大地理區＋港平寧開票 · 民革參選'
                    : warCcpDefeated
                      ? '我軍掌握制海權 · 敵已無力再犯'
                      : `壓力 ${stats.ccpTension}% · ${ccpLevelLabel}`}
                </text>
              </g>

              {/* Municipal Star Pin for Nanjing Capital when Return to Nanjing active */}
              {guoguangVictory && (
                <g
                  transform={`translate(${regionalGeometry.nanjingPt[0]}, ${regionalGeometry.nanjingPt[1]})`}
                  className="cursor-pointer"
                  onClick={() =>
                    onSelectCounty(countyLookup.get('南京') ? '南京' : '華中行憲臨時選區')
                  }
                >
                  <circle r={12} fill="#1D4ED8" fillOpacity={0.38} stroke="#FACC15" strokeWidth={1.2} />
                  <circle r={4.5} fill="#FACC15" stroke="#0B1220" strokeWidth={1} />
                  <rect
                    x={10}
                    y={-10}
                    width="92"
                    height="20"
                    fill="#0F2557"
                    fillOpacity="0.95"
                    stroke="#FACC15"
                    strokeWidth={1}
                  />
                  <text x={56} y={3} textAnchor="middle" fill="#FEF08A" fontSize="9.5" fontWeight="800">
                    ★ 還都南京首都
                  </text>
                </g>
              )}

              {/* Saibei & Waidongbei Frontier Inset Frame */}
              <g
                className={
                  countyLookup.get('外東北行憲臨時選區') || countyLookup.get('塞北行憲臨時選區')
                    ? 'cursor-pointer'
                    : undefined
                }
                onClick={() => {
                  if (countyLookup.get('外東北行憲臨時選區')) {
                    onSelectCounty('外東北行憲臨時選區');
                  } else if (countyLookup.get('塞北行憲臨時選區')) {
                    onSelectCounty('塞北行憲臨時選區');
                  }
                }}
              >
                <rect
                  x="496"
                  y="12"
                  width="174"
                  height="112"
                  fill="#09111E"
                  fillOpacity="0.93"
                  stroke={waidongbeiRecovered || saibeiRecovered ? '#FACC15' : '#334155'}
                  strokeWidth={waidongbeiRecovered || saibeiRecovered ? 1.5 : 1}
                />
                <text
                  x="503"
                  y="25"
                  fill={waidongbeiRecovered || saibeiRecovered ? '#93C5FD' : '#94A3B8'}
                  fontSize="9.2"
                  fontWeight="700"
                >
                  {waidongbeiRecovered
                    ? '★ 塞北(蒙古＆圖瓦)＆外東北全收'
                    : saibeiRecovered
                      ? '★ 塞北光復 · 蒙古＆圖瓦共和國'
                      : '北疆特寫 · 外蒙古＆圖瓦共和國'}
                </text>
                {regionalGeometry.saibeiInsetPaths.map((sp) => {
                  const isTuva = sp.name === 'TannuUriankhai';
                  return (
                    <g key={sp.id}>
                      {isTuva && (
                        <path
                          d={sp.d}
                          fill="none"
                          stroke={saibeiRecovered ? '#38BDF8' : '#C084FC'}
                          strokeWidth={2.4}
                          strokeOpacity={0.4}
                          pointerEvents="none"
                        />
                      )}
                      <path
                        d={sp.d}
                        fill={
                          saibeiRecovered
                            ? isTuva
                              ? '#0284C7'
                              : '#1D4ED8'
                            : isTuva
                              ? '#4C1D95'
                              : '#1C262B'
                        }
                        stroke={
                          saibeiRecovered
                            ? '#FACC15'
                            : isTuva
                              ? '#E879F9'
                              : '#4B636E'
                        }
                        strokeWidth={isTuva ? 1.2 : saibeiRecovered ? 1.1 : 0.85}
                      >
                        <title>
                          {saibeiRecovered
                            ? `${sp.nameZh}（已收復納入塞北行憲臨時選區 · 點擊檢視）`
                            : `${sp.nameZh}（於〈東北亞暨漠北決戰〉中收復或談判）`}
                        </title>
                      </path>
                    </g>
                  );
                })}
                {/* Clear micro-labels for Tuva Republic and Outer Mongolia */}
                {regionalGeometry.saibeiInsetPaths.map((sp) => {
                  const isTuva = sp.name === 'TannuUriankhai';
                  return (
                    <text
                      key={`${sp.id}-lbl`}
                      x={isTuva ? Math.max(524, sp.centroid[0] + 6) : sp.centroid[0] + 4}
                      y={isTuva ? Math.max(36, sp.centroid[1] - 4) : sp.centroid[1] + 5}
                      textAnchor="middle"
                      fill={isTuva ? (saibeiRecovered ? '#FEF08A' : '#E9D5FF') : '#CBD5E1'}
                      fontSize={isTuva ? '7.8' : '8'}
                      fontWeight="700"
                      className="pointer-events-none"
                    >
                      {isTuva ? '圖瓦共和國' : '外蒙古'}
                    </text>
                  );
                })}
                <text
                  x="583"
                  y="118"
                  textAnchor="middle"
                  fill={waidongbeiRecovered || saibeiRecovered ? '#FDE68A' : '#64748B'}
                  fontSize="7.8"
                  className="font-mono-bbs"
                >
                  {waidongbeiRecovered
                    ? '圖瓦/漠北/清代外東北全納入開票'
                    : saibeiRecovered
                      ? '蒙古＆圖瓦已納入塞北行憲選區'
                      : '東北亞戰場可收復圖瓦與漠北'}
                </text>
              </g>

              {/* Dongsha Islands */}
              <g transform={`translate(${regionalGeometry.dongshaPt[0]}, ${regionalGeometry.dongshaPt[1]})`}>
                <polygon
                  points="0,-5 5,0 0,5 -5,0"
                  fill={taiwanFallen ? '#DC2626' : '#3B82F6'}
                  stroke="#FACC15"
                  strokeWidth="1"
                />
                <text x="8" y="3" fill={taiwanFallen ? '#FCA5A5' : '#93C5FD'} fontSize="9.5" fontWeight="700">
                  東沙群島
                </text>
              </g>

              {/* Diaoyu / Senkaku Islands */}
              <g transform={`translate(${regionalGeometry.diaoyuPt[0]}, ${regionalGeometry.diaoyuPt[1]})`}>
                <polygon
                  points="0,-6 6,0 0,6 -6,0"
                  fill={diaoyuTransferred ? '#2563EB' : diaoyuPatrol ? '#FACC15' : '#FB923C'}
                  stroke={diaoyuTransferred ? '#FACC15' : '#090D16'}
                  strokeWidth="1.2"
                />
                <g transform="translate(8, -14)">
                  <rect
                    width="142"
                    height="30"
                    fill="#141824"
                    fillOpacity="0.92"
                    stroke={diaoyuTransferred ? '#3B82F6' : diaoyuPatrol ? '#FACC15' : '#FB923C'}
                    strokeWidth="0.9"
                  />
                  <text x="6" y="13" fill={diaoyuTransferred ? '#93C5FD' : '#FDE68A'} fontSize="10" fontWeight="700">
                    釣魚島（尖閣諸島）
                  </text>
                  <text x="6" y="25" fill="#CBD5E1" fontSize="9" className="font-mono-bbs">
                    {diaoyuStatusLabel}
                  </text>
                </g>
              </g>

              {/* Neighbor Countries Labels (Philippines, South Korea Pact/Neutral, Vietnam/Indochina) */}
              {regionalGeometry.luzonPt[1] < SVG_H - 20 && (
                <g transform={`translate(${regionalGeometry.luzonPt[0] - 28}, ${regionalGeometry.luzonPt[1] - 12})`}>
                  <rect width="92" height="22" fill="#111A20" fillOpacity="0.88" stroke="#4B636E" strokeWidth="0.8" />
                  <text x="46" y="14" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontWeight="600">
                    菲律賓 · 中立國
                  </text>
                </g>
              )}
              {regionalGeometry.koreaPt[1] > 8 && regionalGeometry.koreaPt[0] < SVG_W - 70 && (
                <g transform={`translate(${regionalGeometry.koreaPt[0] - 46}, ${regionalGeometry.koreaPt[1]})`}>
                  <rect
                    width="96"
                    height="22"
                    fill={hasUsJpKrPact ? '#0F2235' : '#111A20'}
                    fillOpacity="0.9"
                    stroke={hasUsJpKrPact ? '#38BDF8' : '#4B636E'}
                    strokeWidth="0.9"
                  />
                  <text
                    x="48"
                    y="14"
                    textAnchor="middle"
                    fill={hasUsJpKrPact ? '#7DD3FC' : '#94A3B8'}
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {hasUsJpKrPact ? '南韓 · 美日韓共防' : '南韓 · 中立國'}
                  </text>
                </g>
              )}
              {regionalGeometry.vietnamPt[0] > 4 && (
                <g transform={`translate(${Math.max(12, regionalGeometry.vietnamPt[0] - 12)}, ${regionalGeometry.vietnamPt[1] - 14})`}>
                  <rect width="106" height="22" fill="#111A20" fillOpacity="0.88" stroke="#4B636E" strokeWidth="0.8" />
                  <text x="53" y="14" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="600">
                    越/寮/泰 · 中南半島
                  </text>
                </g>
              )}

              {/* Hong Kong Direct Map Marker (HK Inset Removed as Requested) */}
              {hkActive && (
                <line
                  x1={regionalGeometry.kaohsiungPt[0]}
                  y1={regionalGeometry.kaohsiungPt[1]}
                  x2={regionalGeometry.hkPt[0]}
                  y2={regionalGeometry.hkPt[1]}
                  stroke="#38BDF8"
                  strokeWidth={1.6}
                  strokeDasharray="4 3"
                />
              )}
              <g
                className={hkSelectableId ? 'cursor-pointer' : undefined}
                onClick={() => {
                  if (hkSelectableId) onSelectCounty(hkSelectableId);
                }}
              >
                <circle
                  cx={regionalGeometry.hkPt[0]}
                  cy={regionalGeometry.hkPt[1]}
                  r={hkActive ? 9 : 6}
                  fill="none"
                  stroke={hkActive ? '#FACC15' : '#FB7185'}
                  strokeWidth={1.4}
                />
                <rect
                  x={regionalGeometry.hkPt[0] - 46}
                  y={regionalGeometry.hkPt[1] + 10}
                  width="92"
                  height="16"
                  fill="#09111E"
                  fillOpacity="0.92"
                  stroke={hkActive ? '#3B82F6' : '#9F1239'}
                  strokeWidth="0.9"
                />
                <text
                  x={regionalGeometry.hkPt[0]}
                  y={regionalGeometry.hkPt[1] + 21}
                  textAnchor="middle"
                  fill={hkActive ? '#93C5FD' : '#FDA4AF'}
                  fontSize="8.5"
                  fontWeight="700"
                >
                  {hkActive ? '★ 香港(再光藍天)' : taiwanFallen ? '香港(淪陷)' : '香港'}
                </text>
              </g>

              {/* South China Sea Inset Frame cleanly in bottom-left */}
              <g>
                <defs>
                  <clipPath id="scsInsetClip">
                    <rect x="10" y="444" width="166" height="106" />
                  </clipPath>
                </defs>
                <rect
                  x="10"
                  y="444"
                  width="166"
                  height="106"
                  fill="#071324"
                  fillOpacity="0.95"
                  stroke={scsReinforced || guoguangVictory ? '#38BDF8' : '#334155'}
                  strokeWidth="1.2"
                />
                <g clipPath="url(#scsInsetClip)">
                  {regionalGeometry.scsLandPaths.map((sl) => (
                    <path
                      key={sl.id}
                      d={sl.d}
                      fill={
                        sl.name === 'China'
                          ? guoguangVictory
                            ? '#1D4ED8'
                            : '#3B1117'
                          : '#1C262B'
                      }
                      stroke={
                        sl.name === 'China'
                          ? guoguangVictory
                            ? '#FACC15'
                            : '#7F1D1D'
                          : '#4B636E'
                      }
                      strokeWidth="0.7"
                    />
                  ))}
                  <polygon
                    points={`${regionalGeometry.scsInsetPts.yongxing[0]},${regionalGeometry.scsInsetPts.yongxing[1] - 4} ${regionalGeometry.scsInsetPts.yongxing[0] + 4},${regionalGeometry.scsInsetPts.yongxing[1]} ${regionalGeometry.scsInsetPts.yongxing[0]},${regionalGeometry.scsInsetPts.yongxing[1] + 4} ${regionalGeometry.scsInsetPts.yongxing[0] - 4},${regionalGeometry.scsInsetPts.yongxing[1]}`}
                    fill={guoguangVictory || warCcpDefeated ? '#2563EB' : '#DC2626'}
                    stroke={guoguangVictory || warCcpDefeated ? '#FACC15' : '#FCA5A5'}
                    strokeWidth="0.8"
                  />
                  <text
                    x={regionalGeometry.scsInsetPts.yongxing[0] + 6}
                    y={regionalGeometry.scsInsetPts.yongxing[1] + 3}
                    fill={guoguangVictory || warCcpDefeated ? '#93C5FD' : '#FCA5A5'}
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {guoguangVictory || warCcpDefeated ? '西沙永興(藍)' : '西沙永興島'}
                  </text>

                  <polygon
                    points={`${regionalGeometry.scsInsetPts.taiping[0]},${regionalGeometry.scsInsetPts.taiping[1] - 4.5} ${regionalGeometry.scsInsetPts.taiping[0] + 4.5},${regionalGeometry.scsInsetPts.taiping[1]} ${regionalGeometry.scsInsetPts.taiping[0]},${regionalGeometry.scsInsetPts.taiping[1] + 4.5} ${regionalGeometry.scsInsetPts.taiping[0] - 4.5},${regionalGeometry.scsInsetPts.taiping[1]}`}
                    fill={taiwanFallen ? '#DC2626' : '#2563EB'}
                    stroke="#FACC15"
                    strokeWidth="1"
                  />
                  <text
                    x={regionalGeometry.scsInsetPts.taiping[0] - 32}
                    y={regionalGeometry.scsInsetPts.taiping[1] - 7}
                    fill={taiwanFallen ? '#FCA5A5' : '#93C5FD'}
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    太平島
                  </text>

                  <polygon
                    points={`${regionalGeometry.scsInsetPts.meiji[0]},${regionalGeometry.scsInsetPts.meiji[1] - 3.5} ${regionalGeometry.scsInsetPts.meiji[0] + 3.5},${regionalGeometry.scsInsetPts.meiji[1]} ${regionalGeometry.scsInsetPts.meiji[0]},${regionalGeometry.scsInsetPts.meiji[1] + 3.5} ${regionalGeometry.scsInsetPts.meiji[0] - 3.5},${regionalGeometry.scsInsetPts.meiji[1]}`}
                    fill={guoguangVictory || warCcpDefeated ? '#2563EB' : '#DC2626'}
                    stroke={guoguangVictory || warCcpDefeated ? '#FACC15' : '#FCA5A5'}
                    strokeWidth="0.8"
                  />
                  <text
                    x={regionalGeometry.scsInsetPts.meiji[0] + 5}
                    y={regionalGeometry.scsInsetPts.meiji[1] + 4}
                    fill={guoguangVictory || warCcpDefeated ? '#93C5FD' : '#FCA5A5'}
                    fontSize="8"
                    fontWeight="700"
                  >
                    美濟礁
                  </text>
                </g>
                <text x="17" y="458" fill="#7DD3FC" fontSize="9.5" fontWeight="700">
                  南海諸島 · 太平＆西沙
                </text>
              </g>

              {/* US-Japan Security & Okinawa Callout */}
              <line
                x1={regionalGeometry.taipeiPt[0] + 8}
                y1={regionalGeometry.taipeiPt[1]}
                x2={regionalGeometry.yonaguniPt[0]}
                y2={regionalGeometry.yonaguniPt[1]}
                stroke="#38BDF8"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                opacity={0.75}
              />
              <circle
                cx={regionalGeometry.yonaguniPt[0]}
                cy={regionalGeometry.yonaguniPt[1]}
                r={3.8}
                fill="#38BDF8"
              />
              <g
                transform={`translate(${Math.min(SVG_W - 170, regionalGeometry.yonaguniPt[0] + 8)}, ${regionalGeometry.yonaguniPt[1] + 6})`}
              >
                <rect width="162" height="36" fill="#0F1C2B" fillOpacity="0.92" stroke="#0284C7" strokeWidth="0.9" />
                <text x="8" y="15" fill="#7DD3FC" fontSize="10" fontWeight="700">
                  {hasUsJpKrPact ? '美日韓共防 · 佐世保/釜山' : '美日觀察 · 佐世保/沖繩'}
                </text>
                <text x="8" y="29" fill="#E2E8F0" fontSize="9.5" className="font-mono-bbs">
                  美日韓態度 {stats.japanPosture}% · {usJpLevelLabel}
                </text>
              </g>
              {regionalGeometry.okinawaPt[0] < SVG_W - 20 && (
                <text
                  x={regionalGeometry.okinawaPt[0] - 26}
                  y={regionalGeometry.okinawaPt[1] - 8}
                  fill="#7DD3FC"
                  fontSize="9.5"
                  fontWeight="600"
                >
                  美日駐沖繩群島
                </text>
              )}
            </g>
          )}

          {/* All 22 Taiwan Counties & Cities */}
          <g>
            {regionalGeometry.twPaths.map((tp) => {
              if (
                mapMode === 'TAIWAN_FOCUS' &&
                (tp.id === '金門縣' || tp.id === '連江縣' || tp.id === '澎湖縣')
              ) {
                return null;
              }
              const mergedIntoFujian =
                guoguangVictory && (tp.id === '金門縣' || tp.id === '連江縣');
              const lookupId = mergedIntoFujian ? '華南行憲臨時選區' : tp.id;
              const cState = countyLookup.get(lookupId);
              const isSelected = selectedCountyId === lookupId;
              const isHovered = hoveredCountyId === lookupId;
              const effectiveEndingId = taiwanFallen ? 17 : endingId;
              const fill = getCountyFill(cState, effectiveEndingId, warOccupiedSet, warCcpDefeated);

              return (
                <path
                  key={tp.id}
                  d={tp.d}
                  fill={fill}
                  fillOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.86}
                  stroke={isSelected ? '#FACC15' : isHovered ? '#FFFFFF' : '#0B1220'}
                  strokeWidth={isSelected ? 2.1 : isHovered ? 1.5 : 0.65}
                  className="cursor-pointer transition-opacity duration-150"
                  onMouseEnter={() => setHoveredCountyId(lookupId)}
                  onMouseLeave={() => setHoveredCountyId(null)}
                  onClick={() => onSelectCounty(lookupId)}
                >
                  <title>
                    {mergedIntoFujian
                      ? `${tp.id}（已併入福建省 · 華南行憲臨時選區）`
                      : `${tp.id}｜藍 ${cState?.current.kmt.toFixed(1)}% · 綠 ${cState?.current.dpp.toFixed(1)}% · 白 ${cState?.current.tpp.toFixed(1)}%${
                          (cState?.current.minge ?? 0) > 0
                            ? ` · 民革 ${(cState?.current.minge ?? 0).toFixed(1)}%`
                            : ''
                        }`}
                  </title>
                </path>
              );
            })}
          </g>

          {/* Offshore Islands OR Replaced Municipal Insets (香港, 北平, 南京) in TAIWAN_FOCUS mode */}
          {mapMode === 'TAIWAN_FOCUS' && !guoguangVictory && (
            <g>
              {[
                { id: '金門縣', path: regionalGeometry.kinmenInsetPath, y: 12, labelY: 27 },
                { id: '連江縣', path: regionalGeometry.matsuInsetPath, y: 118, labelY: 133 },
                { id: '澎湖縣', path: regionalGeometry.penghuInsetPath, y: 224, labelY: 239 },
              ].map((inset) => {
                const cState = countyLookup.get(inset.id);
                const isSelected = selectedCountyId === inset.id;
                return (
                  <g
                    key={inset.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCountyId(inset.id)}
                    onMouseLeave={() => setHoveredCountyId(null)}
                    onClick={() => onSelectCounty(inset.id)}
                  >
                    <rect
                      x={10}
                      y={inset.y}
                      width={114}
                      height={98}
                      fill="#09111E"
                      fillOpacity="0.92"
                      stroke={isSelected ? '#FACC15' : '#2D3F59'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                    <text x={16} y={inset.labelY} fill="#CBD5E1" fontSize="10" fontWeight="700">
                      {inset.id}
                    </text>
                    <path
                      d={inset.path}
                      fill={getCountyFill(cState, taiwanFallen ? 17 : endingId, warOccupiedSet, warCcpDefeated)}
                      stroke={isSelected ? '#FACC15' : '#0B1220'}
                      strokeWidth={1}
                    />
                  </g>
                );
              })}
              <g transform="translate(10, 336)">
                <rect width="142" height="58" fill="#09111E" fillOpacity="0.92" stroke="#2D3F59" />
                <text x="8" y="16" fill="#7DD3FC" fontSize="10" fontWeight="700">
                  南海屬地 · 高雄管轄
                </text>
                <text x="8" y="34" fill={taiwanFallen ? '#FCA5A5' : '#93C5FD'} fontSize="9.5" className="font-mono-bbs">
                  東沙群島：{taiwanFallen ? '淪陷' : '藍旗駐守'}
                </text>
                <text x="8" y="49" fill={taiwanFallen ? '#FCA5A5' : '#93C5FD'} fontSize="9.5" className="font-mono-bbs">
                  南沙太平島：{taiwanFallen ? '淪陷' : '海巡守備'}
                </text>
              </g>
            </g>
          )}

          {mapMode === 'TAIWAN_FOCUS' && guoguangVictory && (
            <g>
              {/* Penghu Remains */}
              {(() => {
                const cState = countyLookup.get('澎湖縣');
                const isSelected = selectedCountyId === '澎湖縣';
                return (
                  <g
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCountyId('澎湖縣')}
                    onMouseLeave={() => setHoveredCountyId(null)}
                    onClick={() => onSelectCounty('澎湖縣')}
                  >
                    <rect
                      x={10}
                      y={12}
                      width={118}
                      height={98}
                      fill="#09111E"
                      fillOpacity="0.92"
                      stroke={isSelected ? '#FACC15' : '#2D3F59'}
                      strokeWidth={isSelected ? 1.8 : 1}
                    />
                    <text x={16} y={27} fill="#CBD5E1" fontSize="10" fontWeight="700">
                      澎湖縣
                    </text>
                    <path
                      d={regionalGeometry.penghuInsetPath}
                      fill={getCountyFill(cState, endingId, warOccupiedSet, warCcpDefeated)}
                      stroke={isSelected ? '#FACC15' : '#0B1220'}
                      strokeWidth={1}
                    />
                  </g>
                );
              })()}

              {/* Replaced Kinmen/Matsu Slots: 香港, 北平, 南京 */}
              {[
                { id: '香港', tag: '替代金馬 · 特別市', y: 118, path: regionalGeometry.hkFocusCardPath },
                { id: '北平', tag: '替代金馬 · 古都直轄', y: 204, path: null },
                { id: '南京', tag: '替代金馬 · 還都首都', y: 290, path: null },
              ].map((mun) => {
                const cState = countyLookup.get(mun.id);
                const isSelected = selectedCountyId === mun.id;
                return (
                  <g
                    key={mun.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCountyId(mun.id)}
                    onMouseLeave={() => setHoveredCountyId(null)}
                    onClick={() => onSelectCounty(mun.id)}
                  >
                    <rect
                      x={10}
                      y={mun.y}
                      width={132}
                      height={78}
                      fill="#0B1933"
                      fillOpacity="0.95"
                      stroke={isSelected ? '#FACC15' : '#3B82F6'}
                      strokeWidth={isSelected ? 2 : 1.1}
                    />
                    <text x={16} y={mun.y + 15} fill="#FEF08A" fontSize="10" fontWeight="800">
                      ★ {mun.id}特別市
                    </text>
                    <text x={16} y={mun.y + 28} fill="#93C5FD" fontSize="8" className="font-mono-bbs">
                      {mun.tag}
                    </text>
                    {mun.path ? (
                      <path
                        d={mun.path}
                        fill="#2563EB"
                        stroke="#FACC15"
                        strokeWidth={1}
                      />
                    ) : (
                      <g transform={`translate(22, ${mun.y + 49})`}>
                        <rect x="0" y="-12" width="16" height="12" fill="#1D4ED8" stroke="#FACC15" strokeWidth="0.9" />
                        <circle cx="8" cy="-6" r="3" fill="#FFFFFF" />
                        <text x="24" y="-3" fill="#E2E8F0" fontSize="9.5" fontWeight="700" className="font-mono-bbs">
                          藍 {(cState?.current.kmt ?? 60).toFixed(1)}%
                        </text>
                      </g>
                    )}
                    <text x={16} y={mun.y + 70} fill="#CBD5E1" fontSize="8.5" className="font-mono-bbs">
                      民革 {(cState?.current.minge ?? 12).toFixed(1)}% · 點擊檢視
                    </text>
                  </g>
                );
              })}

              {/* Note: Kinmen/Matsu Merged into Fujian */}
              <g
                transform="translate(10, 378)"
                className="cursor-pointer"
                onClick={() => onSelectCounty('華南行憲臨時選區')}
              >
                <rect width="152" height="52" fill="#09111E" fillOpacity="0.94" stroke="#38BDF8" />
                <text x="8" y="16" fill="#7DD3FC" fontSize="9.5" fontWeight="700">
                  金門＆連江已併入福建
                </text>
                <text x="8" y="31" fill="#E2E8F0" fontSize="8.5" className="font-mono-bbs">
                  歸屬華南行憲臨時選區
                </text>
                <text x="8" y="44" fill="#93C5FD" fontSize="8.5" className="font-mono-bbs">
                  東沙＆太平島：藍旗固守
                </text>
              </g>
            </g>
          )}

          {/* Legend */}
          <g transform={`translate(${SVG_W - 222}, ${SVG_H - 64})`}>
            <rect width="210" height="54" fill="#090D16" fillOpacity="0.9" stroke="#243044" strokeWidth="1" />
            <text x="10" y="17" fill="#CBD5E1" fontSize="10" fontWeight="700">
              各縣市領先陣營 / 戰區圖例
            </text>
            <rect x="10" y="27" width="10" height="10" fill="#2563EB" />
            <text x="23" y="36" fill="#E2E8F0" fontSize="9.5">藍/光復</text>
            <rect x="65" y="27" width="10" height="10" fill="#16A34A" />
            <text x="78" y="36" fill="#E2E8F0" fontSize="9.5">民進黨</text>
            <rect x="115" y="27" width="10" height="10" fill="#0891B2" />
            <text x="128" y="36" fill="#E2E8F0" fontSize="9.5">民眾黨</text>
            <rect x="165" y="27" width="10" height="10" fill={guoguangVictory ? '#9333EA' : '#DC2626'} />
            <text x="178" y="36" fill={guoguangVictory ? '#E9D5FF' : '#FCA5A5'} fontSize="9.5">
              {guoguangVictory ? '民革' : '淪陷/紅'}
            </text>
          </g>
          </g>
        </svg>

        {/* Return to Nanjing Calligraphic Overlay */}
        {isNanjingFocusing && guoguangVictory && mapMode === 'REGIONAL' && (
          <div className="animate-nanjing-calligraphy pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="border-2 border-amber-300/90 bg-[#0A1936]/85 px-7 py-4 shadow-[0_0_40px_rgba(37,99,235,0.65)] backdrop-blur-[2px] text-center">
              <div className="font-mono-bbs text-[11px] tracking-[0.28em] text-amber-300">
                中華民國國民政府
              </div>
              <div className="mt-1 text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(250,204,21,0.55)]">
                還都南京
              </div>
              <div className="mt-1.5 font-mono-bbs text-xs tracking-[0.18em] text-blue-200">
                青天白日滿地紅 · 金馬併福建 · 港平寧開票
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected County Live Dossier Inspector */}
      <div className="border-t border-[#243044] bg-[#101622] px-3.5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white">{activeCounty.id}</span>
            <span className="font-mono-bbs text-xs text-slate-400">
              {activeCounty.code} · 選舉權重 {(activeCounty.electorateWeight * 100).toFixed(1)}%
              {activeCounty.isTemporary ? ' · 行憲臨時選區' : ''}
            </span>
          </div>
          <span
            className={`font-mono-bbs text-xs font-semibold tabular-nums ${
              activeCounty.deltaKmt > 0
                ? 'text-blue-400'
                : activeCounty.deltaKmt < 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
            }`}
          >
            藍營變動{' '}
            {activeCounty.deltaKmt >= 0
              ? `+${activeCounty.deltaKmt.toFixed(2)}%`
              : `${activeCounty.deltaKmt.toFixed(2)}%`}
          </span>
        </div>

        <div className="mt-2 flex h-2.5 w-full overflow-hidden bg-[#1E293B]">
          <div
            className="bg-blue-600 transition-all duration-200"
            style={{ width: `${activeCounty.current.kmt}%` }}
          />
          <div
            className="bg-emerald-600 transition-all duration-200"
            style={{ width: `${activeCounty.current.dpp}%` }}
          />
          <div
            className="bg-cyan-500 transition-all duration-200"
            style={{ width: `${activeCounty.current.tpp}%` }}
          />
          {(activeCounty.current.minge ?? 0) > 0 && (
            <div
              className="bg-purple-600 transition-all duration-200"
              style={{ width: `${activeCounty.current.minge ?? 0}%` }}
            />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono-bbs text-xs tabular-nums">
          <span className="text-blue-400 font-semibold">
            國民黨 {activeCounty.current.kmt.toFixed(1)}%
          </span>
          <span className="text-emerald-400 font-semibold">
            民進黨 {activeCounty.current.dpp.toFixed(1)}%
          </span>
          <span className="text-cyan-400 font-semibold">
            民眾黨 {activeCounty.current.tpp.toFixed(1)}%
          </span>
          {(activeCounty.current.minge ?? 0) > 0 && (
            <span className="text-purple-400 font-semibold">
              民革 {(activeCounty.current.minge ?? 0).toFixed(1)}%
            </span>
          )}
          {!((activeCounty.current.minge ?? 0) > 0) && mingeActive && (
            <span className="text-purple-400/70 font-semibold">民革 0.0%</span>
          )}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          <span className="text-slate-400">地方選情：</span>
          {activeCounty.factionNote}
        </p>
      </div>
    </div>
  );
}
