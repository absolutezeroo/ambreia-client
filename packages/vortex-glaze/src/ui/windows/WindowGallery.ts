import type {IWindow} from '@core/window/IWindow';
import type {WindowController} from '@core/window/WindowController';
import type {WindowEvent} from '@core/window/events/WindowEvent';
import {WindowMouseEvent} from '@core/window/events/WindowMouseEvent';
import {TYPE_NAME_TO_CODE} from '@core/window/enum/WindowType';
import {WindowParam} from '@core/window/enum/WindowParam';
import {Logger} from '@core/utils/Logger';
import {addWidget} from '../../ops/StructuralOps';
import {type EditorState} from '../../state/EditorState';
import {closesOnHeaderButton, fitPopupToDesktop} from './PopupChrome';
import {slotsOf} from '../LayoutSlots';

const log = Logger.getLogger('glaze.ui.windows.WindowGallery');

const GALLERY = slotsOf('glaze_gallery_xml');
const GALLERY_ROW = slotsOf('glaze_gallery_row_xml');

interface IContainerLike { addChild(child: IWindow): IWindow; }
interface IListLike { addListItem(item: IWindow): IWindow; destroyListItems(): void; }

const GALLERY_LAYER = 3;
const MAX_IMAGES = 120;
const BITMAP_TYPES = new Set([TYPE_NAME_TO_CODE.static_bitmap, TYPE_NAME_TO_CODE.bitmap]);

/** Size a bitmap is inserted at when the PNG's own size cannot be read. */
const FALLBACK_SIZE = 64;

/**
 * WindowGallery — Glaze's Image Gallery, listing every bundled image.
 *
 * A popup frame (layer 3) with a scrollable list of the registered image assets
 * (thumbnail + name). Picking one puts the image **into the layout**: it retargets
 * the selected node when that node is already a bitmap, and otherwise inserts a
 * new `static_bitmap` under the selection, sized to the image. It used to set the
 * canvas background instead whenever the selection was not a bitmap, which is a
 * different job entirely — and one the Background / Canvas Back Color / Load Image
 * toolbar buttons already do.
 */
export class WindowGallery
{
    private readonly _state: EditorState;
    private readonly _wm: EditorState['runtime']['windowManager'];
    private _frame: IWindow | null = null;

    public constructor(state: EditorState)
    {
        this._state = state;
        this._wm = state.runtime.windowManager;
    }

    public toggle(): void
    {
        if(this._frame && !this._frame.disposed)
        {
            this.close();

            return;
        }

        this.open();
    }

    private open(): void
    {
        const frame = this._wm.buildWidgetLayout('glaze_gallery_xml', GALLERY_LAYER);

        if(!frame) return;

        const desktop = this._wm.getDesktop(GALLERY_LAYER);

        if(!frame.parent && desktop)
        {
            (desktop as unknown as IContainerLike).addChild(frame);
        }

        fitPopupToDesktop(frame, desktop, GALLERY.find(frame, 'glaze_gallery_list'));
        closesOnHeaderButton(frame, () => this.close());

        this._frame = frame;
        this._state.modalOpen = true;

        const list = GALLERY.findAs<IListLike>(frame, 'glaze_gallery_list');

        if(list) this.populate(list);
    }

    private populate(list: IListLike): void
    {
        const bundle = this._state.runtime.imageBundle;
        const names = bundle.listKeys('images/')
            .map((k) => k.slice('images/'.length).replace(/\.png$/, ''))
            .sort()
            .slice(0, MAX_IMAGES);

        for(const name of names)
        {
            const row = this._wm.buildWidgetLayout('glaze_gallery_row_xml');

            if(!row) continue;

            const img = GALLERY_ROW.findAs<{ assetUri: string }>(row, 'glaze_grow_img');

            if(img) img.assetUri = name;

            GALLERY_ROW.setText(row, 'glaze_grow_label', name);

            (row as unknown as WindowController).procedure = (event: WindowEvent): void =>
            {
                if(event.type === WindowMouseEvent.CLICK) this.pick(name);
            };

            list.addListItem(row);
        }
    }

    private pick(name: string): void
    {
        const sel = this._state.selected as unknown as WindowController | null;

        if(sel && !sel.disposed && BITMAP_TYPES.has(sel.type))
        {
            this._state.pushHistory();
            (sel as unknown as { assetUri: string }).assetUri = name;
            this._state.notifyTreeChanged();
            this.close();

            return;
        }

        this.insert(name);
        this.close();
    }

    /**
     * Adds the image as a new `static_bitmap` under the selection. The natural
     * size is read off the bundled PNG first so the node is born the right shape;
     * a decode failure still inserts, at the placeholder size.
     */
    private insert(name: string): void
    {
        const url = this._state.runtime.imageBundle.getUrl(`images/${name}.png`);
        const create = (width: number, height: number): void =>
        {
            const created = addWidget(this._state, {
                type: 'static_bitmap',
                label: name,
                width,
                height,
                params: WindowParam.USE_PARENT_GRAPHIC_CONTEXT
            });

            if(created)
            {
                (created as unknown as { assetUri: string }).assetUri = name;
                this._state.notifyTreeChanged();
            }
            else
            {
                log.warn(`Could not insert "${name}" — no valid parent selected`);
            }
        };

        if(!url)
        {
            create(FALLBACK_SIZE, FALLBACK_SIZE);

            return;
        }

        const image = new Image();

        image.onload = (): void => create(image.naturalWidth || FALLBACK_SIZE, image.naturalHeight || FALLBACK_SIZE);
        image.onerror = (): void => create(FALLBACK_SIZE, FALLBACK_SIZE);
        image.src = url;
    }

    private close(): void
    {
        this._frame?.destroy();
        this._frame = null;
        this._state.modalOpen = false;
    }

    public dispose(): void
    {
        this.close();
    }
}
