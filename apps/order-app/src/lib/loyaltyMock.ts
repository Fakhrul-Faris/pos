export type LoyaltyProfile = {
  stamps: number
  goal: number
  campaignName: string
  rewardLabel: string
  isReturning: boolean
  /** Optional display name for returning guests (demo) */
  nicknameHint?: string
}

const GOAL = 10
const CAMPAIGN = "Ali's stamp card"
const REWARD = 'Collect 10, get 1 free'

/** Demo phones with existing stamps - anything else is a new guest. */
const KNOWN: Record<
  string,
  { stamps: number; nicknameHint?: string }
> = {
  '01161209203': { stamps: 4, nicknameHint: 'Aiman' },
  '0123456789': { stamps: 3 },
  '01234567890': { stamps: 7 },
  '0198765432': { stamps: 9 },
}

/** Highlighted example for UI copy */
export const DEMO_RETURNING_PHONE = '01161209203'

export function normalizePhone(phone: string) {
  return phone.replace(/\s/g, '')
}

export function isValidMyMobile(phone: string) {
  return /^01\d{8,9}$/.test(normalizePhone(phone))
}

export function lookupLoyalty(phone: string): LoyaltyProfile {
  const key = normalizePhone(phone)
  const known = KNOWN[key]
  const stamps = known?.stamps ?? 0
  return {
    stamps,
    goal: GOAL,
    campaignName: CAMPAIGN,
    rewardLabel: REWARD,
    isReturning: stamps > 0,
    nicknameHint: known?.nicknameHint,
  }
}

/** After a paid visit, stamps +1 (capped at goal for display). */
export function afterPaidStamp(profile: LoyaltyProfile): LoyaltyProfile {
  return {
    ...profile,
    stamps: Math.min(profile.goal, profile.stamps + 1),
    isReturning: true,
  }
}
