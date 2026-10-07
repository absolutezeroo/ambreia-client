/**
 * Who a chat bubble belongs to: a player, a generic speaker, or a bot. Class name DERIVED — obfuscated in every tree.
 *
 * **Nothing in any source tree reads this class** — its values are written as literals wherever
 * they are needed, in AS3 and here alike. Transcribed because it is the only place these names are
 * recorded, not because anything dispatches on it.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/enums/_SafeCls_3808.as
 */
export const ChatBubbleOwnerTypeEnum = {
    // AS3: _SafeCls_3808.as::NORMAL
    NORMAL: 0,

    // AS3: _SafeCls_3808.as::GENERIC
    GENERIC: 1,

    // AS3: _SafeCls_3808.as::BOT
    BOT: 2,
} as const;

export type ChatBubbleOwnerTypeEnum = typeof ChatBubbleOwnerTypeEnum[keyof typeof ChatBubbleOwnerTypeEnum];
