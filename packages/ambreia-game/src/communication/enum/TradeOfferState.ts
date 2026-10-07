/**
 * Trade Offer State Constants
 *
 * @see source_as_win63/habbo/communication/enum/class_3533.as
 */
export const TradeOfferState = {
    OFFERED: 1,
    REJECTED: 2,
    ACCEPTED: 3,
    CONFIRMED: 4,
    COMPLETED: 5,
    PREVIEWED: 6,
} as const;

export type TradeOfferStateType = typeof TradeOfferState[keyof typeof TradeOfferState];
