// Second pass on the quest layouts: the sheets' two tones. Dark panels for the lists (301/302),
// a light reading panel on the right (303) with light strips (304) and cards (305) and dark text,
// the selected row as an amber-edged overlay (306). Idempotent.
import fs from 'node:fs';

const DIR = 'D:/Developpment/Habbo/vortex-rpg-client/packages/vortex-client/src/vortex-layouts/';
const DARK_TEXT = '0x1f2a33';
const rw = (name, fn) =>
{
    const file = DIR + name + '.xml';
    const s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const out = fn(s);
    if(out === null) { console.log('FAILED', name); process.exit(1); }
    fs.writeFileSync(file, out);
};
const must = (s, a) => (s.includes(a) ? s : null);
/** A light section strip with an icon and a dark bold caption. */
const strip = (y, caption, uri) => `            <border x="8" y="${y}" width="394" height="22" params="16" style="304">
              <children>
                <static_bitmap x="5" y="3" width="16" height="16" params="16" style="3" tags="%23icon" color="0x2a4458">
                  <variables>
                    <var key="asset_uri" value="${uri}" type="String"/>
                    <var key="stretched_x" value="false" type="Boolean"/>
                    <var key="stretched_y" value="false" type="Boolean"/>
                  </variables>
                </static_bitmap>
                <text x="26" y="3" width="300" height="16" params="16" style="3" caption="${caption}">
                  <variables>
                    <var key="text_style" value="u_bold" type="String"/>
                    <var key="font_size" value="11" type="uint"/>
                    <var key="text_color" value="${DARK_TEXT}" type="hex"/>
                    <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
                  </variables>
                </text>
              </children>
            </border>`;
const headerBlock = (caption) => new RegExp(`            <container x="8" y="(\\d+)" width="394" height="1" params="16" style="8" color="0xff2b4a6f" background="true"/>\\n            <text x="8" y="\\d+" width="200" height="16" params="16" style="3"( name="[a-z_]+")? caption="\\$\\{${caption.replace(/\./g, '\\.')}\\}">\\n(?:(?!</text>)[\\s\\S])*?</text>\\n`);

