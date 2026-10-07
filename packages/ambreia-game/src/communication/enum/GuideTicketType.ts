/**
 * Guide Ticket Type Constants
 *
 * @see source_as_win63/habbo/communication/enum/help/GuideTicketType.as
 */
export const GuideTicketType = {
    HELP: 0,
    INSTRUCTIONS: 1,
    USER_TOUR: 2,
    GUARDIAN: 3,
    PHOTO_REPORT: 4,
} as const;

export type GuideTicketTypeValue = typeof GuideTicketType[keyof typeof GuideTicketType];
