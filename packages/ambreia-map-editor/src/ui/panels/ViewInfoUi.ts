import type {IWindow} from '@ambreia/ui/IWindow';
import {tileAt} from '@ambreia/map-editor-core/zone/zoneGeometry';
import type {EditorApp} from '../../app/EditorApp';
import {setText} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import type {IPanelUi} from '../IPanelUi';
import {CATEGORY_LABEL_KEYS} from './CATEGORY_LABEL_KEYS';

/** The info box over the view: zone, size (or the cell under the pointer), active layer, zoom. */
export class ViewInfoUi implements IPanelUi
{
    constructor(private readonly _window: IWindow, private readonly _app: EditorApp, private readonly _texts: EditorTexts)
    {
    }

    render(): void
    {
        const app = this._app;
        const floor = app.doc.floor;
        const h = app.hover;
        const tile = h ? tileAt(floor, h.x, h.y) : null;

        setText(this._window, 'view_info_0', app.doc.settings.id);
        setText(this._window, 'view_info_1', h
            ? `(${h.x}, ${h.y}) h ${tile?.height ?? 0}${tile?.hole ? ' - trou' : ''}`
            : `${floor.width} × ${floor.length}`);
        setText(this._window, 'view_info_2', this._texts.get(CATEGORY_LABEL_KEYS[app.category]));
        this.onViewChange();
    }

    onPointer(): void
    {
        this.render();
    }

    onViewChange(): void
    {
        setText(this._window, 'view_info_3', `${Math.round(this._app.view.zoom * 100)} %`);
    }
}
