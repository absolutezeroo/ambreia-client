import {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {blankZone} from '@ambreia/map-editor-core/zone/blankZone';
import {EditorApp} from './app/EditorApp';
import {HomeScreen} from './home/HomeScreen';
import {LoginDialog} from './home/LoginDialog';
import {MapBrowser} from './home/MapBrowser';
import {describe} from './panels/html';
import {bootWindowSystem} from './ui/bootWindowSystem';
import {EditorUi} from './ui/EditorUi';
import {WindowCanvasHost} from './ui/WindowCanvasHost';
import './style.css';

const root = document.getElementById('app')!;
const stage = document.getElementById('stage')!;
const api = new EditorApiClient();

/**
 * Everything is the owner's windows (@ambreia/ui) on one canvas: the home screen with the login,
 * then the zone browser → editor → zone browser, for as long as the app runs.
 */
async function boot(): Promise<void>
{
    root.innerHTML = '<div class="card"><p>Chargement des fenêtres…</p></div>';

    const [{manager, texts}, reason] = await Promise.all([bootWindowSystem(), sessionProblem()]);

    root.hidden = true;
    stage.hidden = false;

    const host = new WindowCanvasHost(stage, manager);
    const home = new HomeScreen(manager);

    if(reason !== null)
    {
        const login = new LoginDialog(manager, home, api, texts);

        await login.signIn(reason);
        login.dispose();
    }

    const browser = new MapBrowser(manager, home, api, texts);
    let palette: IFurniturePaletteEntry[] | null = null;
    let notice = '';

    for(;;)
    {
        const zone = await browser.pick(notice);

        notice = '';
        try
        {
            if(!await takeLock(zone)) continue;

            palette ??= await api.palette();

            const doc = await api.latestDocument(zone.key) ?? blankZone(zone.key, zone.name);
            const app = new EditorApp(api, zone, doc, palette);

            app.zones = await api.listZones();
            home.hide();

            const ui = new EditorUi(manager, texts, app, host);

            await app.run();
            ui.dispose();
            host.setView(null);
        }
        catch (error)
        {
            notice = describe(error);
        }
        finally
        {
            home.show();
        }
    }
}

/** Null when the session cookie is good; otherwise what to tell on the login ('' for no session). */
async function sessionProblem(): Promise<string | null>
{
    try
    {
        await api.listZones();

        return null;
    }
    catch (error)
    {
        return (error as {status?: number}).status === 401 ? '' : describe(error);
    }
}

/** Editing takes the zone's lock; someone else's lock is taken only on purpose. */
async function takeLock(zone: IZoneSummary): Promise<boolean>
{
    if(await api.lock(zone.key)) return true;
    if(!window.confirm(`${zone.name} est ouverte par un autre compte. Prendre le verrou quand même ?`)) return false;

    return api.lock(zone.key, true);
}

void boot().catch(error =>
{
    stage.hidden = true;
    root.hidden = false;
    root.innerHTML = '<div class="card"><p class="error"></p></div>';
    root.querySelector('.error')!.textContent = `L'éditeur n'a pas pu démarrer : ${describe(error)}`;
});
