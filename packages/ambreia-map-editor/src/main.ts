import {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {blankZone} from '@ambreia/map-editor-core/zone/blankZone';
import {EditorApp} from './app/EditorApp';
import {describe} from './panels/html';
import {pickZone} from './panels/pickZone';
import {showLogin} from './panels/showLogin';
import {bootWindowSystem} from './ui/bootWindowSystem';
import {EditorUi} from './ui/EditorUi';
import {WindowCanvasHost} from './ui/WindowCanvasHost';
import './style.css';

const root = document.getElementById('app')!;
const stage = document.getElementById('stage')!;
const api = new EditorApiClient();

/**
 * Sign in when needed, then zone list → editor → zone list, for as long as the app runs. The
 * sign-in and the zone list are plain pages; the editor itself is the owner's windows
 * (@ambreia/ui), started once and reused for every zone.
 */
async function boot(): Promise<void>
{
    try
    {
        await api.listZones();
    }
    catch (error)
    {
        const status = (error as {status?: number}).status;

        await showLogin(root, api, status === 401 ? '' : describe(error));
    }

    const windows = bootWindowSystem();
    let palette: IFurniturePaletteEntry[] | null = null;
    let notice = '';

    for(;;)
    {
        const zone = await pickZone(root, api, notice);

        notice = '';
        try
        {
            if(!await takeLock(zone)) continue;

            root.innerHTML = '<div class="card"><p>Chargement de la zone, des meubles et des fenêtres…</p></div>';
            palette ??= await api.palette();

            const doc = await api.latestDocument(zone.key) ?? blankZone(zone.key, zone.name);
            const {manager, texts} = await windows;
            const app = new EditorApp(api, zone, doc, palette);

            root.hidden = true;
            stage.hidden = false;

            const host = new WindowCanvasHost(stage, manager);
            const ui = new EditorUi(manager, texts, app, host);

            await app.run();
            ui.dispose();
            host.dispose();
        }
        catch (error)
        {
            notice = describe(error);
        }
        finally
        {
            stage.hidden = true;
            root.hidden = false;
        }
    }
}

/** Editing takes the zone's lock; someone else's lock is taken only on purpose. */
async function takeLock(zone: IZoneSummary): Promise<boolean>
{
    if(await api.lock(zone.key)) return true;
    if(!window.confirm(`${zone.name} est ouverte par un autre compte. Prendre le verrou quand même ?`)) return false;

    return api.lock(zone.key, true);
}

void boot();
