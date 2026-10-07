/**
 * IRoomWidget
 *
 * @see sources/win63_version/habbo/ui/widget/IRoomWidget.as
 *
 * Interface for room widgets (the floating panels attached to the room desktop,
 * e.g. infostand, chat, me-menu).
 */
import type {EventEmitter} from 'eventemitter3';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IRoomDesktop} from '../IRoomDesktop';
import type {IRoomWidgetMessageListener} from '../IRoomWidgetMessageListener';

export interface IRoomWidget
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::get state()
    readonly state: number;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::initialize()
    initialize(state?: number): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::dispose()
    dispose(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::set messageListener()
    messageListener: IRoomWidgetMessageListener | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::registerUpdateEvents()
    registerUpdateEvents(dispatcher: EventEmitter): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::unregisterUpdateEvents()
    unregisterUpdateEvents(dispatcher: EventEmitter): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::get mainWindow()
    readonly mainWindow: IWindow | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::release()
    release(): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::reuse()
    reuse(desktop: IRoomDesktop): void;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::set reusable() / get reusable()
    reusable: boolean;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/IRoomWidget.as::set widgetType() / get widgetType()
    widgetType: string;
}
