// habbo.com's `notifier` factory, which is where every "saved", "wrong code" and "server error" on
// the site is said. It wraps toastr with one set of options and translates its arguments:
//
//   angular.module("notifier").factory("notifier", ["$q", "$translate", function ($q, $translate) {
//     var base   = { extendedTimeOut: 1000, hideDuration: 300, positionClass: "toast-top-center",
//                    preventDuplicates: true, progressBar: true, showDuration: 300, timeOut: 20000 },
//         sticky = _.extend({}, base, { extendedTimeOut: 0, hideDuration: 0, timeOut: 0,
//                    positionClass: "toast-top-center toast-sticky", tapToDismiss: false }),
//         …
//     return { success: …, error: …, errorSticky: …, errorStickyRawMessage: … }
//
// The two facts that matter for a port: **the argument is a translation KEY, never a sentence**,
// and there is no title on an ordinary toast — `_.partialRight(toastr.success, "", base)` pins the
// title to the empty string. A title only appears on the sticky variant, which also carries an OK
// button and never dismisses itself.
//
// `$translate(key, values).then(show).catch(show)` shows the KEY when the key is missing, because
// angular-translate rejects with it. `t()` returns the key in that case, so the behaviour is the
// same without the branch.
//
// This existed nowhere in the port, so every page said these things inline instead — a `<p>` under
// a form where habbo.com floats a card over the top of the screen. None of the keys below appear in
// any of habbo.com's 210 templates, which is how you can tell: they are toast text and nothing else.
import {writable} from 'svelte/store';
import {t} from './i18n.js';
import type {ITranslationValues} from './i18n.js';

/** `showDuration` / `hideDuration`, the fade either way. */
export const FADE_DURATION = 300;

const TIME_OUT = 20_000;
const EXTENDED_TIME_OUT = 1_000;

export interface IToast
{
    id: number;
    type: 'success' | 'error';
    /** Empty on every ordinary toast — habbo.com pins the title to `""`. */
    title: string;
    message: string;
    /**
     * Whether the message carries markup. toastr inserts its message as HTML, and habbo.com relies
     * on that — `EMAIL_CHANGE_SUCCESS` is "… <b>Ton adresse ne sera pas changée jusqu'à ce que tu
     * cliques sur le lien…</b>". It escapes exactly one path, the raw server message
     * (`_.escape(r)`), so the split below is habbo.com's own: a translated key is markup, a string
     * the server wrote is text.
     */
    html: boolean;
    /** Never dismisses itself, cannot be tapped away, and carries an OK button. */
    sticky: boolean;
    /** 0 on a sticky toast: no clock at all. */
    timeOut: number;
    /** What the clock is restarted with when the pointer leaves. */
    extendedTimeOut: number;
}

export const toasts = writable<IToast[]>([]);

let nextId = 1;

// `preventDuplicates` in toastr compares against the LAST message shown, not against what is
// currently on screen — so a repeated message is dropped even after the first one has faded, and
// two different messages in a row both show. Ported as written rather than as a scan of the list.
let previous = '';

function show(toast: Omit<IToast, 'id'>): void
{
    if(toast.message === previous)
    {
        return;
    }

    previous = toast.message;

    toasts.update((all) => [...all, {...toast, id: nextId++}]);
}

/** `notifier.success(key, values)` — the green card with a tick. */
export function success(key: string, values?: ITranslationValues): void
{
    show({
        type:'success',
        title: '',
        message: t(key, values),
        html: true,
        sticky: false,
        timeOut: TIME_OUT,
        extendedTimeOut: EXTENDED_TIME_OUT,
    });
}

/** `notifier.error(key, values)` — the crimson card with a cross. */
export function error(key: string, values?: ITranslationValues): void
{
    show({
        type:'error',
        title: '',
        message: t(key, values),
        html: true,
        sticky: false,
        timeOut: TIME_OUT,
        extendedTimeOut: EXTENDED_TIME_OUT,
    });
}

/**
 * `notifier.errorSticky(titleKey, messageKey, messageValues)`. The argument order is habbo.com's
 * own and it is not the obvious one: its `$q.all([$translate(o, a), $translate(n), …])` resolves
 * the MESSAGE first and the title second, because `toastr.error(message, title)` takes them that
 * way round.
 */
export function errorSticky(titleKey: string, messageKey: string, messageValues?: ITranslationValues): void
{
    show({
        type:'error',
        title: t(titleKey),
        message: t(messageKey, messageValues),
        html: true,
        sticky: true,
        timeOut: 0,
        extendedTimeOut: 0,
    });
}

/**
 * `notifier.errorStickyRawMessage(raw, titleKey)` — the same card for a message the SERVER wrote,
 * which has no key to translate. habbo.com escapes it (`_.escape`) because it concatenates the OK
 * button into an HTML string; here the message is bound as text, so escaping is the renderer's job
 * and doing it again would show the entities.
 */
export function errorStickyRawMessage(raw: string, titleKey: string): void
{
    show({
        type:'error',
        title: t(titleKey),
        message: raw,
        html: false,
        sticky: true,
        timeOut: 0,
        extendedTimeOut: 0,
    });
}

export function dismiss(id: number): void
{
    toasts.update((all) => all.filter((toast) => toast.id !== id));
}

/** `toastr.clear()` — used before showing a toast that replaces whatever is up. */
export function clear(): void
{
    previous = '';
    toasts.set([]);
}
