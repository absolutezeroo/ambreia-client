/** Shared avatar-animation contracts kept in one module because the two interfaces are recursive. */
export interface IAnimation
{
    readonly id: string;

    readonly spriteData: ISpriteDataContainer[];

    readonly removeData: string[];

    readonly addData: { id: string; align: string; base: string; ink: string; blend: number }[];

    readonly resetOnToggle: boolean;

    hasAvatarData(): boolean;

    hasDirectionData(): boolean;

    hasAddData(): boolean;
}

export interface ISpriteDataContainer
{
    readonly animation: IAnimation;

    readonly id: string;

    readonly ink: number;

    readonly member: string;

    readonly hasDirections: boolean;

    readonly hasStaticY: boolean;

    getDirectionOffsetX(direction: number): number;

    getDirectionOffsetY(direction: number): number;

    getDirectionOffsetZ(direction: number): number;
}
