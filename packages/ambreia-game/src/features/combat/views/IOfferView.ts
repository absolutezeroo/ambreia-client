import type {IOfferCaster} from './IOfferCaster';

/** The resurrection offer (vortex_resurrect_xml), as DeathScreens drives it. */
export interface IOfferView
{
    /** `fraction`: the offer's time left over its whole time, for the bar. */
    show(caster: IOfferCaster, healthPercent: number, leftMs: number, fraction: number): void;
    hide(): void;
}
