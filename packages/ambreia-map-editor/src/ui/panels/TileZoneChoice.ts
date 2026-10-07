import type {IWindow} from '@ambreia/ui/IWindow';
import type {EditorApp} from '../../app/EditorApp';
import {ChoiceBinding} from '../bind';

/** The cell's area: the document's areas, re-listed when they change. */
export class TileZoneChoice
{
    private readonly _choice: ChoiceBinding<string>;

    constructor(window: IWindow, private readonly _app: EditorApp, private readonly _none: string, value: () => string, commit: (zone: string) => void)
    {
        this._choice = new ChoiceBinding(window, 'tile_zone', value, commit);
    }

    render(): void
    {
        this._choice.options([['', this._none], ...(this._app.doc.zones ?? []).map(z => [z.id, z.name ?? z.id] as const)]).render();
    }
}
