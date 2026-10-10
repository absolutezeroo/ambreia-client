import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {WindowKeyboardEvent} from '@ambreia/ui/events/WindowKeyboardEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {WindowManager} from '@ambreia/ui/kit/WindowManager';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {child, setText, setVisible} from '../ui/bind';
import type {EditorTexts} from '../ui/EditorTexts';

const ENTER = 13;
const ESCAPE = 27;
/** The server's own rule (ZoneEditorService.KeyShape): checked here to answer before the request. */
const KEY_SHAPE = /^[a-z0-9_]{3,64}$/;

/**
 * "Créer une zone" (vortex_map_editor_create_zone_xml), centred over the browser: key, display
 * name, and the template it copies when there is one. submit() answers null once the zone is
 * made, or the text to show under the fields; the dialog stays until then or until cancelled.
 */
export class CreateZoneDialog
{
    private readonly _window: IWindowContainer;
    private _busy = false;

    constructor(
        private readonly _manager: WindowManager,
        private readonly _texts: EditorTexts,
        template: IZoneSummary | null,
        private readonly _submit: (key: string, name: string) => Promise<string | null>
    )
    {
        const window = _manager.buildWidgetLayout('vortex_map_editor_create_zone_xml') as IWindowContainer | null;

        if(!window) throw new Error('vortex_map_editor_create_zone_xml is not registered');

        this._window = window;
        setVisible(window, 'template_txt', !!template);
        if(template)
        {
            setText(window, 'template_txt', _texts.get('vortex.mapeditor.create.from_template', {name: template.name}));
            this.input('name_input')!.text = template.name;
        }
    }

    /** Resolves true once a zone is made, false when cancelled. */
    show(): Promise<boolean>
    {
        const desktop = this._manager.getDesktop(1) as IWindowContainer;
        const window = this._window;

        desktop.addChild(window);
        window.x = Math.round((desktop.width - window.width) / 2);
        window.y = Math.round((desktop.height - window.height) / 2);

        return new Promise(resolve =>
        {
            const close = (made: boolean): void =>
            {
                window.destroy();
                resolve(made);
            };

            window.procedure = (event: WindowEvent, target: IWindow) =>
            {
                const key = event.type === 'WKE_KEY_DOWN' ? (event as WindowKeyboardEvent).keyCode : 0;

                if(key === ESCAPE) close(false);
                else if(key === ENTER) void this.create(close);
                else if(event.type !== 'WME_CLICK') return;
                else if(target.name === 'cancel_button' || target.name === 'header_button_close') close(false);
                else if(target.name === 'create_button') void this.create(close);
            };
        });
    }

    private async create(close: (made: boolean) => void): Promise<void>
    {
        const key = this.input('key_input')?.text.trim() ?? '';
        const name = this.input('name_input')?.text.trim() ?? '';

        if(this._busy) return;
        if(!KEY_SHAPE.test(key)) return this.error(this._texts.get('vortex.mapeditor.create.error.invalid'));
        if(!name) return this.error(this._texts.get('vortex.mapeditor.create.error.name'));

        this._busy = true;
        this._window.disable();

        const problem = await this._submit(key, name);

        this._busy = false;
        this._window.enable();
        if(problem === null) close(true);
        else this.error(problem);
    }

    private error(text: string): void
    {
        setText(this._window, 'create_error', text);
        setVisible(this._window, 'create_error', true);
    }

    private input(name: string): ITextFieldWindow | null
    {
        return child<ITextFieldWindow>(this._window, name);
    }
}
