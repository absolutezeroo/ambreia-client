/**
 * Link target constants for text link navigation.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/core/window/enum/LinkTarget.as
 */
export const LinkTarget =
    {
        SELF: '_self',
        BLANK: '_blank',
        PARENT: '_parent',
        TOP: '_top',
        DEFAULT: 'default',
        INTERNAL: 'internal',
    } as const;

export type LinkTargetValue = typeof LinkTarget[keyof typeof LinkTarget];
