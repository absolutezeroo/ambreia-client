import type {IWindow} from '../IWindow';

/** Recursive selectable/selector contracts colocated to avoid a type-only module cycle. */
export interface ISelectableWindow extends IWindow
{
    readonly selector: ISelectorWindow | null;

    isSelected: boolean;

    select(): boolean;

    unselect(): boolean;
}

export interface ISelectorWindow extends IWindow
{
    readonly numSelectables: number;

    getSelected(): ISelectableWindow | null;

    setSelected(selectable: ISelectableWindow): void;

    addSelectable(selectable: ISelectableWindow): ISelectableWindow;

    addSelectableAt(selectable: ISelectableWindow, index: number): ISelectableWindow;

    getSelectableAt(index: number): ISelectableWindow | null;

    getSelectableByID(id: number): ISelectableWindow | null;

    getSelectableByTag(tag: string): ISelectableWindow | null;

    getSelectableByName(name: string): ISelectableWindow | null;

    getSelectableIndex(selectable: ISelectableWindow): number;

    removeSelectable(selectable: ISelectableWindow): ISelectableWindow | null;
}
