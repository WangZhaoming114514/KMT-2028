import { EndingDefinition, GameEvaluationContext } from '../types/game';
import { ENDINGS_BASE } from './endingsList';

export const ENDINGS = ENDINGS_BASE;

const STORAGE_KEY = 'kmt2028_unlocked_endings_v1';

export function loadUnlockedEndings(): Record<number, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

export function saveUnlockedEnding(endingId: number): Record<number, string> {
  const current = loadUnlockedEndings();
  if (!current[endingId]) {
    current[endingId] = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota errors
    }
  }
  return current;
}

export function saveUnlockedEndings(endingIds: number[]): Record<number, string> {
  const current = loadUnlockedEndings();
  let changed = false;
  const now = new Date().toISOString();
  for (const id of endingIds) {
    if (!current[id]) {
      current[id] = now;
      changed = true;
    }
  }
  if (changed) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore quota errors
    }
  }
  return current;
}

export function shouldTriggerStraitWar(ctx: {
  round: number;
  ccpTension: number;
  flags: string[];
  warAlreadyFought: boolean;
}): boolean {
  if (ctx.warAlreadyFought) return false;
  // Keep primary focus on the 2028 Taiwan Presidential Election unless tension is pushed very high
  if (ctx.ccpTension >= 88 && ctx.round >= 8) return true;
  if (ctx.flags.includes('guoguang_restarted') && ctx.round >= 14 && ctx.ccpTension >= 74) {
    return true;
  }
  return false;
}

export function checkMidGameEnding(ctx: GameEvaluationContext): EndingDefinition | null {
  const { stats, flags, round } = ctx;
  const find = (id: number) => ENDINGS.find((e) => e.id === id)!;

  // Immediate Midnight Livestream Disaster if unity craters severely
  if (flags.includes('midnight_livestream_crash') && stats.unity <= 28) {
    return find(26);
  }
  // Immediate "Swap Candidate 2.0" on severe unity collapse
  if (round >= 12 && stats.unity <= 18) {
    return find(29);
  }
  return null;
}

/**
 * Evaluate the primary 2028 Election MAJOR Ending (1 of 15 MAJOR endings).
 * Election Simulator First: Mainland/HK/NEA territorial outcomes are resolved as SUB endings,
 * while their vote boosts and temporary districts enrich the 2028 Presidential Election tally!
 */
export function evaluateFinalEnding(ctx: GameEvaluationContext): EndingDefinition {
  const { factionId, stats, nationalShares, flags } = ctx;
  const find = (id: number) => ENDINGS.find((e) => e.id === id)!;

  const kmtWon =
    nationalShares.kmt >= nationalShares.dpp && nationalShares.kmt >= nationalShares.tpp;
  const tppWon =
    nationalShares.tpp > nationalShares.kmt && nationalShares.tpp > nationalShares.dpp;

  // 1. Third-Party TPP Upset Election Major Ending (END-25)
  if (tppWon) {
    return find(25);
  }

  // 2. KMT Election Victory Major Endings (END-01..08)
  if (kmtWon) {
    if (nationalShares.kmt >= 47) return find(2);
    if (nationalShares.kmt - nationalShares.dpp < 1.5) return find(8);
    if (flags.includes('blue_white_coalition_success')) return find(3);
    if (factionId === 'chiang') return find(5);
    if (flags.includes('final_122_charge') && nationalShares.kmt >= 42.5) return find(1);
    if (factionId === 'han') return find(6);
    if (factionId === 'jaw') return find(7);
    return find(4);
  }

  // 3. KMT Election Defeat Major Endings (END-09..14)
  if (stats.unity < 35) return find(11);
  if (stats.funds < 25) return find(13);
  if (stats.momentum < 35) return find(12);
  if (flags.includes('junyue_walkout_2')) return find(10);
  if (nationalShares.dpp - nationalShares.kmt <= 3.0) return find(14);
  return find(9);
}

/**
 * Collect all earned SUB endings (territorial achievements, geopolitical side-fates, & election memes)
 * unlocked alongside the 2028 Election MAJOR Ending.
 */
