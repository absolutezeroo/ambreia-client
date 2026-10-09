/** The Affichage menu. */
export interface IViewOptions
{
    grid: boolean;
    heights: boolean;
    walls: boolean;
    sprites: boolean;
    /** The only level shown: tiles and furni above and below it are hidden; null shows them all. */
    level: number | null;
}
