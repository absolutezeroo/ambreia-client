import type {IItemListWindow} from '@ambreia/ui/components/IItemListWindow';
import type {ITextWindow} from '@ambreia/ui/components/ITextWindow';
import type {IWindow} from '@ambreia/ui/IWindow';
import type {ZoneAction, ZoneCondition} from '@ambreia/map-editor-core/zone/Zone.generated';
import type {EditorApp} from '../../app/EditorApp';
import {onClick, onWindowClick} from '../bind';
import type {EditorTexts} from '../EditorTexts';
import {buildField} from './buildField';
import {RULE_KINDS} from './RULE_KINDS';
import {ruleFields} from './ruleFields';

type Rule = ZoneCondition | ZoneAction;

const OPEN = 0xffcfe6ff;
const RPG = 0xff9a6200;

/**
 * Conditions or actions in one of the owner's lists (condition_list, action_list): a rule_row
 * per rule, in the owner's words ("Heure entre 8 et 20"), its remove button, and — for the rule
 * clicked — its fields right under it. Every change replaces the whole list (one undo step).
 */
export class RuleListUi<R extends Rule>
{
    private _open = -1;
    private _shown = '';
    private _bindings: {render(): void}[] = [];

    constructor(
        private readonly _list: IItemListWindow | null,
        private readonly _app: EditorApp,
        private readonly _texts: EditorTexts,
        private readonly _family: 'conditions' | 'actions',
        private readonly _build: (layout: string) => IWindow | null,
        private readonly _get: () => readonly R[],
        private readonly _set: (rules: R[]) => void
    )
    {
    }

    /** Wires the owner's "+" next to the list. */
    bindAdd(root: IWindow, name: string): void
    {
        onClick(root, name, () =>
        {
            const rules = [...this._get(), {...RULE_KINDS[this._family][0].defaults} as unknown as R];

            this._open = rules.length - 1;
            this._set(rules);
        });
    }

    render(): void
    {
        const list = this._list;

        if(!list) return;

        const rules = this._get();

        if(this._open >= rules.length) this._open = -1;

        const key = JSON.stringify([rules, this._open, this._app.doc.zones?.length, this._app.doc.decor?.length]);

        if(key !== this._shown)
        {
            this._shown = key;
            this._bindings = [];
            list.destroyListItems();

            const rows: IWindow[] = [];

            rules.forEach((rule, i) =>
            {
                const row = this._build('vortex_map_editor_rule_row_xml');

                if(!row) return;

                const text = (row as unknown as {findChildByName(n: string): IWindow | null}).findChildByName('rule_txt') as ITextWindow | null;
                const rpg = RULE_KINDS[this._family].find(k => k.kind === rule.kind)?.rpg ?? false;

                if(text)
                {
                    text.text = `${this.describe(rule)}${rpg ? ' (RPG)' : ''}`;
                    if(rpg) text.textColor = RPG;
                }
                if(i === this._open) row.color = OPEN;
                onWindowClick(row, () =>
                {
                    this._open = this._open === i ? -1 : i;
                    this.render();
                });
                onClick(row, 'remove_button', () =>
                {
                    this._open = -1;
                    this._set(rules.filter((_, j) => j !== i));
                });
                rows.push(row);

                if(i !== this._open) return;

                for(const field of ruleFields(this._app, this._family, rule, next => this._set(rules.map((r, j) => j === i ? next as R : r))))
                {
                    const built = buildField(this._build, field);

                    if(!built) continue;

                    rows.push(built.window);
                    this._bindings.push(built.binding);
                }
            });

            list.populate(rows);
        }

        for(const binding of this._bindings) binding.render();
    }

    /** The owner's sentence for the rule ("Téléporter vers %zone% (%entry%)"), its parameters filled. */
    private describe(rule: R): string
    {
        const prefix = this._family === 'conditions' ? 'cond' : 'act';
        const key = `vortex.mapeditor.${prefix}.${rule.kind}`;
        const params = Object.fromEntries(Object.entries(rule).map(([k, v]) => [k, String(v ?? '') || '?']));

        return this._texts.has(key) ? this._texts.get(key, params) : String(rule.kind);
    }
}
