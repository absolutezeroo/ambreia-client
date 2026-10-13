// Moves the quest window's layouts into the Ambreia dark theme (style 300, the navy windows of
// the 2026-10 mock-ups and AMBREIA_UI_UX_MASTER_BIBLE.md §2): skins, text colours, then the
// touches the quest sheets ask for (tab icons, amber quest titles, section strips). Idempotent.
import fs from 'node:fs';

const DIR = 'D:/Developpment/Habbo/vortex-rpg-client/packages/vortex-client/src/vortex-layouts/';
const NAMES = ['vortex_quest_xml', 'vortex_quest_tab_active_xml', 'vortex_quest_tab_daily_xml', 'vortex_quest_tab_done_xml', 'vortex_quest_row_xml', 'vortex_quest_daily_row_xml', 'vortex_quest_completed_row_xml',
    'vortex_quest_region_header_xml', 'vortex_quest_objective_row_xml', 'vortex_quest_reward_tile_xml', 'vortex_quest_detail_header_xml', 'vortex_quest_progress_xml'];

const icon = (x, y, uri, tint, extra = '') => `        <static_bitmap x="${x}" y="${y}" width="16" height="16" params="16" style="3" tags="%23icon" color="${tint}"${extra}>
          <variables>
            <var key="asset_uri" value="${uri}" type="String"/>
            <var key="stretched_x" value="false" type="Boolean"/>
            <var key="stretched_y" value="false" type="Boolean"/>
          </variables>
        </static_bitmap>
`;

