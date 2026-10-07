import type {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {$, describe, esc} from './html';

/** The zone list and the creation form; resolves with the zone to open. */
export async function pickZone(root: HTMLElement, api: EditorApiClient, notice = ''): Promise<IZoneSummary>
{
    let zones: IZoneSummary[] = [];
    let error = notice;

    try
    {
        zones = await api.listZones();
    }
    catch (e)
    {
        error = describe(e);
    }

    root.innerHTML = `
        <div class="card zones">
            <h1>Zones <small>Ambreia</small></h1>
            <table>
                <thead><tr><th>Clé</th><th>Nom</th><th>Room</th><th>Publiée</th><th>Dernière</th><th></th></tr></thead>
                <tbody>${zones.map(z => `
                    <tr>
                        <td><code>${esc(z.key)}</code></td>
                        <td>${esc(z.name)}</td>
                        <td>${z.roomId}</td>
                        <td>${z.publishedVersion ?? '—'}</td>
                        <td>${z.latestVersion || '—'}${z.lockedByAccountId ? ' 🔒' : ''}</td>
                        <td><button data-open="${esc(z.key)}">Ouvrir</button></td>
                    </tr>`).join('') || '<tr><td colspan="6" class="muted">Aucune zone : créez la première.</td></tr>'}
                </tbody>
            </table>
            <form class="create">
                <input name="key" placeholder="clé (village_test)" pattern="[a-z0-9_]+" required>
                <input name="name" placeholder="nom affiché" required>
                <button class="primary" type="submit">Créer</button>
            </form>
            <p class="error">${esc(error)}</p>
        </div>`;

    return new Promise(resolve =>
    {
        root.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(b =>
            b.addEventListener('click', () => resolve(zones.find(z => z.key === b.dataset.open)!)));

        const form = $<HTMLFormElement>(root, 'form.create');

        form.addEventListener('submit', async e =>
        {
            e.preventDefault();

            const data = new FormData(form);

            try
            {
                resolve(await api.createZone(String(data.get('key')), String(data.get('name'))));
            }
            catch (err)
            {
                const code = (err as {code?: string}).code;

                $(root, '.error').textContent = code === 'editor.zone_exists' ? 'Cette clé existe déjà.' : describe(err);
            }
        });
    });
}
