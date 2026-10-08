/**
 * The one bug channel the server cannot open for itself.
 *
 * Every other observability surface records something the hotel noticed: the emulator groups
 * exceptions it threw, counts what it served, audits what somebody invoked. A room that renders
 * blank, a window drawn off-screen, an avatar with no head — none of those throw, none of those
 * move a counter, and none of them reach anyone. They are bugs only because a person says so.
 *
 * Deliberately plain DOM rather than the client's own window manager. This has to work when the
 * canvas is the thing that is broken, and a reporter that needs the renderer to be healthy is a
 * reporter that is missing exactly when it is wanted. `<dialog>` is native, so there is no library
 * and no styling framework behind this.
 */

/** How many console lines to keep. Enough for a stack trace and what led to it. */
const CONSOLE_BUFFER_LINES = 40;

/**
 * Matches `web.api.en` in the shipped configuration, which is an origin-root path on purpose: the
 * client asks whichever origin served it, and that origin routes /webapi to the emulator (Caddy in
 * production, Vite's proxy in development). An absolute URL here would be wrong in one of the two.
 */
const REPORT_ENDPOINT = '/webapi/api/user/reports';

/** Mirrors SubmitReportRequest server-side, so the ceiling is hit here rather than as a 400. */
const MAX_MESSAGE = 2000;
const MAX_CONSOLE = 4000;

const consoleLines: string[] = [];

let installed = false;

/**
 * Keeps the tail of what the console was told. Wrapping rather than replacing: the original is
 * still called first, so devtools and any other listener see exactly what they saw before.
 */
function captureConsole(): void
{
    (['error', 'warn'] as const).forEach((level) =>
    {
        /*
         * no-console is off for these two lines only, and the rule is right everywhere else: code
         * that wants to say something uses Logger. This is the one place that must read what
         * everyone else wrote — Logger's own output, the engine's, a third-party library's, and
         * the browser's — and there is no seam above console that sees all four.
         */
        // eslint-disable-next-line no-console
        const original = console[level].bind(console);

        // eslint-disable-next-line no-console
        console[level] = (...args: unknown[]) =>
        {
            original(...args);

            try
            {
                consoleLines.push(`[${level}] ${args.map(describe).join(' ')}`);

                if(consoleLines.length > CONSOLE_BUFFER_LINES) consoleLines.shift();
            }
            catch
            {
                // A capture that throws while reporting a problem would replace the problem with
                // its own. Never let this path fail.
            }
        };
    });

    // An unhandled rejection is the shape most client bugs actually take — an await that threw
    // where nobody was catching — and it never reaches console.error on its own.
    window.addEventListener('unhandledrejection', (event) =>
    {
        consoleLines.push(`[unhandledrejection] ${describe(event.reason)}`);

        if(consoleLines.length > CONSOLE_BUFFER_LINES) consoleLines.shift();
    });
}

function describe(value: unknown): string
{
    if(value instanceof Error) return `${value.name}: ${value.message}`;

    if(typeof value === 'string') return value;

    try
    {
        return JSON.stringify(value) ?? String(value);
    }
    catch
    {
        return String(value);
    }
}

function buildDialog(): HTMLDialogElement
{
    const dialog = document.createElement('dialog');
    dialog.id = 'vortex-bug-report';
    dialog.innerHTML = `
        <form method="dialog">
            <h2>Report a problem</h2>
            <p>What went wrong? What were you doing when it happened?</p>
            <textarea maxlength="${MAX_MESSAGE}" rows="6" required
                      placeholder="The room stayed blank after the loading bar filled…"></textarea>
            <div class="vortex-bug-report__actions">
                <button value="cancel" formnovalidate>Cancel</button>
                <button value="send" class="vortex-bug-report__send">Send</button>
            </div>
            <p class="vortex-bug-report__status" role="status"></p>
        </form>
    `;

    return dialog;
}

/**
 * One stylesheet, every selector scoped to this component's own id or class prefix, so it cannot
 * reach the client's DOM.
 *
 * The palette is not invented: it is the client's own, from VortexLoadingScreen's AS3 colour
 * constants — #0E151C the background, #BACAD3 → #8CA1AD the loading bar's two fill halves, #7ECDAE
 * the message accent, Arial the face the whole DOM layer already uses. A reporter styled like a
 * browser dialog would read as something the page picked up from elsewhere; this reads as part of
 * the hotel, which is also what makes a player trust it enough to use it.
 */
