import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
import type {IItemGridWindow} from '@ambreia/ui/components/IItemGridWindow';
import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';

/** The arrays each HUD list was last built from: a render that does not change one rebuilds nothing. */
export class ListCache
{
    private readonly _built = new Map<string, unknown>();

    /**
     * The list or grid named `name`, emptied for a rebuild — or null when `items` is the array it was
     * last built from, so nothing needs doing. `key` tells two lists of one name apart.
     */
    rebuild<T extends IItemListWindow | IItemGridWindow>(window: IWindowContainer, name: string, items: readonly unknown[], key: string = name): T | null
    {
        const holder = window.findChildByName(name) as T | null;

        if(!holder || this._built.get(key) === items) return null;

        this._built.set(key, items);

        if('destroyGridItems' in holder) holder.destroyGridItems();
        else holder.destroyListItems();

        return holder;
    }

    clear(): void
    {
        this._built.clear();
    }
}
