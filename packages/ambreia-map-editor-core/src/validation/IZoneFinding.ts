/** Same shape as the server's IZoneFinding: local and server findings share one panel. */
export interface IZoneFinding
{
    readonly severity: 'Error' | 'Warning';
    readonly code: string;
    readonly elementId: string | null;
    readonly message: string;
}
