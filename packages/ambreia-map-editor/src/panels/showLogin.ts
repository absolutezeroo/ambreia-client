import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import {$, describe, esc} from './html';

const EMAIL_KEY = 'ambreia.editor.email';

/** The web account sign-in; resolves once the session cookie is set. */
export function showLogin(root: HTMLElement, api: EditorApiClient, reason = ''): Promise<void>
{
    let email = '';

    try
    {
        email = localStorage.getItem(EMAIL_KEY) ?? '';
    }
    catch
    {
        // Storage refused: the field starts empty.
    }

    root.innerHTML = `
        <form class="card login">
            <h1>Ambreia <small>Éditeur de cartes</small></h1>
            <label>E-mail <input name="email" type="email" autocomplete="username" required value="${esc(email)}"></label>
            <label>Mot de passe <input name="password" type="password" autocomplete="current-password" required></label>
            <button class="primary" type="submit">Se connecter</button>
            <p class="error">${esc(reason)}</p>
        </form>`;

    const form = $<HTMLFormElement>(root, 'form');

    $<HTMLInputElement>(form, email ? '[name=password]' : '[name=email]').focus();

    return new Promise(resolve =>
    {
        form.addEventListener('submit', async e =>
        {
            e.preventDefault();

            const data = new FormData(form);
            const button = $<HTMLButtonElement>(form, 'button');

            button.disabled = true;
            try
            {
                await api.login(String(data.get('email')), String(data.get('password')));
                try
                {
                    localStorage.setItem(EMAIL_KEY, String(data.get('email')));
                }
                catch
                {
                    // Not remembered: harmless.
                }
                resolve();
            }
            catch (error)
            {
                $(form, '.error').textContent = describe(error);
                button.disabled = false;
            }
        });
    });
}
