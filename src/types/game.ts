export type GamePhase =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'STRAIT_WAR'
  | 'NORTHEAST_ASIA_WAR'
  | 'ELECTION_NIGHT'
  | 'GAME_OVER';

export type FactionId =
  | 'lu'
  | 'chiang'
  | 'han'
  | 'jaw'
  | 'cheng'
  | 'fu'
  | 'hou'
  | 'chu'
  | 'ma';

export type RegionKey = 'north' | 'central' | 'south' | 'east' | 'islands';

export type MapMode = 'REGIONAL' | 'TAIWAN_FOCUS';

export interface VoteShares {
  kmt: number;
  dpp: number;
  tpp: number;
  minge?: number;
}

export interface CountyState {
  id: string; // e.g. '台北市' or '香港行憲特別選區'
  code: string;
  region: RegionKey;
  electorateWeight: number;
  baseline: VoteShares;
  current: VoteShares;
  deltaKmt: number;
  factionNote: string;
  keyIssue: string;
  isTemporary?: boolean;
  theaterTag?: 'TAIWAN' | 'HK' | 'MAINLAND';
}

export interface CampaignStats {
  unity: number; // 0-100 黨內團結
  momentum: number; // 0-100 脆與PTT聲量
  funds: number; // 0-100 競選糧草與地方動員
  ccpTension: number; // 0-100 中共對台壓力 / 台海警戒
  japanPosture: number; // 0-100 美日安保與日本反應關注度
}

export interface FactionLeader {
  id: FactionId;
  name: string;
  title: string;
  factionName: string;
  tagline: string;
  bio: string;
  portraitKey: string;
  accentHex: string;
  startingStats: CampaignStats;
  regionAffinity: Record<RegionKey, number>;
  homeCounty: string;
  perkLabel: string;
}

export interface StatDelta {
  unity?: number;
  momentum?: number;
  funds?: number;
  ccpTension?: number;
  japanPosture?: number;
}

export interface RegionalSwing {
  north?: number;
  central?: number;
  south?: number;
  east?: number;
  islands?: number;
  dppShift?: number;
  tppShift?: number;
  specificCounties?: Record<string, number>;
}

export interface ChoiceOption {
  id: string;
  toneLabel: string;
  label: string;
  speechText: string;
  hint: string;
  factionOnly?: FactionId;
  statDelta: StatDelta;
  swing: RegionalSwing;
  setFlags?: string[];
  pushReactions: Array<{
    type: '推' | '噓' | '→';
    author: string;
    text: string;
  }>;
  mediaReaction: string;
}

export interface RivalPost {
  platform: 'Threads 脆' | 'PTT 八卦版' | 'PTT 政黑版' | '緊急軍情電報' | '香港連登熱議';
  authorName: string;
  authorRole: string;
  authorHandle: string;
  portraitKey: string;
  headline: string;
  body: string;
  likesLabel: string;
}

export interface RoundEvent {
  round: number; // 1..24
  dateLabel: string; // '2027.01 上'..'2027.12 下'
  boardName: string;
  title: string;
  situationBrief: string;
  ccpNotice: string;
  japanNotice: string;
  rivalPost: RivalPost;
  choices: ChoiceOption[];
}

export interface BbsLogEntry {
  id: string;
  round: number;
  dateLabel: string;
  type: '推' | '噓' | '→' | '系統';
  author: string;
  text: string;
}

export type EndingCategory = 'VICTORY' | 'DEFEAT' | 'GEOPOLITICAL' | 'MEME_SECRET';
export type EndingTier = 'MAJOR' | 'SUB';

export interface EndingDefinition {
  id: number; // 1..40 (15 MAJOR + 25 SUB)
  code: string;
  title: string;
  subtitle: string;
  tier: EndingTier;
  category: EndingCategory;
  rarity: '常規' | '罕見' | '隱藏政治梗';
  unlockHint: string;
  newspaperHeadline: string;
  bbsTitle: string;
  epilogue: string;
  bbsComments: Array<{ type: '推' | '噓' | '→'; user: string; text: string }>;
}

export interface GameEvaluationContext {
  factionId: FactionId;
  round: number;
  stats: CampaignStats;
  nationalShares: VoteShares;
  counties: CountyState[];
  flags: string[];
  midGameTrigger: boolean;
}
