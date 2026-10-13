// Moves the quest layouts from the night-blue draft to the Illumina purple theme the owner chose
// (2026-10-13): purple frame (103), sunk light lists (102), light reading panel (103), raised
// cards (104), purple buttons (105, 106 tinted), dark text on the light panels. Idempotent.
import fs from 'node:fs';

const DIR = 'D:/Developpment/Habbo/vortex-rpg-client/packages/vortex-client/src/vortex-layouts/';
const NAMES = ['vortex_quest_xml', 'vortex_quest_tab_active_xml', 'vortex_quest_tab_daily_xml', 'vortex_quest_tab_done_xml', 'vortex_quest_row_xml', 'vortex_quest_daily_row_xml', 'vortex_quest_completed_row_xml',
    'vortex_quest_region_header_xml', 'vortex_quest_objective_row_xml', 'vortex_quest_reward_tile_xml', 'vortex_quest_detail_header_xml', 'vortex_quest_progress_xml', 'vortex_quest_reputation_row_xml', 'vortex_ui_menu_xml', 'vortex_ui_menu_row_xml'];
const DARK_TEXT = '0x1f2a33';

for(const name of NAMES)
{
    const file = DIR + name + '.xml';
    let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

    if(s.includes('style="103"') && name === 'vortex_quest_xml') continue;

    // frame and tabs
    s = s.replace(/(<frame [^>]*) style="300"/, '$1 style="103"');
    s = s.replace(/(<tab_context [^>]*) style="300"/g, '$1 style="3"');
    s = s.replace(/(<tab_button [^>]*) style="300"/g, '$1 style="3"');
    // panels: lists sunk, reading panels light, cards raised, strips raised, selection an amber-tinted card
    s = s.replace(/(<border [^>]*) style="30[01]"([^>]*name="(quest_list_panel|menu_frame)")/g, '$1 style="102"$2');
    s = s.replace(/(<border [^>]*) style="30[03]"([^>]*name="detail")/g, '$1 style="103"$2');
    s = s.replace(/(<border [^>]*) style="306"([^>]*name="selected")/g, '$1 style="104"$2 color="0xffd890"');
    s = s.replace(/(<border [^>]*) style="30[25]"/g, '$1 style="104"');
    s = s.replace(/(<border [^>]*) style="304"/g, '$1 style="104"');
    s = s.replace(/(<border [^>]*) style="30[013]"/g, '$1 style="102"');
    // buttons: Illumina's, sized like the thick ones (the skin's padding wants ~22 px more)
    s = s.replace(/<button_thick ([^>]*) style="300"([^>]*)width_min="(\d+)" width_max="(\d+)"\/>/g, '<button $1 style="105"$2width_min="$3" width_max="$4" height_min="28" height_max="28"/>');
    s = s.replace(/<button_thick ([^>]*) style="301" color="(0x[0-9a-f]+)"([^>]*)width_min="(\d+)" width_max="(\d+)"\/>/g, '<button $1 style="106" color="$2"$3width_min="$4" width_max="$5" height_min="28" height_max="28"/>');
    // text: the panels are light, so the dark draft's white and grey-blue go dark
    s = s.replace(/text_color" value="0xffffff"/g, `text_color" value="${DARK_TEXT}"`);
    s = s.replace(/text_color" value="0xe8e8e0"/g, `text_color" value="${DARK_TEXT}"`);
    s = s.replace(/text_color" value="0xa9b7c6"/g, 'text_color" value="0x666666"');
    s = s.replace(/text_color" value="0x8ee05a"/g, 'text_color" value="0x2b7000"');
    s = s.replace(/text_color" value="0xfac200"/g, 'text_color" value="0xb07a10"');
    // bars and separators back on a light ground
    s = s.replace(/name="bg" color="0x0b1526"/g, 'name="bg" color="0xd8d8d0"');
    s = s.replace(/stroke_color" value="0xff2b4a6f"/g, 'stroke_color" value="0xffa0a098"');
    s = s.replace(/color="0xff2b4a6f"/g, 'color="0xffd0d0c8"');
    // the icons of the section strips and the pin were white for the dark theme
    s = s.replace(/tags="%23icon" color="0x2a4458"/g, 'tags="%23icon" color="0x24607f"');
    s = s.replace(/(name="track_button"[^>]*>\n\s*<children>\n\s*<static_bitmap [^>]*) color="0xffffff"/g, '$1 color="0x24607f"');
    s = s.replace(/(name="region_count"[^>]*>\n\s*<variables>[\s\S]*?)text_color" value="0x[0-9a-f]+"/, '$1text_color" value="0x666666"');
    fs.writeFileSync(file, s);
}
console.log('quest layouts in the purple theme');
