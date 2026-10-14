import {Logger} from '@ambreia/common/utils/Logger';
import {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IEditorMonster} from '@ambreia/map-editor-core/api/IEditorMonster';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {blankZone} from '@ambreia/map-editor-core/zone/blankZone';
import {EditorApp} from './app/EditorApp';
import type {IEditorContent} from './app/IEditorContent';
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
const log = Logger.getLogger('map-editor.main');

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
    let content: Promise<IEditorContent> | null = null;
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
            const loaded = await (content ??= loadContent());

            app.monsters = loaded.monsters;
            app.texts = loaded.texts;
            app.dialogues = loaded.dialogues;
            app.quests = loaded.quests;
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

/**
 * The monsters, dialogues and quests a zone can name, and their names, once per run. A server
 * without a route (or without texts) leaves its menu to the ids the zone already has, and the ids
 * as names.
 */
async function loadContent(): Promise<IEditorContent>
{
    const missing = <T>(what: string) => (error: unknown): T[] =>
    {
        log.warn(`no ${what} list from the server — its menu offers only the ids the zone has`, error);

        return [];
    };
    const [monsters, texts, dialogues, quests] = await Promise.all([
        api.monsters().catch(missing<IEditorMonster>('monster')),
        api.texts().catch((error: unknown) =>
        {
            log.warn('no content texts — monsters, dialogues and quests show their ids', error);

            return new Map<string, string>();
        }),
        api.dialogues().catch(missing<string>('dialogue')),
        api.quests().catch(missing<string>('quest'))
    ]);

    return {monsters, texts, dialogues, quests};
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
