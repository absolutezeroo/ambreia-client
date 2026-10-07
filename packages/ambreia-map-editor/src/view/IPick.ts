/** What lies under the pointer: the floor cell (even beneath an object) and the topmost object. */
export interface IPick
{
    readonly cell: {readonly x: number; readonly y: number} | null;
    readonly objectId: string | null;
}
