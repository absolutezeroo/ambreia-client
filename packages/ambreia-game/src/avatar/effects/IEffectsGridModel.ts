import type {IAvatarEffect} from '../IAvatarEffect';
import type {IAvatarEditorGridModel} from '../common/IAvatarEditorGridModel';

/** Model surface unique to the effects grid. */
export interface IEffectsGridModel extends IAvatarEditorGridModel
{
    readonly effects: IAvatarEffect[];
}
