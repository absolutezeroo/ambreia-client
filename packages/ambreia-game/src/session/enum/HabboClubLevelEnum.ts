/**
 * Club membership level constants
 * Based on AS3 com.sulake.habbo.session.HabboClubLevelEnum
 */
export const HabboClubLevelEnum = {
    NO_CLUB: 0,
    CLUB: 1,
    VIP: 2,
} as const;

export type HabboClubLevel = typeof HabboClubLevelEnum[keyof typeof HabboClubLevelEnum];

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/HabboClubLevelEnum.as::HasClub()
export function hasClub(level: number): boolean
{
    return level >= HabboClubLevelEnum.CLUB;
}

// AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/session/HabboClubLevelEnum.as::HasVip()
// AS3 tests `>= 1`, not `>= VIP` — HasVip and HasClub are deliberately identical there, so holding
// HC is holding VIP. Combined with SessionDataManager normalising clubLevel to {0, 2}, the level is
// never 1 in practice; the `>= 1` still matters for any unnormalised value reaching this.
export function hasVip(level: number): boolean
{
    return level >= HabboClubLevelEnum.CLUB;
}
