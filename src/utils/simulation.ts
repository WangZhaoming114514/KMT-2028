import {
  HK_TEMPORARY_COUNTIES,
  INITIAL_COUNTIES,
  MAINLAND_TEMPORARY_COUNTIES,
  MUNICIPAL_REPLACEMENT_COUNTIES,
} from '../data/counties';
import {
  CampaignStats,
  ChoiceOption,
  CountyState,
  FactionLeader,
  VoteShares,
} from '../types/game';

export function clampStat(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeShares(
  kmt: number,
  dpp: number,
  tpp: number,
  minge = 0
): VoteShares {
  const k = Math.max(4, kmt);
  const d = Math.max(4, dpp);
  const t = Math.max(3, tpp);
  const m = minge > 0 ? Math.max(2, minge) : 0;
  const total = k + d + t + m;
  const shares: VoteShares = {
    kmt: Number(((k / total) * 100).toFixed(2)),
    dpp: Number(((d / total) * 100).toFixed(2)),
    tpp: Number(((t / total) * 100).toFixed(2)),
  };
  if (m > 0) {
    shares.minge = Number(((m / total) * 100).toFixed(2));
  }
  return shares;
}

export function initCountiesForFaction(faction: FactionLeader): CountyState[] {
  return INITIAL_COUNTIES.map((county) => {
    const affinity = faction.regionAffinity[county.region] ?? 0;
    const homeBonus = county.id === faction.homeCounty ? 1.4 : 0;
    const shift = affinity * 1.1 + homeBonus;
    const next = normalizeShares(
      county.baseline.kmt + shift,
      county.baseline.dpp - shift * 0.55,
      county.baseline.tpp - shift * 0.45
    );
    return {
      ...county,
      current: next,
      deltaKmt: Number((next.kmt - county.baseline.kmt).toFixed(2)),
    };
  });
}

export function applyChoiceToCounties(
  counties: CountyState[],
  choice: ChoiceOption,
  faction: FactionLeader,
  stats: CampaignStats
): CountyState[] {
  const unityFactor = stats.unity >= 65 ? 1.06 : stats.unity <= 35 ? 0.84 : 1.0;
  const momentumFactor = stats.momentum >= 75 ? 1.08 : stats.momentum <= 35 ? 0.88 : 1.0;

  // Incumbent DPP also campaigns each round: calibrated so random 24-round runs stay ~50/50
  const incumbentDragKmt = -0.40;
  const incumbentBoostDpp = 0.33;

  return counties.map((county) => {
    const regionalBase = choice.swing[county.region] ?? 0;
    const specific = choice.swing.specificCounties?.[county.id] ?? 0;
    const affinityBonus =
      regionalBase > 0 ? Math.max(0, faction.regionAffinity[county.region] * 0.16) : 0;

    const kmtShift =
      (regionalBase + specific + affinityBonus) * unityFactor * momentumFactor +
      incumbentDragKmt;
    const tppExtra = choice.swing.tppShift ?? 0;
    const dppExtra =
      (choice.swing.dppShift ?? -kmtShift * 0.55) + incumbentBoostDpp;

    const hasMinge = (county.current.minge ?? 0) > 0;
    const mingeShift = hasMinge
      ? (choice.statDelta.unity ?? 0) < 0
        ? 0.35
        : -kmtShift * 0.12
      : 0;

    // Distribute remaining shift smoothly
    const nextKmt = county.current.kmt + kmtShift;
    const nextDpp = county.current.dpp + dppExtra - (tppExtra !== 0 ? tppExtra * 0.25 : 0);
    const nextTpp =
      county.current.tpp +
      (tppExtra !== 0 ? tppExtra : -kmtShift * 0.25);
    const nextMinge = hasMinge ? (county.current.minge ?? 0) + mingeShift : 0;

    const normalized = normalizeShares(nextKmt, nextDpp, nextTpp, nextMinge);
    return {
      ...county,
      current: normalized,
      deltaKmt: Number((normalized.kmt - county.current.kmt).toFixed(2)),
    };
  });
}

const PROVINCE_TO_MACRO_COUNTY_ID: Record<
  'guangdong' | 'minnan' | 'minbei' | 'shanghai_zhejiang' | 'nanjing',
  string
> = {
  minnan: '華南行憲臨時選區',
  minbei: '華南行憲臨時選區',
  guangdong: '華南行憲臨時選區',
  shanghai_zhejiang: '華中行憲臨時選區',
  nanjing: '華中行憲臨時選區',
};

export type CapturedMainlandProvinceKey = keyof typeof PROVINCE_TO_MACRO_COUNTY_ID;

const CORE_MACRO_IDS = new Set([
  '華南行憲臨時選區',
  '華中行憲臨時選區',
  '華北行憲臨時選區',
  '東北行憲臨時選區',
  '西部地區行憲臨時選區',
]);

export function applyWarVictoryOutcomeToCounties(
  counties: CountyState[],
  endingId: 15 | 16 | 17 | 18,
  capturedProvinces: CapturedMainlandProvinceKey[] = [],
  capturedHk: boolean = false,
  saibeiRecovered: boolean = false,
  waidongbeiRecovered: boolean = false
): CountyState[] {
  // If Taiwan fell (ending 17), remove temporary districts if any and freeze
  if (endingId === 17) {
    return counties.filter((c) => !c.isTemporary);
  }

  // Massive patriotic & victory vote surge across Taiwan for defeating the CCP
  const kmtBoost = endingId === 15 ? 20 : endingId === 16 ? 13.5 : 9.5;
  const introduceMinge = endingId === 15;

  // When Mainland China is recovered (ending 15):
  // Merge 金門縣 & 連江縣 into Fujian (華南行憲臨時選區), and replace with 香港, 北平, 南京!
  const filteredBase = introduceMinge
    ? counties.filter(
        (c) => c.id !== '金門縣' && c.id !== '連江縣' && c.id !== '香港行憲特別選區'
      )
    : counties;

  const boosted = filteredBase.map((c) => {
    const existingMinge = c.current.minge ?? 0;
    const mingeVal = introduceMinge
      ? existingMinge > 0
        ? existingMinge
        : c.theaterTag === 'MAINLAND'
          ? 16.0
          : c.theaterTag === 'HK'
            ? 10.0
            : 5.5
      : existingMinge;

    const next = normalizeShares(
      c.current.kmt + kmtBoost,
      c.current.dpp - kmtBoost * 0.62,
      c.current.tpp - kmtBoost * 0.38,
      mingeVal
    );
    return {
      ...c,
      current: next,
      deltaKmt: Number((next.kmt - c.current.kmt).toFixed(2)),
    };
  });

  const existingIds = new Set(boosted.map((c) => c.id));
  const extra: CountyState[] = [];

  if (introduceMinge) {
    for (const mun of MUNICIPAL_REPLACEMENT_COUNTIES) {
      if (!existingIds.has(mun.id)) {
        extra.push({ ...mun });
      }
    }
    for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
      if (CORE_MACRO_IDS.has(ml.id) && !existingIds.has(ml.id)) {
        extra.push({ ...ml });
      }
    }
  } else {
    if (endingId === 16 || capturedHk) {
      for (const hk of HK_TEMPORARY_COUNTIES) {
        if (!existingIds.has(hk.id)) {
          extra.push({ ...hk });
        }
      }
    }
    if (capturedProvinces.length > 0) {
      const wantedIds = new Set(capturedProvinces.map((p) => PROVINCE_TO_MACRO_COUNTY_ID[p]));
      for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
        if (wantedIds.has(ml.id) && !existingIds.has(ml.id)) {
          extra.push({ ...ml });
        }
      }
    }
  }

  if (saibeiRecovered && !existingIds.has('塞北行憲臨時選區')) {
    const saibei = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === '塞北行憲臨時選區');
    if (saibei) extra.push({ ...saibei });
  }

  if (waidongbeiRecovered && !existingIds.has('外東北行憲臨時選區')) {
    const wdb = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === '外東北行憲臨時選區');
    if (wdb) extra.push({ ...wdb });
  }

  return [...boosted, ...extra];
}

