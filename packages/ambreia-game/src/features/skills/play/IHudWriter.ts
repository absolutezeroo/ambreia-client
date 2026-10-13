import type {IHudPanels} from '../../hud/IHud';

/** What the skills read and write of the HUD's panels (HudPanelsState). */
export interface IHudWriter
{
    readonly value: Readonly<IHudPanels>;
    update(values: Partial<IHudPanels>): void;
}
