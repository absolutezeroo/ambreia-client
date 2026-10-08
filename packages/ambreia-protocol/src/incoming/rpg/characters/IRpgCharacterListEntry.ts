/** One character of the account, as the characters screen lists it. */
export interface IRpgCharacterListEntry
{
    readonly playerId: number;
    readonly name: string;
    readonly figure: string;
    readonly gender: string;
    readonly classId: string;
    readonly specializationId: string;
    readonly level: number;
    /** Still in the starter class ("Sans classe"): its class can be chosen once. */
    readonly starter: boolean;
}
