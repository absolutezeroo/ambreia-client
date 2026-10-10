import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {IWindowContainer} from '@ambreia/ui/IWindowContainer';
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

                fit(built.window, list.width);
                rows.push(built.window);
                this._bindings.push(built.binding);
            }

            list.populate(rows);
        }

        for(const binding of this._bindings) binding.render();
    }
}

/**
 * Narrows a row built for the inspector (316) to a narrower list (the left panel's 292): what
 * overflows shrinks, what sits in its right half (a number field's arrows) moves left instead.
 */
function fit(window: IWindow, width: number): void
{
    const delta = window.width - width;

    if(delta > 0) shrink(window, delta);
}

function shrink(window: IWindow, delta: number): void
{
    window.width -= delta;

    const container = window as IWindowContainer;

    for(let i = 0; i < (container.numChildren ?? 0); i++)
    {
        const child = container.getChildAt(i);

        if(!child || child.x + child.width <= window.width) continue;

        if(child.x > window.width / 2) child.x -= delta;
        else shrink(child, delta);
    }
}
