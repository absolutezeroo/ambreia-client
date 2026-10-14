import type {IRpgDialogueChoice} from './IRpgDialogueChoice';

/** The dialogue node to show (M2a §3.2): content text keys; a choice is answered by its position. */
export class RpgDialogueMessage
{
    constructor(
        readonly npcObjectId: number,
        /** `dialogue.<id>.name`. */
        readonly speaker: string,
        readonly text: string,
        readonly choices: readonly IRpgDialogueChoice[]
    ) {}
}
