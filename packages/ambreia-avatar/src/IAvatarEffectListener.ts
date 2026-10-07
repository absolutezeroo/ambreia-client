/**
 * Listener interface for avatar effect load completion.
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_1792.as (IAvatarEffectListener)
 */
export interface IAvatarEffectListener
{
    disposed?: boolean;

    avatarEffectReady(effectId: number): void;
}
