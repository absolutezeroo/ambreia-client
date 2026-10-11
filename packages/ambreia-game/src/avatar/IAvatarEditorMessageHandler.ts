/** Network requests still owned by the avatar editor. */
export interface IAvatarEditorMessageHandler
{
    checkName(name: string): void;
    dispose(): void;
}
