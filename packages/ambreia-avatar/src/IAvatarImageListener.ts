/**
 * Listener interface for avatar image load completion.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/IAvatarImageListener.as
 */
export interface IAvatarImageListener
{
    disposed?: boolean;

    avatarImageReady(figureString: string): void;
}
