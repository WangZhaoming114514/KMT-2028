import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import taiwanTopologyRaw from 'taiwan-atlas/counties-10t.json';
import eastAsiaGeoRaw from '../data/eastAsiaGeo.json';
import { CampaignStats, CountyState, MapMode } from '../types/game';

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
  warOccupied?: Set<string>
): string {
  if (endingId === 17) return '#B91C1C';
  if (county && warOccupied?.has(county.id)) return '#DC2626';
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

  const guoguangVictory = flags.includes('guoguang_victory') || endingId === 15;
  const guoguangActive = flags.includes('guoguang_restarted') && !guoguangVictory;
  const hkActive = flags.includes('hk_restoration') || endingId === 16;
  const diaoyuPatrol = flags.includes('diaoyu_patrol');
  const diaoyuCompromise = flags.includes('diaoyu_compromise');

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
    // Broad frame including Mainland China, Hong Kong, Philippines (neutral), Korea/Japan, Diaoyu Islands, and Taiwan
    const projection = geoMercator()
      .center(mapMode === 'REGIONAL' ? [120.0, 23.65] : [121.45, 23.85])
      .scale(mapMode === 'REGIONAL' ? 1680 : 7700)
      .translate(
        mapMode === 'REGIONAL' ? [SVG_W * 0.5, SVG_H * 0.52] : [SVG_W * 0.58, SVG_H * 0.49]
      );

    const pathGen = geoPath().projection(projection);

    const eaPaths = eastAsiaFeatures.map((f, idx) => ({
      id: `${f.properties?.name ?? 'ea'}-${idx}`,
      name: f.properties?.name ?? '',
      d: pathGen(f) ?? '',
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
              [18, 466],
              [118, 544],
            ],
            hkFeat as Feature
          )
        )(hkFeat) ?? ''
      : '';

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
    const vietnamPt = projection([107.2, 20.5]) ?? [42, 405];
    const taipeiPt = projection([121.56, 25.04]) ?? [378, 255];
    const kaohsiungPt = projection([120.3, 22.63]) ?? [325, 360];

    return {
      eaPaths,
      twPaths,
      kinmenInsetPath,
      matsuInsetPath,
      penghuInsetPath,
      hkInsetPath,
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
      taipeiPt,
      kaohsiungPt,
    };
  }, [eastAsiaFeatures, taiwanFeatures, mapMode]);

  const activeCounty =
    countyLookup.get(hoveredCountyId ?? selectedCountyId) ?? countyLookup.get('台北市')!;

  const ccpLevelLabel = guoguangVictory
    ? '國光光復翻藍'
    : stats.ccpTension >= 75
      ? '紅色攻台臨界'
      : stats.ccpTension >= 50
        ? '黃色演訓升溫'
        : '常態監控巡航';

  const usJpLevelLabel =
    stats.japanPosture >= 72
      ? '美日聯防力挺'
      : stats.japanPosture >= 40
        ? '一般安保觀察'
        : '疑美疑日降溫';

  const diaoyuStatusLabel = diaoyuPatrol
    ? '釣魚台強硬護漁中'
    : diaoyuCompromise
      ? '釣魚台漁業協議降溫'
      : '釣魚台主權爭議巡弋';

  return (
    <div className="flex flex-col border border-[#243044] bg-[#0D131F]">
      {/* Map Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#243044] bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold tracking-wide text-slate-100">即時戰情開票地圖</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono-bbs text-slate-400">22縣市 + 港閩 + 釣魚台 + 菲韓越日</span>
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
            東亞全景(含中立國)
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
          <span className="text-slate-400 whitespace-nowrap">中共壓力 · 東部戰區</span>
          <span
            className={`font-mono-bbs font-semibold whitespace-nowrap ${
              guoguangVictory
                ? 'text-blue-400'
                : stats.ccpTension >= 75
                  ? 'text-red-400'
                  : stats.ccpTension >= 50
                    ? 'text-amber-400'
                    : 'text-slate-300'
            }`}
          >
            {guoguangVictory ? '全境光復' : `${stats.ccpTension}% ${ccpLevelLabel}`}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-slate-400 whitespace-nowrap">美日態度 · 釣魚台/沖繩</span>
          <span
            className={`font-mono-bbs font-semibold whitespace-nowrap ${
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
      {(guoguangVictory || guoguangActive || hkActive || diaoyuPatrol) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#243044] bg-[#161B2E] px-3 py-1.5 font-mono-bbs text-[11px]">
          {guoguangVictory && (
            <span className="font-bold text-blue-300">
              ★ 國光計畫成功：中國大陸地圖已全境轉為青天白日藍！
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
          {diaoyuPatrol && (
            <span className="font-bold text-amber-200">
              ★ 保釣宣言：{diaoyuStatusLabel}
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
          aria-label="台灣22縣市與中國大陸、香港、釣魚台、日本、菲律賓、韓國周邊即時選情地圖"
        >
          <defs>
            <pattern id="seaGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#152338"
                strokeWidth="0.7"
              />
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
          </defs>

          <rect width={SVG_W} height={SVG_H} fill="url(#seaGrid)" />

          {/* Neighboring China, HK, Macao, Japan & Neutral Nations (Philippines, South Korea, North Korea, Vietnam) */}
          {regionalGeometry.eaPaths.map((ea) => {
            const isChina = ea.name === 'China';
            const isHongKong = ea.name === 'Hong Kong';
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
              if (guoguangVictory) {
                fill = '#1D4ED8';
                stroke = '#FACC15';
              } else {
                fill = stats.ccpTension >= 75 ? '#3A151B' : '#24181F';
                stroke = stats.ccpTension >= 75 ? '#EF4444' : '#5E3841';
              }
            } else if (isHongKong) {
              fill = hkActive || guoguangVictory ? '#2563EB' : '#8B2635';
              stroke = hkActive || guoguangVictory ? '#FACC15' : '#FB7185';
            } else if (isMacao) {
              fill = guoguangVictory ? '#2563EB' : '#6B212E';
              stroke = guoguangVictory ? '#FACC15' : '#FB7185';
            } else if (isJapan) {
              fill = stats.japanPosture >= 72 ? '#132B3E' : '#182330';
              stroke = stats.japanPosture >= 72 ? '#38BDF8' : '#3E556B';
            } else if (isNeutral) {
              // Nearby neutral nations in calm slate-olive neutral tone
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
                opacity={mapMode === 'REGIONAL' ? 0.96 : 0.4}
              >
                {isHongKong && <title>香港（港島·九龍·新界·大嶼山）</title>}
                {isChina && (
                  <title>
                    {guoguangVictory
                      ? '中華民國大陸光復區（國光大捷・全境變藍）'
                      : '中國大陸（中共東部／南部戰區）'}
                  </title>
                )}
                {ea.name === 'Philippines' && <title>菲律賓（中立鄰國 · 巴士海峽南端）</title>}
                {ea.name === 'South Korea' && <title>大韓民國（中立鄰國）</title>}
                {ea.name === 'Vietnam' && <title>越南（中立鄰國）</title>}
              </path>
            );
          })}

          {/* Regional Strait, Diaoyu Islands, Neutral Nations, HK, and US-Japan Overlays */}
          {mapMode === 'REGIONAL' && (
            <g>
              <line
                x1={regionalGeometry.medianTop[0]}
                y1={regionalGeometry.medianTop[1]}
                x2={regionalGeometry.medianBot[0]}
                y2={regionalGeometry.medianBot[1]}
                stroke={guoguangVictory ? '#60A5FA' : stats.ccpTension >= 70 ? '#EF4444' : '#F59E0B'}
                strokeWidth={stats.ccpTension >= 70 ? 1.8 : 1.1}
                strokeDasharray="5 4"
                opacity={0.85}
              />

              {/* Project Guoguang Counter-Attack Arrows */}
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
                    {guoguangVictory ? '國光大捷！大陸翻藍' : '國光反攻箭頭'}
                  </text>
                </g>
              )}

              {/* China Label Box */}
              <g
                transform={`translate(${Math.max(12, regionalGeometry.xiamenPt[0] - 138)}, ${Math.max(18, regionalGeometry.xiamenPt[1] - 96)})`}
              >
                <rect
                  width="156"
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
                  {guoguangVictory ? '中華民國 · 大陸光復區' : '中共 · 東部/南部戰區'}
                </text>
                <text x="8" y="29" fill="#E2E8F0" fontSize="9.5" className="font-mono-bbs">
                  {guoguangVictory
                    ? '三民主義重返大陸 · 全境藍色'
                    : `壓力 ${stats.ccpTension}% · ${ccpLevelLabel}`}
                </text>
              </g>

              {/* Diaoyu / Senkaku Islands Sovereignty Marker */}
              <g transform={`translate(${regionalGeometry.diaoyuPt[0]}, ${regionalGeometry.diaoyuPt[1]})`}>
                <polygon
                  points="0,-6 6,0 0,6 -6,0"
                  fill={diaoyuPatrol ? '#FACC15' : '#FB923C'}
                  stroke="#090D16"
                  strokeWidth="1"
                />
                <g transform="translate(8, -14)">
                  <rect
                    width="124"
                    height="30"
                    fill="#141824"
                    fillOpacity="0.92"
                    stroke={diaoyuPatrol ? '#FACC15' : '#FB923C'}
                    strokeWidth="0.9"
                  />
                  <text x="6" y="13" fill="#FDE68A" fontSize="10" fontWeight="700">
                    釣魚島（釣魚台列嶼）
                  </text>
                  <text x="6" y="25" fill="#CBD5E1" fontSize="9" className="font-mono-bbs">
                    {diaoyuStatusLabel}
                  </text>
                </g>
              </g>

              {/* Neutral Neighbors Labels: Philippines, South Korea, Vietnam */}
              {regionalGeometry.luzonPt[1] < SVG_H - 16 && (
                <g transform={`translate(${regionalGeometry.luzonPt[0] - 28}, ${regionalGeometry.luzonPt[1]})`}>
                  <rect width="92" height="22" fill="#111A20" fillOpacity="0.88" stroke="#4B636E" strokeWidth="0.8" />
                  <text x="46" y="14" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontWeight="600">
                    菲律賓 · 中立國
                  </text>
                </g>
              )}
              {regionalGeometry.koreaPt[1] > 8 && regionalGeometry.koreaPt[0] < SVG_W - 70 && (
                <g transform={`translate(${regionalGeometry.koreaPt[0] - 40}, ${regionalGeometry.koreaPt[1]})`}>
                  <rect width="84" height="22" fill="#111A20" fillOpacity="0.88" stroke="#4B636E" strokeWidth="0.8" />
                  <text x="42" y="14" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontWeight="600">
                    南韓 · 中立國
                  </text>
                </g>
              )}
              {regionalGeometry.vietnamPt[0] > 4 && (
                <g transform={`translate(${Math.max(10, regionalGeometry.vietnamPt[0] - 12)}, ${regionalGeometry.vietnamPt[1]})`}>
                  <rect width="84" height="22" fill="#111A20" fillOpacity="0.88" stroke="#4B636E" strokeWidth="0.8" />
                  <text x="42" y="14" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontWeight="600">
                    越南 · 中立國
                  </text>
                </g>
              )}

              {/* Real Hong Kong Map Callout + Inset Zoom */}
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
                r={hkActive || guoguangVictory ? 9 : 6}
                fill="none"
                stroke={hkActive || guoguangVictory ? '#FACC15' : '#FB7185'}
                strokeWidth={1.3}
              />
              <g transform="translate(12, 444)">
                <rect
                  width="136"
                  height="106"
                  fill="#09111E"
                  fillOpacity="0.93"
                  stroke={hkActive || guoguangVictory ? '#3B82F6' : '#475569'}
                  strokeWidth={1.2}
                />
                <text
                  x="8"
                  y="16"
                  fill={hkActive || guoguangVictory ? '#FACC15' : '#FDA4AF'}
                  fontSize="10.5"
                  fontWeight="700"
                >
                  {hkActive || guoguangVictory ? '香港特寫 · 再光藍天' : '香港地圖特寫 (HK)'}
                </text>
                <path
                  d={regionalGeometry.hkInsetPath}
                  fill={hkActive || guoguangVictory ? '#2563EB' : '#9F1239'}
                  stroke={hkActive || guoguangVictory ? '#FACC15' : '#FDA4AF'}
                  strokeWidth={1.1}
                />
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
                transform={`translate(${Math.min(SVG_W - 156, regionalGeometry.yonaguniPt[0] + 8)}, ${regionalGeometry.yonaguniPt[1] + 6})`}
              >
                <rect width="146" height="36" fill="#0F1C2B" fillOpacity="0.92" stroke="#0284C7" strokeWidth="0.9" />
                <text x="8" y="15" fill="#7DD3FC" fontSize="10.5" fontWeight="700">
                  美日同盟 · 與那國/沖繩
                </text>
                <text x="8" y="29" fill="#E2E8F0" fontSize="9.5" className="font-mono-bbs">
                  美日態度 {stats.japanPosture}% · {usJpLevelLabel}
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
              const fill = getCountyFill(cState, endingId, warOccupiedSet);

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
                      fill={getCountyFill(cState, endingId, warOccupiedSet)}
                      stroke={isSelected ? '#FACC15' : '#0B1220'}
                      strokeWidth={1}
                    />
                  </g>
                );
              })}
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
            <rect x="165" y="27" width="10" height="10" fill="#1C262B" stroke="#4B636E" />
            <text x="178" y="36" fill="#94A3B8" fontSize="9.5">中立</text>
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
            </span>
          </div>
          <span
            className={`font-mono-bbs text-xs font-semibold ${
              activeCounty.deltaKmt > 0
                ? 'text-blue-400'
                : activeCounty.deltaKmt < 0
                  ? 'text-rose-400'
                  : 'text-slate-400'
            }`}
          >
            本回合藍營變動{' '}
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

        <div className="mt-2 flex items-center justify-between font-mono-bbs text-xs">
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
