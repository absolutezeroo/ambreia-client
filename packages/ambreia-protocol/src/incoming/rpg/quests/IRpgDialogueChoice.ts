/** A dialogue choice: its content text key and kind (next, accept, complete, close). */
export interface IRpgDialogueChoice
{
    readonly text: string;
    readonly kind: string;
}
