/** A refused request: the HTTP status and the server's error code (editor.zone_locked…). */
export class EditorApiError extends Error
{
    constructor(readonly status: number, readonly code: string)
    {
        super(`${status} ${code}`);
        this.name = 'EditorApiError';
    }
}