for(const tab of ['vortex_quest_tab_active_xml', 'vortex_quest_tab_daily_xml', 'vortex_quest_tab_done_xml'])
{
    rw(tab, s =>
    {
        s = s.replace(/(<border [^>]*) style="30[01]"([^>]*name="quest_list_panel")/, '$1 style="301"$2');
        if(s.includes('style="303"')) return s;
        s = s.replace(/(<border [^>]*) style="300"([^>]*name="detail")/, '$1 style="303"$2');
        s = s.replace(headerBlock('vortex.ui.objectives'), (m, y) => strip(Number(y), '${vortex.ui.objectives}', 'rpg/ui-icons/software_checkbox_empty_todo_icon') + '\n');
        s = s.replace(headerBlock('vortex.ui.objectives.count'), (m, y) => strip(Number(y), '${vortex.ui.objectives.count}', 'rpg/ui-icons/software_checkbox_empty_todo_icon').replace('<text x="26"', '<text name="objective_title" x="26"') + '\n');
        s = s.replace(headerBlock('vortex.ui.rewards'), (m, y) => strip(Number(y), '${vortex.ui.rewards}', 'rpg/ui-icons/boardgames_chip_token_coin_counter_icon') + '\n');
        s = s.replace(headerBlock('vortex.ui.rewards.obtained'), (m, y) => strip(Number(y), '${vortex.ui.rewards.obtained}', 'rpg/ui-icons/boardgames_chip_token_coin_counter_icon') + '\n');
        s = s.replace(headerBlock('vortex.ui.summary'), (m, y) => strip(Number(y), '${vortex.ui.summary}', 'rpg/ui-icons/software_text_document_credits_roll_attributions_icon') + '\n');
        // the progression block: a dark panel holding its header and the slot
        s = s.replace(/            <container x="8" y="340" width="394" height="1" params="16" style="8" color="0xff2b4a6f" background="true"\/>\n            <text x="8" y="346" width="200" height="16" params="16" style="3" caption="\$\{vortex.quest.progress\}">\n(?:(?!<\/text>)[\s\S])*?<\/text>\n            <container x="8" y="364" width="394" height="114" params="16" style="3" name="progress_slot">\n              <children\/>\n            <\/container>/, `            <border x="8" y="340" width="394" height="154" params="16" style="301">
              <children>
                <static_bitmap x="8" y="7" width="16" height="16" params="16" style="3" tags="%23icon" color="0xffffff">
                  <variables>
                    <var key="asset_uri" value="rpg/ui-icons/boardgames_card_star_icon" type="String"/>
                    <var key="stretched_x" value="false" type="Boolean"/>
                    <var key="stretched_y" value="false" type="Boolean"/>
                  </variables>
                </static_bitmap>
                <text x="30" y="7" width="300" height="16" params="16" style="3" caption="\${vortex.quest.progress}">
                  <variables>
                    <var key="text_style" value="u_bold" type="String"/>
                    <var key="font_size" value="11" type="uint"/>
                    <var key="text_color" value="0xffffff" type="hex"/>
                    <var key="mouse_wheel_enabled" value="false" type="Boolean"/>
                  </variables>
                </text>
                <container x="8" y="32" width="378" height="114" params="16" style="3" name="progress_slot">
                  <children/>
                </container>
              </children>
            </border>`);
        // the track button is the blue primary, the others keep their tints on the grey skin
        s = s.replace(/(<button_thick [^>]*) style="301" color="0x2a8fd6"( name="track_button")/, '$1 style="300"$2');
        // the done tab's banner and summary are light cards with their own text colours
        s = s.replace(/style="30[25]"( name="done_banner")/, 'style="305"$1');
        s = s.replace(/(<border x="8" y="334" width="394" height="82" params="16") style="300"/, '$1 style="305"');
        s = s.replace(/(name="summary_txt" caption="">\n\s*<variables>[\s\S]*?)text_color" value="0x[0-9a-f]+"/, `$1text_color" value="${DARK_TEXT}"`);
        return must(s, 'style="304"');
    });
}

rw('vortex_quest_row_xml', s =>
{
    if(s.includes('style="306"')) return s;
    s = s.replace(/        <!-- Selected quest, toggled by the view\. -->\n        <container visible="false"[\s\S]*?\n        <\/container>\n/, '');
    s = s.replace(/(<border x="0" y="0" width="272" height="44" params="17" style="302" name="quest_row" dynamic_style="lifted_hover">\n      <children>\n)/, `$1        <!-- Selected quest: the amber-edged blue card over the row, toggled by the view. -->
        <border visible="false" x="0" y="0" width="272" height="44" params="16" style="306" name="selected"/>
`);
    s = s.replace(/(<border x="4" y="4" width="36" height="36" params="16") style="30[01]"/, '$1 style="301"');
    s = s.replace(/(name="track_button"[^>]*>\n\s*<children>\n\s*<static_bitmap [^>]*) color="0xe04848"/, '$1 color="0xffffff"');
    return must(s, 'style="306"');
});
rw('vortex_quest_completed_row_xml', s =>
{
    if(s.includes('style="306"')) return s;
    s = s.replace(/        <!-- Selected quest, toggled by the view\. -->\n        <container visible="false"[\s\S]*?\n        <\/container>\n/, '');
    return must(s.replace(/(name="completed_row" dynamic_style="lifted_hover">\n      <children>\n)/, '$1        <border visible="false" x="0" y="0" width="272" height="38" params="16" style="306" name="selected"/>\n'), 'style="306"');
});
rw('vortex_quest_daily_row_xml', s =>
{
    if(s.includes('style="306"')) return s;
    s = s.replace(/        <!-- Selected quest, toggled by the view\. -->\n        <container visible="false"[\s\S]*?\n        <\/container>\n/, '');
    return must(s.replace(/(name="daily_row" dynamic_style="lifted_hover">\n      <children>\n)/, '$1        <border visible="false" x="0" y="0" width="272" height="56" params="16" style="306" name="selected"/>\n'), 'style="306"');
});
rw('vortex_quest_objective_row_xml', s =>
{
    if(s.includes('style="305"')) return s;
    s = s.replace('<container x="0" y="0" width="394" height="22" params="145" style="3" dynamic_style="lifted_hover" name="objective_row">', '<border x="0" y="0" width="394" height="22" params="17" style="305" dynamic_style="lifted_hover" name="objective_row">');
    s = s.replace(/<\/container>\n  <\/window>/, '</border>\n  </window>');
    s = s.replace(/style="30[02]"( name="state_box")/, 'style="302"$1');
    s = s.replace(/text_color" value="0xffffff"/g, `text_color" value="${DARK_TEXT}"`);
    s = s.replace(/(name="state_box"[^>]*>)/, '$1').replace('<border x="0" y="2"', '<border x="6" y="2"').replace('<text x="26"', '<text x="32"');
    return must(s, 'style="305"');
});
rw('vortex_quest_reward_tile_xml', s =>
{
    if(s.includes('style="305"')) return s;
    s = s.replace(/style="30[02]"( name="reward_tile")/, 'style="305"$1').replace(/(<border x="4" y="4" width="40" height="40" params="16") style="30[01]"/, '$1 style="302"');
    s = s.replace(/text_color" value="0xffffff"/g, `text_color" value="${DARK_TEXT}"`).replace(/text_color" value="0xa9b7c6"/g, 'text_color" value="0x4a5a6a"');
    return must(s, 'style="305"');
});
rw('vortex_quest_detail_header_xml', s => s.replace(/(name="quest_desc" caption="">\n\s*<variables>[\s\S]*?)text_color" value="0x[0-9a-f]+"/, `$1text_color" value="${DARK_TEXT}"`));
rw('vortex_quest_region_header_xml', s => s.replace(/style="30[02]"( name="collapse_button")/, 'style="302"$1').replace(/text_color" value="0xa9b7c6"/g, 'text_color" value="0xffffff"'));
console.log('two tones applied');
