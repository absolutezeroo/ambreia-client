import type {IGameFeature} from '../GameFeature';
import {LoadingBarWidget} from './LoadingBarWidget';
import {LoadingBarWidgetHandler} from './LoadingBarWidgetHandler';

/**
 * The room loading bar (AS3 RWE_LOADINGBAR). Its own folder and its line in GAME_FEATURES: the
 * demonstration that a feature comes and goes in one folder and one line (spec §9 J6, §11).
 */
export const LoadingBarFeature: IGameFeature = {
    id: 'loading-bar',
    create: () => null,
    // `windowManager!`: RoomWidgetFactory.createWidget() returns before calling this without one.
    roomWidgets: {
        RWE_LOADINGBAR: {
            handler: () => new LoadingBarWidgetHandler(),
            widget: (handler, ui) => new LoadingBarWidget(handler, ui.windowManager!, ui.assets, ui.localization, ui.config)
        }
    }
};
