/** One Habbo furniture the editor can place: definition id (stable) and class name. */
export interface IFurniturePaletteEntry
{
    readonly definition: number;
    readonly class: string;
    readonly wall: boolean;
    readonly width: number;
    readonly length: number;
    readonly states: number;
    readonly canWalk: boolean;
    readonly canSit: boolean;
    readonly stackHeight: number;
}
