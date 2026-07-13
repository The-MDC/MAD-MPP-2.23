export const CARD_STATES = { BASE: 'base', EVOLVED: 'evolved', DEGENERATED: 'degenerated', HOLOGRAPHIC: 'holo', CHAOS_FUSION: 'chaos' };

export const degenerationLogic = (losses: number) => ({ clownNoseIntensity: Math.min(losses * 0.3, 1), expression: 'humbled' });