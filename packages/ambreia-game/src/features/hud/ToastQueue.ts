import type {IToast} from './IToast';

/**
 * Which toasts are on screen: at most `max`, oldest first; the others wait, and a toast's time starts
 * when it shows. A toast pushed again while shown restarts it rather than stacking a copy (a refused
 * attack key held down is one toast).
 */
export class ToastQueue
{
    private readonly _waiting: IToast[] = [];
    private readonly _shown: {toast: IToast; until: number}[] = [];

    constructor(private readonly _max: number) {}

    get visible(): readonly IToast[]
    {
        return this._shown.map(shown => shown.toast);
    }

    /** True when what is visible changed. */
    push(toast: IToast, now: number): boolean
    {
        const same = this._shown.find(shown => shown.toast.kind === toast.kind && shown.toast.title === toast.title && shown.toast.text === toast.text);

        if(same)
        {
            same.until = now + toast.ms;

            return false;
        }

        this._waiting.push(toast);

        return this.fill(now);
    }

    /** Drops the expired ones and shows the waiting; true when what is visible changed. */
    tick(now: number): boolean
    {
        const before = this._shown.length;

        for(let i = this._shown.length - 1; i >= 0; i--) if(this._shown[i]!.until <= now) this._shown.splice(i, 1);

        return this.fill(now) || this._shown.length !== before;
    }

    private fill(now: number): boolean
    {
        let changed = false;

        while(this._shown.length < this._max && this._waiting.length > 0)
        {
            const toast = this._waiting.shift()!;

            this._shown.push({toast, until: now + toast.ms});
            changed = true;
        }

        return changed;
    }
}
