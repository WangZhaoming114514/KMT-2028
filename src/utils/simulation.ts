import {
  HK_TEMPORARY_COUNTIES,
  INITIAL_COUNTIES,
  MAINLAND_TEMPORARY_COUNTIES,
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

function normalizeShares(kmt: number, dpp: number, tpp: number): VoteShares {
  const k = Math.max(4, kmt);
  const d = Math.max(4, dpp);
  const t = Math.max(3, tpp);
  const total = k + d + t;
  return {
    kmt: Number(((k / total) * 100).toFixed(2)),
    dpp: Number(((d / total) * 100).toFixed(2)),
    tpp: Number(((t / total) * 100).toFixed(2)),
  };
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

    // Distribute remaining shift smoothly
    const nextKmt = county.current.kmt + kmtShift;
    const nextDpp = county.current.dpp + dppExtra - (tppExtra !== 0 ? tppExtra * 0.25 : 0);
    const nextTpp =
      county.current.tpp +
      (tppExtra !== 0 ? tppExtra : -kmtShift * 0.25);

    const normalized = normalizeShares(nextKmt, nextDpp, nextTpp);
    return {
      ...county,
      current: normalized,
      deltaKmt: Number((normalized.kmt - county.current.kmt).toFixed(2)),
    };
  });
}

const PROVINCE_TO_COUNTY_ID: Record<
  'guangdong' | 'minnan' | 'minbei' | 'shanghai_zhejiang' | 'nanjing',
  string
> = {
  minnan: '閩南廈漳泉臨時選區',
  minbei: '閩北福州臨時選區',
  guangdong: '廣東行憲臨時選區',
  shanghai_zhejiang: '上海浙江臨時選區',
  nanjing: '南京首都特別選區',
};

export type CapturedMainlandProvinceKey = keyof typeof PROVINCE_TO_COUNTY_ID;

export function applyWarVictoryOutcomeToCounties(
  counties: CountyState[],
  endingId: 15 | 16 | 17 | 18,
  capturedProvinces: CapturedMainlandProvinceKey[] = [],
  capturedHk: boolean = false
): CountyState[] {
  // If Taiwan fell (ending 17), remove temporary districts if any and freeze
  if (endingId === 17) {
    return counties.filter((c) => !c.isTemporary);
  }

  // Massive patriotic & victory vote surge across Taiwan for defeating the CCP
  const kmtBoost = endingId === 15 ? 20 : endingId === 16 ? 13.5 : 9.5;
  const boosted = counties.map((c) => {
    const next = normalizeShares(
      c.current.kmt + kmtBoost,
      c.current.dpp - kmtBoost * 0.62,
      c.current.tpp - kmtBoost * 0.38
    );
    return {
      ...c,
      current: next,
      deltaKmt: Number((next.kmt - c.current.kmt).toFixed(2)),
    };
  });

  const existingIds = new Set(boosted.map((c) => c.id));
  const extra: CountyState[] = [];

  if (endingId === 15 || endingId === 16 || capturedHk) {
    for (const hk of HK_TEMPORARY_COUNTIES) {
      if (!existingIds.has(hk.id)) extra.push({ ...hk });
    }
  }
  if (endingId === 15) {
    for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
      if (!existingIds.has(ml.id)) extra.push({ ...ml });
    }
  } else if (capturedProvinces.length > 0) {
    const wantedIds = new Set(capturedProvinces.map((p) => PROVINCE_TO_COUNTY_ID[p]));
    for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
      if (wantedIds.has(ml.id) && !existingIds.has(ml.id)) {
        extra.push({ ...ml });
      }
    }
  }

  return [...boosted, ...extra];
}

export function appendTemporaryDistrictsForFlags(
  counties: CountyState[],
  flags: string[]
): CountyState[] {
  const existingIds = new Set(counties.map((c) => c.id));
  const extra: CountyState[] = [];
  if (
    flags.includes('hk_restoration') ||
    flags.includes('war_hk_victory') ||
    flags.includes('guoguang_victory')
  ) {
    for (const hk of HK_TEMPORARY_COUNTIES) {
      if (!existingIds.has(hk.id)) extra.push({ ...hk });
    }
  }
  if (flags.includes('guoguang_victory')) {
    for (const ml of MAINLAND_TEMPORARY_COUNTIES) {
      if (!existingIds.has(ml.id)) extra.push({ ...ml });
    }
  } else {
    for (const [provKey, countyId] of Object.entries(PROVINCE_TO_COUNTY_ID)) {
      if (flags.includes(`captured_prov_${provKey}`) && !existingIds.has(countyId)) {
        const found = MAINLAND_TEMPORARY_COUNTIES.find((ml) => ml.id === countyId);
        if (found) extra.push({ ...found });
      }
    }
  }
  return extra.length > 0 ? [...counties, ...extra] : counties;
}

export function computeNationalShares(counties: CountyState[]): VoteShares {
  let kmt = 0;
  let dpp = 0;
  let tpp = 0;
  let totalWeight = 0;

  for (const c of counties) {
    kmt += c.current.kmt * c.electorateWeight;
    dpp += c.current.dpp * c.electorateWeight;
    tpp += c.current.tpp * c.electorateWeight;
    totalWeight += c.electorateWeight;
  }

  if (totalWeight <= 0) return { kmt: 33.5, dpp: 40.0, tpp: 26.5 };
  return normalizeShares(kmt / totalWeight, dpp / totalWeight, tpp / totalWeight);
}

