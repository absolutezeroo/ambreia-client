import type {IZoneSummary} from '@ambreia/map-editor-core/api/IZoneSummary';
import type {ZoneMarks} from './ZoneMarks';

export type BrowserTab = 'zones' | 'templates' | 'mine' | 'favorites' | 'recent';
export type BrowserAction = 'create_zone' | 'create_map' | 'use_template' | 'edit' | 'refresh' | 'unfavorite' | 'forget';

export interface IBrowserTabSpec
{
    /** The tab_button of vortex_map_editor_browser_xml. */
    readonly button: string;
    /** Search hint, name column and count texts (vortex.mapeditor.browser.*). */
    readonly search: string;
    readonly column: string;
    readonly count: string;
    readonly toolbar: readonly BrowserAction[];
    readonly detail: readonly BrowserAction[];
    /** The tab's zones out of the server's list, in the tab's own order. */
    readonly zones: (all: readonly IZoneSummary[], marks: ZoneMarks) => IZoneSummary[];
}

const B = 'vortex.mapeditor.browser';

/** What each tab of the zone browser lists and offers. */
export const BROWSER_TABS: Readonly<Record<BrowserTab, IBrowserTabSpec>> = {
    zones: {
        button: 'tab_zones', search: `${B}.search.zones`, column: `${B}.col.zone`, count: `${B}.count.zones`,
        toolbar: ['create_zone', 'refresh'], detail: ['edit'],
        zones: all => [...all]
    },
    templates: {
        button: 'tab_templates', search: `${B}.search.templates`, column: `${B}.col.template`, count: `${B}.count.templates`,
        toolbar: ['refresh'], detail: ['use_template', 'edit'],
        // Marked as a template in its settings, and published: the server copies the published version.
        zones: all => all.filter(z => z.template === true && z.publishedVersion !== null)
    },
    mine: {
        button: 'tab_mine', search: `${B}.search.mine`, column: `${B}.col.map`, count: `${B}.count.maps`,
        toolbar: ['create_map', 'refresh'], detail: ['edit'],
        zones: (all, marks) => all.filter(z => marks.isMine(z.key))
    },
    favorites: {
        button: 'tab_favorites', search: `${B}.search.favorites`, column: `${B}.col.map_or_template`, count: `${B}.count.favorites`,
        toolbar: ['refresh'], detail: ['edit', 'unfavorite'],
        zones: (all, marks) => all.filter(z => marks.isFavorite(z.key))
    },
    recent: {
        button: 'tab_recent', search: `${B}.search.recent`, column: `${B}.col.map_or_template`, count: `${B}.count.recent`,
        toolbar: ['refresh'], detail: ['edit', 'forget'],
        zones: (all, marks) => marks.recent.map(([key]) => all.find(z => z.key === key)).filter((z): z is IZoneSummary => !!z)
    }
};
