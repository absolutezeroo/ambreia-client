/** Result surface used by the avatar-editor message handler. */
export interface IAvatarEditorNameChangeView
{
    checkedName: string | null;

    setNameNotAvailableView(resultCode: number, name: string, suggestions: string[]): void;

    focus(): void;

    dispose(): void;
}
