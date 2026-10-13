/** How a combat log line names what it is about: room objects by name, skills and statuses by their content name. */
export interface ILogNames
{
    name(objectId: number): string;
    content(id: string): string;
}