export function appendTemporaryDistrictsForFlags(
  counties: CountyState[],
  flags: string[]
): CountyState[] {
  const guoguangWon = flags.includes('guoguang_victory');
  const warWon =
    guoguangWon ||
    flags.includes('war_hk_victory') ||
    flags.includes('war_defense_victory');

  let base = guoguangWon
    ? counties.filter(
        (c) => c.id !== '金門縣' && c.id !== '連江縣' && c.id !== '香港行憲特別選區'
      )
    : counties;

  if (guoguangWon) {
    base = base.map((c) => {
      if ((c.current.minge ?? 0) > 0) return c;
      const mingeVal = c.theaterTag === 'MAINLAND' ? 16.0 : c.theaterTag === 'HK' ? 10.0 : 5.5;
      return {
        ...c,
        current: normalizeShares(c.current.kmt, c.current.dpp, c.current.tpp, mingeVal),
      };
    });
  }

  const existingIds = new Set(base.map((c) => c.id));
  const extra: CountyState[] = [];

  if (guoguangWon) {
    for (const mun of MUNICIPAL_REPLACEMENT_COUNTIES) {
      if (!existingIds.has(mun.id)) {
        extra.push({ ...mun });
      }
    }
    for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
      if (CORE_MACRO_IDS.has(ml.id) && !existingIds.has(ml.id)) {
        extra.push({ ...ml });
      }
    }
  } else {
    if (flags.includes('hk_restoration') || flags.includes('war_hk_victory')) {
      for (const hk of HK_TEMPORARY_COUNTIES) {
        if (!existingIds.has(hk.id)) {
          extra.push({ ...hk });
        }
      }
    }
    for (const [provKey, countyId] of Object.entries(PROVINCE_TO_MACRO_COUNTY_ID)) {
      if (flags.includes(`captured_prov_${provKey}`) && !existingIds.has(countyId)) {
        const found = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === countyId);
        if (found && !extra.some((e) => e.id === found.id)) extra.push({ ...found });
      }
    }
  }

  if (warWon && flags.includes('saibei_recovered') && !existingIds.has('塞北行憲臨時選區')) {
    const saibei = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === '塞北行憲臨時選區');
    if (saibei) extra.push({ ...saibei });
  }

  if (
    warWon &&
    flags.includes('waidongbei_recovered') &&
    !existingIds.has('外東北行憲臨時選區')
  ) {
    const wdb = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === '外東北行憲臨時選區');
    if (wdb) extra.push({ ...wdb });
  }

  return extra.length > 0 ? [...base, ...extra] : base;
}

export function computeNationalShares(counties: CountyState[]): VoteShares {
  let kmt = 0;
  let dpp = 0;
  let tpp = 0;
  let minge = 0;
  let totalWeight = 0;

  for (const c of counties) {
    kmt += c.current.kmt * c.electorateWeight;
    dpp += c.current.dpp * c.electorateWeight;
    tpp += c.current.tpp * c.electorateWeight;
    minge += (c.current.minge ?? 0) * c.electorateWeight;
    totalWeight += c.electorateWeight;
  }

  if (totalWeight <= 0) return { kmt: 33.5, dpp: 40.0, tpp: 26.5 };
  return normalizeShares(kmt / totalWeight, dpp / totalWeight, tpp / totalWeight, minge / totalWeight);
}

