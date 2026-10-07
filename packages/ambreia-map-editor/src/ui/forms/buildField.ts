import type {IWindow} from '@ambreia/ui/IWindow';
import {CheckBinding, child, ChoiceBinding, NumberBinding, setEnabled, setText, TextBinding} from '../bind';
import type {IFieldSpec} from './IFieldSpec';

const TEMPLATES: Readonly<Record<IFieldSpec['kind'], string>> = {
    section: 'vortex_map_editor_section_xml',
    text: 'vortex_map_editor_field_text_xml',
    number: 'vortex_map_editor_field_number_xml',
    select: 'vortex_map_editor_field_select_xml',
    check: 'vortex_map_editor_check_row_xml',
    area: 'vortex_map_editor_field_area_xml'
};

/** One form row built from the owner's field template for its kind, bound to the document. */
export function buildField(build: (layout: string) => IWindow | null, f: IFieldSpec): {window: IWindow; binding: {render(): void}} | null
{
    const row = build(TEMPLATES[f.kind]);

    if(!row) return null;

    const get = f.get ?? (() => '');
    const set = f.readOnly || !f.set ? () => undefined : f.set;
    let binding: {render(): void} = {render: () => undefined};

    switch(f.kind)
    {
        case 'section':
            setText(row, 'section_label', f.label);
            break;
        case 'check':
            setText(row, 'check_label', f.label);
            binding = new CheckBinding(row, 'check', () => !!get(), v => set(v));
            break;
        case 'number':
            setText(row, 'field_label', f.label);
            binding = new NumberBinding(row, 'field', () => Number(get()) || 0, v => set(v), f.min, f.max, f.step);
            break;
        case 'select':
            setText(row, 'field_label', f.label);
            binding = new ChoiceBinding<string>(row, 'field', () => String(get()), v => set(v)).options(f.options ?? []);
            break;
        default:
            setText(row, 'field_label', f.label);
            binding = new TextBinding(row, 'field', () => String(get()), v => set(v));
    }

    if(f.readOnly && f.kind !== 'section') setEnabled(child(row, f.kind === 'check' ? 'check' : 'field'), false);

    return {window: row, binding};
}
