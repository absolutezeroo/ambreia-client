import {EditorApiClient} from '@ambreia/map-editor-core/api/EditorApiClient';
import type {IFurniturePaletteEntry} from '@ambreia/map-editor-core/api/IFurniturePaletteEntry';
import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import {blankZone} from '@ambreia/map-editor-core/zone/blankZone';
import {EditorApp} from './app/EditorApp';
import {describe} from './panels/html';
import {pickZone} from './panels/pickZone';
import {showLogin} from './panels/showLogin';
import './style.css';

const root = document.getElementById('app')!;
const api = new EditorApiClient();

/** Sign in when needed, then zone list → editor → zone list, for as long as the app runs. */
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

    let palette: IFurniturePaletteEntry[] | null = null;
    let notice = '';

    for(;;)
    {
        const zone = await pickZone(root, api, notice);

        notice = '';
        try
        {
            if(!await takeLock(zone)) continue;

            root.innerHTML = '<div class="card"><p>Chargement de la zone et des meubles…</p></div>';
            palette ??= await api.palette();

            const doc = await api.latestDocument(zone.key) ?? blankZone(zone.key, zone.name);

            await new EditorApp(root, api, zone, doc, palette).run();
        }
        catch (error)
        {
            notice = describe(error);
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
