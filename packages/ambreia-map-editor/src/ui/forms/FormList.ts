import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import {buildField} from './buildField';
import type {IFieldSpec} from './IFieldSpec';

/**
 * A form in an item list: rows built from the owner's field templates. The rows are rebuilt only
 * when the fields themselves change (another element, another kind); otherwise only their values
 * are refreshed, so a field being typed in keeps its focus.
 */
export class FormList
{
    private _signature = '';
    private _bindings: {render(): void}[] = [];

    constructor(private readonly _list: IItemListWindow | null, private readonly _build: (layout: string) => IWindow | null)
    {
    }

    show(fields: readonly IFieldSpec[]): void
    {
        const list = this._list;

        if(!list) return;

        const signature = JSON.stringify(fields.map(f => [f.kind, f.label, f.options ?? null, !!f.readOnly]));

        if(signature !== this._signature)
        {
            this._signature = signature;
            this._bindings = [];
            list.destroyListItems();

            const rows: IWindow[] = [];

            for(const field of fields)
            {
                const built = buildField(this._build, field);

                if(!built) continue;

                rows.push(built.window);
                this._bindings.push(built.binding);
            }

            list.populate(rows);
        }

        for(const binding of this._bindings) binding.render();
    }
}
