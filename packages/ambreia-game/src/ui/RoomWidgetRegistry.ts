import {Logger} from '@ambreia/common/utils/Logger';
import type {IRoomWidgetHandler} from './IRoomWidgetHandler';
import type {RoomUI} from './RoomUI';

const log = Logger.getLogger('habbo.ui.RoomWidgetRegistry');

/**
 * One room widget type: its handler, and the widget built over it. A handler-only type (the
 * object-location answer) has no widget.
 */
export interface IRoomWidgetDefinition
{
    handler(): IRoomWidgetHandler;
    widget?(handler: IRoomWidgetHandler, ui: RoomUI): unknown;
}

/**
 * The room widget types the enabled features declare (`IGameFeature.roomWidgets`). It replaces the
 * two `switch`es AS3 had, RoomDesktop.createWidgetHandler() and RoomWidgetFactory.createWidget():
 * a feature brings its widget by declaring it, and taking the feature out takes the widget out.
 */
export class RoomWidgetRegistry
{
    private readonly _definitions = new Map<string, {feature: string; definition: IRoomWidgetDefinition}>();

    register(type: string, definition: IRoomWidgetDefinition, feature: string): void
    {
        const taken = this._definitions.get(type);

        if(taken) throw new Error(`Room widget ${type} is declared by both "${taken.feature}" and "${feature}"`);

        this._definitions.set(type, {feature, definition});
    }

    /** The definition, or null (warned once per type) when no enabled feature builds it. */
    get(type: string): IRoomWidgetDefinition | null
    {
        const entry = this._definitions.get(type);

        if(!entry)
        {
            log.once(`unknown:${type}`).warn(`No enabled feature builds the room widget ${type} — not created`);

            return null;
        }

        return entry.definition;
    }

    types(): string[]
    {
        return [...this._definitions.keys()];
    }
}