const STYLE = `
#vortex-bug-report {
    padding: 0; max-width: 440px; width: calc(100% - 32px);
    background: #0E151C; color: #FFF; border: 1px solid #BACAD3;
    font: 13px/1.5 Arial, Helvetica, sans-serif;
    box-shadow: 0 6px 24px rgb(0 0 0 / 60%);
}
#vortex-bug-report::backdrop { background: rgb(0 0 0 / 60%); }
#vortex-bug-report form { padding: 16px 18px 14px; }

/* The title bar idiom of the client's own windows: the light fill over the dark body. */
#vortex-bug-report h2 {
    margin: -16px -18px 12px; padding: 6px 12px;
    font-size: 13px; color: #0E151C;
    background: linear-gradient(#BACAD3 50%, #8CA1AD 50%);
}
#vortex-bug-report p { margin: 0 0 10px; color: #999; }
#vortex-bug-report textarea {
    width: 100%; box-sizing: border-box; resize: vertical;
    padding: 7px; font: inherit; color: #FFF;
    background: #000; border: 1px solid #26262F;
}
#vortex-bug-report textarea:focus { outline: none; border-color: #8CA1AD; }

/*
 * Every rule below is anchored on the id. Not for scoping — the class prefix already does that —
 * but for specificity: a bare .vortex-bug-report__send (0,1,0) loses to
 * .vortex-bug-report__actions button (0,1,1), and the primary button silently rendered identical
 * to Cancel. The status line lost to #vortex-bug-report p the same way, which turned every
 * message grey. Both are invisible in the source and obvious on screen.
 */
#vortex-bug-report .vortex-bug-report__actions {
    display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;
}
#vortex-bug-report .vortex-bug-report__actions button {
    padding: 5px 16px; cursor: pointer; font: inherit;
    color: #BACAD3; background: #0E151C; border: 1px solid #26262F;
}
#vortex-bug-report .vortex-bug-report__actions button:hover { border-color: #8CA1AD; }
/*
 * The element in "button.send" is load-bearing, not decoration. Anchoring on the id was not
 * enough: the rule above is
 * (1,2,1) — id, two classes, one element — and a selector without the element is (1,2,0), so the
 * primary button kept rendering exactly like Cancel. Matching the element back puts this at
 * (1,3,1). CSS specificity does not care which rule reads more specific.
 */
#vortex-bug-report .vortex-bug-report__actions button.vortex-bug-report__send {
    color: #0E151C; font-weight: bold;
    background: linear-gradient(#BACAD3 50%, #8CA1AD 50%); border-color: #8CA1AD;
}
#vortex-bug-report .vortex-bug-report__actions button.vortex-bug-report__send:hover {
    background: linear-gradient(#D3DEE4 50%, #9FB2BD 50%); border-color: #BACAD3;
}

#vortex-bug-report .vortex-bug-report__status { margin: 12px 0 0; color: #7ECDAE; }
#vortex-bug-report .vortex-bug-report__status:empty { display: none; }

/* A failure in the accent colour reads as success — the one thing the status line must not do. */
#vortex-bug-report .vortex-bug-report__status--error { color: #E8836F; }
`;

function setStatus(element: HTMLElement, text: string, isError: boolean): void
{
    element.textContent = text;
    element.classList.toggle('vortex-bug-report__status--error', isError);
}

/** The server's MAX_CONTEXT, which every short field is measured against. */
const MAX_CONTEXT = 500;

async function send(message: string): Promise<number>
{
    const response = await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},

        // Same-origin by default, which is what carries the session cookie. The endpoint is
        // authenticated on purpose: an anonymous report cannot be correlated with anything.
        body: JSON.stringify({
            message: message.slice(0, MAX_MESSAGE),

            // Sliced like the other two short fields. It was the one field sent whole, and the
            // client is served under a base path with an `?sso=` ticket on it — a URL long enough
            // to trip SubmitReportRequest.IsValid, which answers 400 and says nothing about why.
            page: (location.pathname + location.search).slice(0, MAX_CONTEXT),

            // The browser, not a version number: there is no build stamp in this client, and for a
            // rendering bug "which browser" answers more than "which commit" would. Sliced to the
            // server's context ceiling so a long user-agent cannot turn into a 400.
            clientVersion: `${import.meta.env.MODE} · ${navigator.userAgent}`.slice(0, MAX_CONTEXT),
            console: consoleLines.join('\n').slice(-MAX_CONSOLE),
        }),
    });

    return response.status;
}

/**
 * The status line for a failed POST.
 *
 * It used to be the single sentence "Could not send — are you signed in?" for every status the
 * route can answer, so a rate-limited retry loop, an over-long field and a route that is not
 * mounted all accused the player of being signed out — and a player who *is* signed in has nowhere
 * to go from there. Each branch below is a status this endpoint actually returns.
 */
function failureText(status: number): string
{
    if(status === 401) return 'Could not send — you are signed out. Sign in and try again.';

    if(status === 429) return 'Too many reports just now. Try again in a few minutes.';

    if(status === 400) return 'Could not send — the report was rejected as malformed.';

    return `Could not send (error ${status}). Please try again.`;
}

/**
 * Adds the dialog (F8) to the page. Safe to call more than once; the second call is a
 * no-op rather than a second listener.
 */
export function installBugReporter(): void
{
    if(installed) return;

    installed = true;

    captureConsole();

    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    const dialog = buildDialog();
    document.body.appendChild(dialog);

    // F8, not a button: the floating one sat over the game, on the strip of a website the client no
    // longer runs in. Not Ctrl+Shift+B either, which Chrome and Edge keep for the bookmarks bar.
    window.addEventListener('keydown', (event) =>
    {
        if(event.code !== 'F8' || dialog.open) return;

        event.preventDefault();
        dialog.showModal();
    });

    const form = dialog.querySelector('form')!;
    const textarea = dialog.querySelector('textarea')!;
    const status = dialog.querySelector<HTMLElement>('.vortex-bug-report__status')!;

    form.addEventListener('submit', (event) =>
    {
        const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;

        if(submitter?.value !== 'send') return;

        // The dialog stays open until the POST answers: closing on submit would tell the player it
        // was sent before anyone knows whether it was.
        event.preventDefault();

        const message = textarea.value.trim();

        if(!message) return;

        setStatus(status, 'Sending…', false);

        send(message)
            .then((code) =>
            {
                if(code < 200 || code >= 300)
                {
                    setStatus(status, failureText(code), true);

                    return;
                }

                textarea.value = '';
                setStatus(status, '', false);
                dialog.close();
            })
            .catch(() =>
            {
                setStatus(status, 'Could not send. Please try again.', true);
            });
    });
}
