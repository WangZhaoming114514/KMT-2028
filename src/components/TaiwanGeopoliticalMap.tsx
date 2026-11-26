import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import taiwanTopologyRaw from 'taiwan-atlas/counties-10t.json';
import eastAsiaGeoRaw from '../data/eastAsiaGeo.json';
import { ALL_CHINA_PROVINCES, CHINA_PROVINCE_THEATERS } from '../data/chinaProvinces';
import { CampaignStats, CountyState, MapMode } from '../types/game';
import { ChinaTheaterFlag } from './ChinaTheaterFlags';

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
}: TaiwanGeopoliticalMapProps) {
  const [hoveredCountyId, setHoveredCountyId] = useState<string | null>(null);

  const taiwanFallen = endingId === 17;
  const guoguangVictory = !taiwanFallen && (flags.includes('guoguang_victory') || endingId === 15);
  const warCcpDefeated =
    !taiwanFallen &&
    (guoguangVictory ||
      endingId === 16 ||
      endingId === 18 ||
      flags.includes('war_hk_victory') ||
      flags.includes('war_defense_victory'));
  const guoguangActive =
    !taiwanFallen && flags.includes('guoguang_restarted') && !guoguangVictory;
  const hkActive =
    !taiwanFallen &&
    (endingId === 16 || guoguangVictory || flags.includes('hk_restoration'));

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

  const countyLookup = useMemo(() => {
    const map = new Map<string, CountyState>();
    for (const c of counties) map.set(c.id, c);
    return map;
  }, [counties]);

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
            [
              [16, 238],
              [118, 326],
            ],
            penghuFeat as Feature
          )
        )(penghuFeat) ?? ''
      : '';

    const hkInsetPath = hkFeat
      ? geoPath().projection(
          geoMercator().fitExtent(
            [
              [18, 468],
              [118, 542],
            ],
            hkFeat as Feature
          )
        )(hkFeat) ?? ''
      : '';

    // South China Sea Inset Projection (Bottom-left/center box: X=148..300, Y=444..550)
    const scsProjection = geoMercator()
      .center([112.4, 12.6])
      .scale(500)
      .translate([222, 502]);
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
      yongxing: scsProjection([112.34, 16.83]) ?? [190, 466],
      taiping: scsProjection([114.36, 10.37]) ?? [224, 524],
      meiji: scsProjection([115.53, 9.9]) ?? [246, 530],
    };

    const fujianPt = projection([119.3, 25.8]) ?? [280, 220];
    const xiamenPt = projection([118.1, 24.48]) ?? [225, 280];
    const hkPt = projection([114.17, 22.32]) ?? [115, 340];
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
    const chinaFlagPt = projection([113.0, 30.3]) ?? [185, 96];

    return {
      eaPaths,
      chinaPaths,
      allChinaProvincePaths,
      provincePaths,
      twPaths,
      kinmenInsetPath,
      matsuInsetPath,
      penghuInsetPath,
      hkInsetPath,
      scsLandPaths,
      scsInsetPts,
      fujianPt,
      xiamenPt,
      hkPt,
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
      chinaFlagPt,
    };
  }, [eastAsiaFeatures, taiwanFeatures, mapMode]);

  const activeCounty =
    countyLookup.get(hoveredCountyId ?? selectedCountyId) ?? countyLookup.get('台北市')!;

  const ccpLevelLabel = taiwanFallen
    ? '台灣全境淪陷'
    : guoguangVictory
      ? '三民主義統一中國'
      : warCcpDefeated
        ? '共軍攻勢潰敗'
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
            台灣22縣市特寫
          </button>
        </div>
      </div>

      {/* Geopolitical Status Strip */}
      <div className="grid grid-cols-2 border-b border-[#243044] bg-[#0A0F18] text-xs">
        <div className="flex items-center justify-between border-r border-[#243044] px-3 py-1.5">
          <span className="text-slate-400 whitespace-nowrap">
            {guoguangVictory ? '大陸重光 · 台海南海' : '中共壓力 · 台海南海'}
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
              ★ 國光大捷：大陸五省與香港行憲臨時選區已納入開票，全境轉藍！
            </span>
          )}
          {guoguangActive && (
            <span className="font-bold text-amber-300">
              ★ 國光計畫兵推啟動：中共壓力 ≥ 68% 即觸發跨海反攻戰！
            </span>
          )}
          {hkActive && (
            <span className="font-bold text-cyan-300">
              ★ 香港再光：香港地圖已轉為青天白日藍！
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

          <rect width={SVG_W} height={SVG_H} fill="url(#seaGrid)" />

          {/* Seamless Base Countries (zero middle crack in China, complete SEA!) */}
          {regionalGeometry.eaPaths.map((ea) => {
            const isChina = ea.name === 'China';
            const isHongKong = ea.name === 'Hong Kong';
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
              fill = guoguangVictory
                ? '#1D4ED8'
                : !warCcpDefeated && (stats.ccpTension >= 75 || taiwanFallen)
                  ? '#3A151B'
                  : taiwanFallen
                    ? '#3A151B'
                    : '#24181F';
              stroke = guoguangVictory
                ? '#FACC15'
                : !warCcpDefeated && (stats.ccpTension >= 75 || taiwanFallen)
                  ? '#EF4444'
                  : taiwanFallen
                    ? '#EF4444'
                    : '#5E3841';
            } else if (isHongKong) {
              fill = hkActive ? '#2563EB' : '#9F1239';
              stroke = hkActive ? '#FACC15' : '#FB7185';
            } else if (isMacao) {
              fill = guoguangVictory ? '#2563EB' : '#6B212E';
              stroke = guoguangVictory ? '#FACC15' : '#FB7185';
            } else if (isJapan) {
              fill = hasUsJpKrPact || stats.japanPosture >= 72 ? '#132B3E' : '#182330';
              stroke = hasUsJpKrPact || stats.japanPosture >= 72 ? '#38BDF8' : '#3E556B';
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
                strokeWidth={isHongKong ? 1.4 : isChina && guoguangVictory ? 1.3 : 0.85}
                opacity={mapMode === 'REGIONAL' ? 0.96 : 0.38}
                className={
                  isHongKong && countyLookup.get('香港行憲特別選區')
                    ? 'cursor-pointer'
                    : undefined
                }
                onClick={() => {
                  if (isHongKong && countyLookup.get('香港行憲特別選區')) {
                    onSelectCounty('香港行憲特別選區');
                  }
                }}
              >
                {isHongKong && (
                  <title>
                    {hkActive
                      ? '香港（青天白日藍 · 點擊檢視香港行憲特別選區）'
                      : '香港（中共控制區）'}
                  </title>
                )}
              </path>
            );
          })}

          {/* Real Natural Earth 10m Provincial Borders + Liberated Province Overlays */}
          <g clipPath="url(#mapChinaMasterClip)" opacity={mapMode === 'REGIONAL' ? 1 : 0.4}>
            {regionalGeometry.allChinaProvincePaths.map((cp) => (
              <path
                key={cp.id}
                d={cp.d}
                fill="none"
                stroke={guoguangVictory ? '#60A5FA' : '#5E2A34'}
                strokeWidth="0.65"
                strokeOpacity={guoguangVictory ? 0.45 : 0.75}
                pointerEvents="none"
              />
            ))}

            {regionalGeometry.provincePaths.map((prov) => {
              const tempCounty = countyLookup.get(prov.tempCountyId);
              const liberated = !taiwanFallen && (guoguangVictory || Boolean(tempCounty));
              if (!liberated) return null;

              return (
                <g
                  key={prov.id}
                  clipPath={`url(#m-prov-clip-${prov.id})`}
                  className={tempCounty ? 'cursor-pointer' : undefined}
                  onClick={() => {
                    if (tempCounty) onSelectCounty(tempCounty.id);
                  }}
                >
                  {prov.paths.map((pd, i) => (
                    <g key={`${prov.id}-fill-${i}`}>
                      <path d={pd} fill="#1D4ED8" stroke="#60A5FA" strokeWidth="0.8" />
                      <path
                        d={pd}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="8"
                        strokeOpacity="0.3"
                      />
                      <path
                        d={pd}
                        fill="none"
                        stroke="#BAE6FD"
                        strokeWidth="2"
                        strokeOpacity="0.6"
                      />
                    </g>
                  ))}
                  <title>{`${prov.name}（點擊檢視${prov.tempCountyId}）`}</title>
                </g>
              );
            })}
          </g>

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
                transform={`translate(${Math.max(12, regionalGeometry.xiamenPt[0] - 152)}, ${Math.max(16, regionalGeometry.xiamenPt[1] - 104)})`}
              >
                <rect
                  width="180"
                  height="36"
                  fill={guoguangVictory ? '#0F2557' : '#181218'}
                  fillOpacity="0.92"
                  stroke={guoguangVictory ? '#FACC15' : '#7F1D1D'}
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y="15"
                  fill={guoguangVictory ? '#93C5FD' : '#FCA5A5'}
                  fontSize="10.5"
                  fontWeight="700"
                >
                  {guoguangVictory
                    ? '中華民國 · 三民主義統一中國'
                    : warCcpDefeated
                      ? '中共戰區（主力已潰敗）'
                      : '中共 · 東部/南部戰區'}
                </text>
                <text x="8" y="29" fill="#E2E8F0" fontSize="9.5" className="font-mono-bbs">
                  {guoguangVictory
                    ? '中國大陸各省與香港行憲選區開票中'
                    : warCcpDefeated
                      ? '我軍掌握海空權 · 敵無法再犯'
                      : `壓力 ${stats.ccpTension}% · ${ccpLevelLabel}`}
                </text>
              </g>

              <ChinaTheaterFlag
                x={regionalGeometry.chinaFlagPt[0]}
                y={regionalGeometry.chinaFlagPt[1]}
                width={90}
                height={60}
                liberated={guoguangVictory}
                taiwanFallen={taiwanFallen}
              />

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

              {/* Hong Kong Callout + Inset Zoom */}
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
              <circle
                cx={regionalGeometry.hkPt[0]}
                cy={regionalGeometry.hkPt[1]}
                r={hkActive ? 9 : 6}
                fill="none"
                stroke={hkActive ? '#FACC15' : '#FB7185'}
                strokeWidth={1.3}
              />
              <g
                transform="translate(10, 444)"
                className={countyLookup.get('香港行憲特別選區') ? 'cursor-pointer' : undefined}
                onClick={() => {
                  if (countyLookup.get('香港行憲特別選區')) {
                    onSelectCounty('香港行憲特別選區');
                  }
                }}
              >
                <rect
                  width="132"
                  height="106"
                  fill="#09111E"
                  fillOpacity="0.93"
                  stroke={hkActive ? '#3B82F6' : '#9F1239'}
                  strokeWidth={1.2}
                />
                <text
                  x="8"
                  y="16"
                  fill={hkActive ? '#FACC15' : '#FDA4AF'}
                  fontSize="10"
                  fontWeight="700"
                >
                  {hkActive ? '香港特寫 · 再光藍天' : taiwanFallen ? '香港特寫 · 全境赤化' : '香港地圖特寫 (HK)'}
                </text>
                <path
                  d={regionalGeometry.hkInsetPath}
                  fill={hkActive ? '#2563EB' : '#9F1239'}
                  stroke={hkActive ? '#FACC15' : '#FDA4AF'}
                  strokeWidth={1.1}
                />
              </g>

              {/* South China Sea Inset Frame */}
              <g>
                <defs>
                  <clipPath id="scsInsetClip">
                    <rect x="148" y="444" width="152" height="106" />
                  </clipPath>
                </defs>
                <rect
                  x="148"
                  y="444"
                  width="152"
                  height="106"
                  fill="#071324"
                  fillOpacity="0.95"
                  stroke={scsReinforced ? '#38BDF8' : '#334155'}
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
                    fill={guoguangVictory ? '#2563EB' : '#DC2626'}
                    stroke="#FCA5A5"
                    strokeWidth="0.8"
                  />
                  <text
                    x={regionalGeometry.scsInsetPts.yongxing[0] + 6}
                    y={regionalGeometry.scsInsetPts.yongxing[1] + 3}
                    fill={guoguangVictory ? '#93C5FD' : '#FCA5A5'}
                    fontSize="8.5"
                    fontWeight="700"
                  >
                    {guoguangVictory ? '西沙永興(藍)' : '中共·永興島'}
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
                    fill={guoguangVictory ? '#2563EB' : '#DC2626'}
                    stroke="#FCA5A5"
                    strokeWidth="0.8"
                  />
                  <text
                    x={regionalGeometry.scsInsetPts.meiji[0] + 5}
                    y={regionalGeometry.scsInsetPts.meiji[1] + 4}
                    fill={guoguangVictory ? '#93C5FD' : '#FCA5A5'}
                    fontSize="8"
                    fontWeight="700"
                  >
                    美濟礁
                  </text>
                </g>
                <text x="155" y="458" fill="#7DD3FC" fontSize="9.5" fontWeight="700">
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
              const cState = countyLookup.get(tp.id);
              const isSelected = selectedCountyId === tp.id;
              const isHovered = hoveredCountyId === tp.id;
              const fill = getCountyFill(cState, endingId, warOccupiedSet, warCcpDefeated);

              return (
                <path
                  key={tp.id}
                  d={tp.d}
                  fill={fill}
                  fillOpacity={isSelected ? 1 : isHovered ? 0.95 : 0.86}
                  stroke={isSelected ? '#FACC15' : isHovered ? '#FFFFFF' : '#0B1220'}
                  strokeWidth={isSelected ? 2.1 : isHovered ? 1.5 : 0.65}
                  className="cursor-pointer transition-opacity duration-150"
                  onMouseEnter={() => setHoveredCountyId(tp.id)}
                  onMouseLeave={() => setHoveredCountyId(null)}
                  onClick={() => onSelectCounty(tp.id)}
                >
                  <title>{`${tp.id}｜藍 ${cState?.current.kmt.toFixed(1)}% · 綠 ${cState?.current.dpp.toFixed(1)}% · 白 ${cState?.current.tpp.toFixed(1)}%`}</title>
                </path>
              );
            })}
          </g>

          {/* Offshore Islands Inset Frames in TAIWAN_FOCUS mode */}
          {mapMode === 'TAIWAN_FOCUS' && (
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
                      fill={getCountyFill(cState, endingId, warOccupiedSet, warCcpDefeated)}
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
            <rect x="165" y="27" width="10" height="10" fill="#DC2626" />
            <text x="178" y="36" fill="#FCA5A5" fontSize="9.5">淪陷/共</text>
          </g>
        </svg>
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
        </div>

        <div className="mt-2 flex items-center justify-between font-mono-bbs text-xs tabular-nums">
          <span className="text-blue-400 font-semibold">
            國民黨 {activeCounty.current.kmt.toFixed(1)}%
          </span>
          <span className="text-emerald-400 font-semibold">
            民進黨 {activeCounty.current.dpp.toFixed(1)}%
          </span>
          <span className="text-cyan-400 font-semibold">
            民眾黨 {activeCounty.current.tpp.toFixed(1)}%
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          <span className="text-slate-400">地方選情：</span>
          {activeCounty.factionNote}
        </p>
      </div>
    </div>
  );
}