const retheme = (s) =>
{
    s = s.replace(/(<frame [^>]*) style="3"([^>]*) color="0x418db0"/, '$1 style="300"$2');
    s = s.replace(/(<tab_context [^>]*) style="3"/g, '$1 style="300"');
    s = s.replace(/(<tab_button [^>]*) style="3"/g, '$1 style="300"');
    s = s.replace(/(<border [^>]*name="quest_list_panel"[^>]*) style="2"/g, '$1 style="301"');
    s = s.replace(/(<border [^>]*) style="2"([^>]*name="(quest_row|completed_row|daily_row|reward_tile|title_reward_row|level_box)")/g, '$1 style="302"$2');
    // the icon tiles inside rows are wells; the giver's frame and the banner keep their parchment
    s = s.replace(/(<border x="4" y="4" width="36" height="36" params="16") style="2" color="0xe4e4dc"/g, '$1 style="301"');
    s = s.replace(/(<border x="4" y="8" width="40" height="40" params="16") style="2" color="0xe4e4dc"/g, '$1 style="301"');
    s = s.replace(/(<border x="4" y="4" width="40" height="40" params="16") style="2" color="0xe4e4dc"/g, '$1 style="301"');
    s = s.replace(/(<border [^>]*name="(track_button|collapse_button|state_box)"[^>]*) style="2"([^>]*) color="0xe4e4dc"/g, '$1 style="302"$3');
    s = s.replace(/(<border [^>]*) style="2"([^>]*name="(banner|giver)")/g, '$1 style="2"$2');
    s = s.replace(/(<border [^>]*) style="2"((?:(?!name="(banner|giver)")[^>])*)>/g, (m, a, b) => (/color="0x(f2dfae|e6cf98)"/.test(m) ? m : `${a} style="300"${b}>`));
    s = s.replace(/(<border [^>]*) color="0x(f2f2ec|e4e4dc|f3e8cf|dde8f1|f5ebc4|b8e090)"/g, '$1');
    s = s.replace(/(<button_thick [^>]*) style="6"/g, '$1 style="301"');
    s = s.replace(/(<button_thick [^>]*) style="3"/g, '$1 style="300"');
    s = s.replace(/text_color" value="0x(24607f|7a4a10)"/g, 'text_color" value="0xffffff"');
    s = s.replace(/text_color" value="0x(666666|999999)"/g, 'text_color" value="0xa9b7c6"');
    s = s.replace(/text_color" value="0x(222222|444444)"/g, 'text_color" value="0xffffff"');
    s = s.replace(/text_color" value="0x2b7000"/g, 'text_color" value="0x8ee05a"');
    s = s.replace(/(<(text|link) [^>]*>\n\s*<variables>\n)((?:(?!<\/variables>)[\s\S])*?)(\s*<\/variables>)/g, (m, open, _tag, vars, close) => vars.includes('text_color') ? m : `${open}${vars}            <var key="text_color" value="0xffffff" type="hex"/>\n${close}`);
    s = s.replace(/color="0xffd0d0c8"/g, 'color="0xff2b4a6f"');
    s = s.replace(/name="bg" color="0xd8d8d0"/g, 'name="bg" color="0x0b1526"');
    s = s.replace(/stroke_color" value="0xffa0a098"/g, 'stroke_color" value="0xff2b4a6f"');
    // the done banner stays a green highlight
    s = s.replace(/(name="done_banner") style="300"/, '$1 style="302"');

    return s;
};

for(const name of NAMES)
{
    const file = DIR + name + '.xml';
    let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

    if(s.includes('style="300"')) continue; // already themed
    s = retheme(s);

    if(name === 'vortex_quest_row_xml' || name === 'vortex_quest_daily_row_xml')
    {
        // a quest's title is amber (the sheets): it is the primary line
        s = s.replace(/(name="quest_title" caption="">\n\s*<variables>\n\s*<var key="text_style" value="u_bold" type="String"\/>\n\s*<var key="font_size" value="11" type="uint"\/>\n)\s*<var key="text_color" value="0xffffff" type="hex"\/>/, '$1            <var key="text_color" value="0xfac200" type="hex"/>');
    }

    if(name === 'vortex_quest_xml')
    {
        // the sheets' tab icons, drawn over the tab buttons (the buttons take the caption only)
        s = s.replace('        <container x="0" y="40" width="734" height="500" params="16" style="3" name="tab_content">', icon(22, 10, 'rpg/ui-icons/software_warning_sign_circle_exclaimation_mark_error_icon', '0xf8c820') + icon(182, 10, 'rpg/ui-icons/software_warning_sign_circle_exclaimation_mark_error_icon', '0x5fb0ff') + icon(342, 10, 'rpg/ui-icons/software_calendar_dates_organizer_month_1_icon', '0xe8e8e0') + icon(502, 10, 'rpg/ui-icons/software_signs_checkmark_checkbox_ticked_todo_icon', '0x8ee05a') + '        <container x="0" y="40" width="734" height="500" params="16" style="3" name="tab_content">');
    }

    fs.writeFileSync(file, s);
}

// The reputation row of the progress panel, a dark twin of the character's compact row.
const rep = fs.readFileSync(DIR + 'vortex_character_faction_compact_row_xml.xml', 'utf8').replace(/\r\n/g, '\n');
let dark = retheme(rep).replace('name="vortex_character_faction_compact_row_xml"', 'name="vortex_quest_reputation_row_xml"').replace('name="faction_compact_row"', 'name="reputation_row"');
dark = dark.replace(/(<border x="0" y="1" width="32" height="32" params="16") style="300"/, '$1 style="301"').replace(/(name="standing") style="300"/, '$1 style="302"').replace(/(name="help_button") style="300"/, '$1 style="302"');
fs.writeFileSync(DIR + 'vortex_quest_reputation_row_xml.xml', dark);

// The kit's dark menu (a filter, a sort, a context menu): the character menu in style 300 / 302.
const menu = fs.readFileSync(DIR + 'vortex_character_menu_xml.xml', 'utf8').replace(/\r\n/g, '\n').replace('name="vortex_character_menu_xml"', 'name="vortex_ui_menu_xml"').replace('name="character_menu"', 'name="ui_menu"').replace('style="2" name="menu_frame" color="0xffffff"', 'style="300" name="menu_frame"');
fs.writeFileSync(DIR + 'vortex_ui_menu_xml.xml', menu);
const row = fs.readFileSync(DIR + 'vortex_character_menu_row_xml.xml', 'utf8').replace(/\r\n/g, '\n').replace('name="vortex_character_menu_row_xml"', 'name="vortex_ui_menu_row_xml"').replace('style="2" name="menu_row" dynamic_style="lifted_hover" color="0xf2f2ec"', 'style="302" name="menu_row" dynamic_style="lifted_hover"');
fs.writeFileSync(DIR + 'vortex_ui_menu_row_xml.xml', retheme(row));
console.log('quest layouts in the dark theme');
