import type {IWindow} from '@ambreia/ui/IWindow';
import type {IGlazeRuntime} from '../boot/GlazeBoot';
import type {VariablesModel} from './VariablesModel';

export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vmiddle' | 'bottom';

export interface ISelectionOpsState
{
    readonly rootWindow: IWindow | null;
    readonly selection: readonly IWindow[];
    pushHistory(coalesceKey?: string | null): void;
    notifyGeometryChanged(): void;
}

export interface ILayoutSerializerState
{
    readonly rootWindow: IWindow | null;
    readonly currentLayoutName: string | null;
    readonly rootOrigin: {x: number; y: number};
    readonly runtime: IGlazeRuntime;
    readonly variables: VariablesModel | null;
    openLayout(name: string): void;
}

export interface IEditorHistoryState extends ILayoutSerializerState
{
    readonly selected: IWindow | null;
    select(window: IWindow | null): void;
}
