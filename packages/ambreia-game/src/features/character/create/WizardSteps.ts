import {nameRules} from '../CharacterLook';
import type {ICharacterDraft} from './ICharacterDraft';
import {WIZARD_STEPS, type WizardStep} from './WizardStep';

/** Where the wizard is and where it may go: a starter character only chooses its class, then confirms. */
export class WizardSteps
{
    current: WizardStep = 'class';

    /** @param classOnly - the character exists, in the starter class */
    constructor(readonly classOnly: boolean) {}

    /** The step before (-1) or after (1) the current one, kept within the steps it asks. */
    neighbour(offset: 1 | -1): WizardStep
    {
        const steps = this.classOnly ? WIZARD_STEPS.filter(step => step === 'class' || step === 'confirm') : [...WIZARD_STEPS];
        const at = steps.indexOf(this.current) + offset;

        return steps[Math.max(0, Math.min(steps.length - 1, at))];
    }

    /** Whether « Suivant » may go on: a class chosen, a valid name the server did not refuse. */
    done(draft: Readonly<ICharacterDraft>, nameTaken: boolean): boolean
    {
        if(this.current === 'class') return draft.classId.length > 0;

        if(this.current === 'name')
        {
            const rules = nameRules(draft.name);

            return rules.length && rules.chars && rules.spaces && !nameTaken;
        }

        return true;
    }
}
