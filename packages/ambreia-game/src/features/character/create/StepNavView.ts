import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {WindowBits} from '../../../ui/kit/WindowBits';
import {ACTIVE, IDLE} from './wizardLook';
import {WIZARD_STEPS, type WizardStep} from './WizardStep';

/** Each step's label in the list. */
const STEP_KEYS = ['vortex.character.class', 'vortex.charcreate.step.appearance', 'vortex.mapeditor.field.name', 'vortex.charcreate.step.confirm'];

/** The wizard's step list (the current one lit) and its « Précédent », « Suivant », « Créer » buttons. */
export class StepNavView
{
    constructor(private readonly _bits: WindowBits) {}

    /** @param classOnly - the look and name steps are not asked */
    renderSteps(window: IWindowContainer, step: WizardStep, classOnly: boolean): void
    {
        const steps = window.findChildByName('step_list') as IItemListWindow | null;

        WIZARD_STEPS.forEach((name, i) =>
        {
            const row = steps?.getListItemAt(i) as IWindowContainer | null;

            if(!row) return;

            row.color = name === step ? ACTIVE.row : IDLE.row;
            this._bits.setColor(row, 'step_badge', name === step ? ACTIVE.badge : IDLE.badge);
            this._bits.setText(row, 'step_number', String(i + 1));
            // The mock-up draws step 1 as the current one: its colours move with the step.
            this._bits.setTextColor(row, 'step_number', name === step ? 0xffffff : 0x777777);
            this._bits.setTextColor(row, 'step_label', name === step ? 0x000000 : 0x999999);
            this._bits.setText(row, 'step_label', this._bits.text(STEP_KEYS[i]));
            if(classOnly && (name === 'appearance' || name === 'name')) row.visible = false;
        });
        steps?.arrangeListItems();
    }

    /** @param done - « Suivant » may go on */
    renderButtons(window: IWindowContainer, step: WizardStep, done: boolean): void
    {
        const last = step === 'confirm';

        this._bits.setVisible(window, step !== 'class', 'previous_button');
        this._bits.setVisible(window, !last, 'next_button');
        this._bits.setVisible(window, last, 'create_button');

        const next = window.findChildByName('next_button');

        if(next)
        {
            if(done) next.enable();
            else next.disable();
        }
    }
}
