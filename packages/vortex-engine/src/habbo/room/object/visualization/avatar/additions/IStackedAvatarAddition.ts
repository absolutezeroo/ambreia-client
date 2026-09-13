import type {IStackedAddition} from '../../stacked/IStackedAddition';

/**
 * A stacked addition that belongs on an AVATAR specifically.
 *
 * Adds nothing of its own — AS3 declares it empty too. It exists so the avatar side can name the
 * things it puts in its stack without depending on the generic `stacked/` package's interface at
 * every call site.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/avatar/additions/IStackedAvatarAddition.as
 */
export type IStackedAvatarAddition = IStackedAddition;
