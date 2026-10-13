import type {WidgetRegistry} from '@ambreia/ui/kit/WidgetRegistry';
import type {IHabboWindowManager} from './IHabboWindowManager';
import {AvatarImageWidget} from './widgets/AvatarImageWidget';
import {BadgeImageWidget} from './widgets/BadgeImageWidget';
import {FurnitureImageWidget} from './widgets/FurnitureImageWidget';
import {IlluminaChatBubbleWidget} from './widgets/IlluminaChatBubbleWidget';
import {PetImageWidget} from './widgets/PetImageWidget';
import {ProductIconWidget} from './widgets/ProductIconWidget';
import {ProductImageWidget} from './widgets/ProductImageWidget';
import {RoomPreviewerWidget} from './widgets/RoomPreviewerWidget';
import {UpdatingTimeStampWidget} from './widgets/UpdatingTimeStampWidget';

/**
 * The game's widgets, on top of the kit's (registerKitWidgets): the ones that read the avatar
 * renderer, the room engine, the session or the localisation off the game window manager.
 *
 * The wall/floor-item ones go through IRoomEngine.getWallItemImage()/getFurnitureImage().
 *
 * @see sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/widgets/WidgetClasses.as
 */
export function registerHabboWidgets(registry: WidgetRegistry, manager: IHabboWindowManager): void
{
    registry.register('avatar_image', w => new AvatarImageWidget(w, manager));
    registry.register('badge_image', w => new BadgeImageWidget(w, manager));
    registry.register('furniture_image', w => new FurnitureImageWidget(w, manager));
    registry.register('illumina_chat_bubble', w => new IlluminaChatBubbleWidget(w, manager));
    registry.register('pet_image', w => new PetImageWidget(w, manager));
    registry.register('product_icon', w => new ProductIconWidget(w, manager));
    registry.register('product_image', w => new ProductImageWidget(w, manager));
    registry.register('room_previewer', w => new RoomPreviewerWidget(w, manager));
    registry.register('updating_timestamp', w => new UpdatingTimeStampWidget(w, manager));
}
