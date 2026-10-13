import type {WindowBits} from '../../../ui/kit/WindowBits';
import type {IToast} from '../../hud/IToast';
import type {ILogEntry} from '../ILogEntry';
import {logLine} from './combatLogLines';
import type {ILogNames} from './ILogNames';

/** A refusal (an attack or a skill the server turned down) is said at once, as a toast, besides its log line. */
export class RefusalToast
{
    constructor(private readonly _toast: (toast: IToast) => void, private readonly _texts: () => Pick<WindowBits, 'text'>, private readonly _names: ILogNames) {}

    logged(entry: ILogEntry): void
    {
        if(entry.kind !== 'refused') return;

        const texts = this._texts();
        const text = (key: string, ...params: string[]): string => texts.text(key, ...params);

        this._toast({kind: 'error', title: text('vortex.toast.refused'), text: logLine(entry, text, this._names).text, ms: 3000});
    }
}
