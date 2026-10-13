import {Logger} from '@ambreia/common/utils/Logger';
import type {IFigureData} from '@ambreia/avatar/structure/IFigureData';
import type {WindowEvent} from '@ambreia/ui/events/WindowEvent';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {ITextFieldWindow} from '@ambreia/ui/components/ITextFieldWindow';
import type {IRpgClassEntry} from '@ambreia/protocol/incoming/rpg/characters/IRpgClassEntry';
import type {IHabboWindowManager} from '../../window/IHabboWindowManager';
import type {WindowBits} from '../../ui/kit/WindowBits';
import {AppearanceStepView} from './create/AppearanceStepView';
import {ClassStepView} from './create/ClassStepView';
import {ConfirmStepView} from './create/ConfirmStepView';
import type {ICharacterDraft} from './create/ICharacterDraft';
import {NameStepView} from './create/NameStepView';
import {StarterWardrobe} from './create/StarterWardrobe';
import {StepNavView} from './create/StepNavView';
import type {WizardStep} from './create/WizardStep';
import {WizardSteps} from './create/WizardSteps';

const log = Logger.getLogger('habbo.features.character.CharacterCreateView');

const STEP_LAYOUTS: Record<WizardStep, string> = {
    class: 'vortex_character_create_step_class_xml',
    appearance: 'vortex_character_create_step_appearance_xml',
    name: 'vortex_character_create_step_name_xml',
    confirm: 'vortex_character_create_step_confirm_xml'
};

/**
 * The character creation wizard (vortex_character_create_xml and its four steps): class, look,
 * name, then a summary. For a character still in the starter class it only asks the class. The
 * wizard says what was chosen; the characters screen sends it and reports the server's answer back.
 * This one builds the window and each step's page, keeps the draft and routes the events; each step
 * draws itself (create/).
 */
export class CharacterCreateView
{
    private _window: IWindowContainer | null = null;
    private _page: IWindowContainer | null = null;
    private _nameTaken = false;
    private _busy = false;
    private readonly _draft: ICharacterDraft;
    private readonly _steps: WizardSteps;
    private readonly _nav: StepNavView;
    private readonly _class: ClassStepView;
    private readonly _look: AppearanceStepView;
    private readonly _name: NameStepView;
    private readonly _confirm: ConfirmStepView;
    private _disposed = false;

    constructor(
        private readonly _windows: IHabboWindowManager,
        _bits: WindowBits,
        figureData: IFigureData | null,
        classes: readonly IRpgClassEntry[],
        private readonly _actions: {submit(draft: ICharacterDraft): void; cancel(): void},
        existing: {playerId: number; name: string; figure: string; gender: string} | null = null
    )
    {
        const wardrobe = new StarterWardrobe(figureData);
        const gender = existing?.gender === 'F' ? 'F' : 'M';

        this._draft = {
            playerId: existing?.playerId ?? 0,
            name: existing?.name ?? '',
            figure: existing?.figure ?? wardrobe.presets().find(preset => preset.gender === gender)?.figure ?? '',
            gender,
            classId: ''
        };
        this._steps = new WizardSteps(this._draft.playerId > 0);
        this._nav = new StepNavView(_bits);
        this._class = new ClassStepView(_windows, _bits, classes, this._onEvent);
        this._look = new AppearanceStepView(_windows, _bits, wardrobe, this._onEvent);
        this._name = new NameStepView(_bits);
        this._confirm = new ConfirmStepView(_windows, _bits, classes, wardrobe);
    }

    show(parent: IWindowContainer): boolean
    {
        this._window = this._windows.buildWidgetLayout('vortex_character_create_xml') as IWindowContainer | null;

        if(!this._window)
        {
            log.error('the creation wizard (vortex_character_create_xml) did not build');

            return false;
        }

        parent.addChild(this._window);
        this._window.x = Math.round((parent.width - this._window.width) / 2);
        this._window.y = Math.round((parent.height - this._window.height) / 2);
        this._window.procedure = this._onEvent;

        // A frame hides on its header X (FrameController.close()); on a screen that is the only way
        // forward the X is taken out instead of left dead.
        const headerClose = this._window.findChildByName('header_button_close');

        if(headerClose) headerClose.visible = false;
        this.goTo('class');

        return true;
    }

    /** The server refused: back to the step that can fix it, or just usable again. */
    refused(code: string): void
    {
        this._busy = false;
        this._window?.enable();

        if(code === 'character.name_taken')
        {
            this._nameTaken = true;
            this.goTo('name');
        }
        else if(code === 'character.name_invalid')
        {
            this.goTo('name');
        }
    }

    private goTo(step: WizardStep): void
    {
        const window = this._window;
        const slot = window?.findChildByName('step_slot') as IWindowContainer | null;

        if(!window || !slot) return;

        this._page?.destroy();
        this._page = this._windows.buildWidgetLayout(STEP_LAYOUTS[step]) as IWindowContainer | null;
        this._steps.current = step;

        if(!this._page)
        {
            log.error(`the ${step} step (${STEP_LAYOUTS[step]}) did not build`);

            return;
        }

        slot.addChild(this._page);
        this._nav.renderSteps(window, step, this._steps.classOnly);

        if(step === 'class') this._class.render(this._page, this._draft);
        else if(step === 'appearance') this._look.render(this._page, this._draft);
        else if(step === 'name') this._name.render(this._page, this._draft.name, this._nameTaken);
        else this._confirm.render(this._page, this._draft, this._look.direction);

        this.renderButtons();
    }

    private renderButtons(): void
    {
        if(this._window) this._nav.renderButtons(this._window, this._steps.current, this._steps.done(this._draft, this._nameTaken));
    }

    private readonly _onEvent = (event: WindowEvent, window: IWindow): void =>
    {
        if(event.type === 'WE_CHANGE' && window.name === 'name_input')
        {
            this._draft.name = (window as ITextFieldWindow).text.trim();
            this._nameTaken = false;
            if(this._page) this._name.renderRules(this._page, this._draft.name, false);
            this.renderButtons();

            return;
        }

        if(event.type !== 'WME_CLICK' || this._busy) return;

        const classId = this._class.classAt(window);

        if(classId !== null)
        {
            this._draft.classId = classId;
            this.goTo('class');

            return;
        }

        if(this._look.pick(window, this._draft))
        {
            if(this._page) this._look.render(this._page, this._draft);

            return;
        }

        switch(window.name)
        {
            case 'cancel_button': this._actions.cancel(); break;
            case 'previous_button': this.goTo(this._steps.neighbour(-1)); break;
            case 'next_button': if(this._steps.done(this._draft, this._nameTaken)) this.goTo(this._steps.neighbour(1)); break;
            case 'create_button': this.submit(); break;
            case 'rotate_left': this._look.rotate(this._page, this._draft.figure, 1); break;
            case 'rotate_right': this._look.rotate(this._page, this._draft.figure, -1); break;
        }
    };

    private submit(): void
    {
        if(this._busy || !this._draft.classId) return;

        this._busy = true;
        this._window?.disable();
        this._actions.submit({...this._draft});
    }

    dispose(): void
    {
        if(this._disposed) return;

        this._disposed = true;
        this._page?.destroy();
        this._window?.destroy();
        this._page = this._window = null;
    }
}
