/**
 * One row of a form, built from the owner's field templates: a section title, a text, a number
 * (with arrows), a choice, a check box or a multi-line text. get/set read and write the document.
 */
export interface IFieldSpec
{
    readonly kind: 'section' | 'text' | 'number' | 'select' | 'check' | 'area';
    readonly label: string;
    readonly get?: () => string | number | boolean;
    readonly set?: (value: string | number | boolean) => void;
    /** For 'select': (value, label) pairs. */
    readonly options?: readonly (readonly [string, string])[];
    readonly min?: number;
    readonly max?: number;
    readonly step?: number;
    readonly readOnly?: boolean;
}
