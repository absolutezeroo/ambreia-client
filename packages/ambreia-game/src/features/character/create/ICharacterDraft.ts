/** What the wizard hands back: a new character, or only the class of an existing starter one. */
export interface ICharacterDraft
{
    /** The existing character whose class is being chosen; 0 for a new one. */
    playerId: number;
    name: string;
    figure: string;
    gender: 'M' | 'F';
    classId: string;
}
