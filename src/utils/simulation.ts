import { INITIAL_COUNTIES } from '../data/counties';
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
