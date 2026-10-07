import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import {child, setText} from '../bind';
import {FormList} from '../forms/FormList';
import type {IFieldSpec} from '../forms/IFieldSpec';
import type {IPanelUi} from '../IPanelUi';

/**
 * A form on the editor's own form layouts (inspect_form, left_form): a title, a hint and the
 * fields form() returns at each render — null shows the title and hint alone.
 */
export class FormPanelUi implements IPanelUi
{
    private readonly _form: FormList;

    constructor(
        private readonly _window: IWindow,
        build: (layout: string) => IWindow | null,
        private readonly _content: () => {readonly title: string; readonly hint: string; readonly fields: readonly IFieldSpec[]} | null,
        private readonly _empty = {title: '', hint: ''}
    )
    {
        this._form = new FormList(child<IItemListWindow>(_window, 'field_list'), build);
    }

    render(): void
    {
        const content = this._content();

        setText(this._window, 'form_title', content?.title ?? this._empty.title);
        setText(this._window, 'form_hint', content?.hint ?? this._empty.hint);
        this._form.show(content?.fields ?? []);
    }
}
