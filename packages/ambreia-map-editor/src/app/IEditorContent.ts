import type {IEditorMonster} from '@ambreia/map-editor-core/api/IEditorMonster';

/** What the editor names from the content, loaded once per run: monsters, dialogues, quests, their texts. */
export interface IEditorContent
{
    readonly monsters: IEditorMonster[];
    readonly texts: Map<string, string>;
    readonly dialogues: string[];
    readonly quests: string[];
}
