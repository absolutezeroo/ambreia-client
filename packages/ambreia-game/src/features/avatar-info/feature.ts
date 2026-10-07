import type {IGameFeature} from '../GameFeature';
import {AvatarInfoWidget} from '../../ui/widget/avatarinfo/AvatarInfoWidget';
import {AvatarInfoWidgetHandler} from '../../ui/handler/AvatarInfoWidgetHandler';

/**
 * The name bubble above avatars (AS3 RWE_AVATAR_INFO). Its widget stays under ui/: RoomDesktop
 * forwards game player names to it (showGamePlayerName).
 */
export const AvatarInfoFeature: IGameFeature = {
    id: 'avatar-info',
    create: () => null,
    // `windowManager!`: RoomWidgetFactory.createWidget() returns before calling this without one.
    roomWidgets: {
        RWE_AVATAR_INFO: {
            handler: () => new AvatarInfoWidgetHandler(),
            widget: (handler, ui) => new AvatarInfoWidget(handler, ui.windowManager!, ui.assets, ui.localization, ui.config)
        }
    }
};