export function evaluateEarnedSubEndings(ctx: GameEvaluationContext): EndingDefinition[] {
  const { factionId, stats, nationalShares, counties, flags } = ctx;
  const find = (id: number) => ENDINGS.find((e) => e.id === id)!;
  const subs: EndingDefinition[] = [];
  const pushUnique = (id: number) => {
    const found = find(id);
    if (found && !subs.some((s) => s.id === found.id)) {
      subs.push(found);
    }
  };

  const kmtWon =
    nationalShares.kmt >= nationalShares.dpp && nationalShares.kmt >= nationalShares.tpp;
  const getCounty = (name: string) => counties.find((c) => c.id === name);
  const hualienKmt = getCounty('花蓮縣')?.current.kmt ?? 50;
  const miaoliKmt = getCounty('苗栗縣')?.current.kmt ?? 41;

  const warCcpCrushed =
    flags.includes('war_defense_victory') ||
    flags.includes('war_hk_victory') ||
    flags.includes('guoguang_victory');

  // Mainland / HK / Northern / NEA Territorial Sub-Endings
  if (flags.includes('nea_ending_33') || flags.includes('waidongbei_recovered')) {
    pushUnique(33);
  }
  if (flags.includes('nea_ending_32') || flags.includes('saibei_recovered')) {
    pushUnique(32);
    pushUnique(34); // Tuva Republic (圖瓦共和國) joyful participation in Saibei constituency!
  }
  if (flags.includes('nea_ending_31')) {
    pushUnique(31);
  }
  if (flags.includes('guoguang_victory')) {
    pushUnique(15);
  }
  if (
    flags.includes('war_hk_victory') ||
    (flags.includes('hk_restoration') && stats.japanPosture >= 72 && (kmtWon || stats.momentum >= 86))
  ) {
    pushUnique(16);
  }
  if (
    flags.includes('war_defense_victory') ||
    (kmtWon && stats.japanPosture >= 78 && (stats.ccpTension >= 68 || flags.includes('diaoyu_transferred')))
  ) {
    pushUnique(18);
  }

  // Non-war Geopolitical Sub-Endings
  if (!warCcpCrushed && stats.ccpTension <= 18 && stats.japanPosture <= 25) {
    pushUnique(19);
  }
  if (!warCcpCrushed && stats.japanPosture <= 16) {
    pushUnique(20);
  }

  // Meme & Local Faction Sub-Endings
  const chaosCount = [
    flags.includes('love_power_meme'),
    flags.includes('final_chaos_meme'),
    flags.includes('midnight_livestream_crash'),
    flags.includes('chongqing_1949_meme'),
    flags.includes('boba_diplomacy'),
    flags.includes('venice_dome_meme'),
    flags.includes('diaoyu_transferred'),
  ].filter(Boolean).length;

  if (chaosCount >= 3) pushUnique(30);
  if (stats.momentum >= 90 && (stats.unity <= 42 || stats.funds <= 34)) pushUnique(21);
  if (flags.includes('death_grip_activated') && factionId === 'ma' && kmtWon) pushUnique(22);
  if (flags.includes('hou_eight_words') && factionId === 'hou' && kmtWon && stats.unity >= 68) pushUnique(23);
  if (
    flags.includes('venice_dome_meme') &&
    (flags.includes('love_power_meme') || flags.includes('squirrel_meme_master'))
  ) {
    pushUnique(24);
  }
  if (flags.includes('chongqing_1949_meme') && !kmtWon) pushUnique(27);
  if (
    !kmtWon &&
    ((flags.includes('hualien_kingdom') && miaoliKmt >= 46) || (hualienKmt >= 58 && miaoliKmt >= 45))
  ) {
    pushUnique(28);
  }
  if (factionId === 'fu' || flags.includes('hualien_kingdom') || hualienKmt >= 62) {
    pushUnique(35);
  }
  if (stats.funds >= 74) {
    pushUnique(36);
  }
  if (flags.includes('squirrel_meme_master') || flags.includes('love_power_meme')) {
    pushUnique(37);
  }
  if (stats.momentum >= 82 && !subs.some((s) => s.id === 21)) {
    pushUnique(38);
  }
  if (Math.abs(nationalShares.kmt - nationalShares.dpp) <= 4.5) {
    pushUnique(39);
  }
  if (flags.includes('boba_diplomacy') || stats.japanPosture >= 72) {
    pushUnique(40);
  }

  return subs.slice(0, 4);
}
