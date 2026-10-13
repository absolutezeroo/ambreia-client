/** A short notice at the top of the screen (the owner's vortex_hud_toast_xml), shown for `ms`. */
export interface IToast
{
    readonly kind: 'info' | 'success' | 'error';
    readonly title: string;
    readonly text: string;
    readonly ms: number;
}
