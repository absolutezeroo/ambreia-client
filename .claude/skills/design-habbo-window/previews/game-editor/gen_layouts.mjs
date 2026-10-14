// Writes the content-editing layouts of the map editor (mockup/map-editor: ressources, VFX, objets, SFX,
// quêtes, interactions), fitted into the editor's own template (vortex_map_editor_xml): the sheets are
// AI renders whose chrome (tabs, footers) is not the editor's, so only their content is taken.
//   rail       four rows after « Paramètres » under a « Contenu » separator (Objets, VFX, SFX, Quêtes)
//   left_slot  left_library: search, category grid, library list, the three buttons of left_npcs
//   inspector  the editor's inspect_form filled from IFieldSpec, plus new field templates of the
//              owner's shape (316 wide, label 112, field at 118): range, slider, colour, pick, tags,
//              info, vec3, gradient, preview, add, loot row, choice row, node header
//   viewport   the iso view (resources, VFX, SFX), item_sheet (items), graph (quests, interactions)
//   bottom     one panel per content kind (resource loot + distribution, VFX timeline, SFX tracks,
//              item sources, quest console + rewards + flow map, interaction test + log + dialogue)
// Style is the editor's: light panels (border style 2) under a blue band, Habbo buttons style 6.
import fs from 'node:fs';
import {V, bmp, txt, cont, list, shape, box, input, layout, write, locales, DIR, I} from '../../tools/ui_helpers.mjs';

const P = 'vortex_map_editor_';
const K = (k) => `\${vortex.mapeditor.content.${k}}`;
const U = 'rpg/ui-icons/';
const E = {ink: '0x1f2a33', sub: '0x6b7682', head: '0x1f5f9a', band: '0xff3d7aa8', panel: '0xe8eef4', white: '0xffffff', well: '0xe4e4dc', row: '0xf2f2ec', sel: '0x9cc9f5', grey: '0x8c8c86', green: '0x0aa00', red: '0xd23a2a', blue: '0x2a8fd6', dark: '0x1e2228'};
const FW = 316; // a form row of the owner's (field_text…): label 112, field from 118

// ---------- editor-idiom pieces
const band = (w) => `<container x="1" y="1" width="${w - 2}" height="22" params="16" style="8" color="${E.band}" background="true"/>`;
const panel = (x, y, w, h, name, title, children, {extra = []} = {}) =>
    box(x, y, w, h, [band(w), txt(8, 4, w - 64, 16, {name: `${name}_title`, caption: title, bold: true, color: E.white}), ...extra, ...children], {name, style: 2, color: E.panel});
const lbl = (x, y, w, caption, {name = '', size = 10, color = E.ink, bold = false, align = '', hidden = false} = {}) => txt(x, y, w, 16, {name, caption, size, color, bold, align, hidden});
const field = (x, y, w, name, caption = '', {h = 24} = {}) => box(x, y, w, h, [input(6, Math.round((h - 16) / 2), w - 12, name, caption)], {style: 2, color: E.white, name: `${name}_box`});
const ebtn = (x, y, w, name, caption, color = E.grey, {h = 24, hidden = false} = {}) => `<button${hidden ? ' visible="false"' : ''} x="${x}" y="${y}" width="${w}" height="${h}" params="131089" style="6" color="${color}" name="${name}" caption="${caption}" width_min="${w}" width_max="${w}"/>`;
const ibtn = (x, y, name, uri, {w = 22, h = 22, color = '0x4a5a6a', tint = E.white, hidden = false} = {}) =>
    box(x, y, w, h, [bmp(Math.round((w - 16) / 2), Math.round((h - 16) / 2), 16, 16, uri, {name: `${name}_icon`, color})], {name, params: 17, dyn: 'button', style: 2, color: tint, hidden});
const spin = (x, y, name) => [ibtn(x, y, `${name}_up`, I.up, {w: 12, h: 12, tint: E.well}), ibtn(x, y + 12, `${name}_down`, I.down, {w: 12, h: 12, tint: E.well})];
const drop = (x, y, w, name, caption = '', {h = 24} = {}) => `<dropmenu x="${x}" y="${y}" width="${w}" height="${h}" params="17" style="3" name="${name}" caption="${caption}"/>`;
const chk = (x, y, name) => `<checkbox x="${x}" y="${y}" width="18" height="18" params="17" style="3" name="${name}"/>`;
const dot = (x, y, name, color = '0x4cc040', {size = 10, hidden = false} = {}) => shape(x, y, size, size, color, {name, radius: size / 2, hidden});
const slide = (x, y, w, name, fillW) => cont(x, y, w, 16, [
    shape(0, 5, w, 6, '0xd0d8e0', {name: 'track', radius: 3, stroke: '0xffa0a8b0', params: 144}),
    shape(0, 5, fillW, 6, E.blue, {name: 'fill', radius: 3}),
    box(Math.max(0, fillW - 6), 0, 12, 16, [], {name: 'knob', params: 17, dyn: 'button', style: 2, color: E.white}),
], {name});
const selected = (w, h) => box(0, 0, w, h, [], {name: 'selected', style: 2, color: E.sel, hidden: true});
const hlist = (x, y, w, h, name, spacing) => list(x, y, w, h, name, spacing, {horizontal: true});
// full-colour 32 px art (rpg/weapons, materials…), scaled to its box
const art = (x, y, s, name, uri = I.sword, {hidden = false} = {}) => bmp(x, y, s, s, uri, {name, stretch: true, hidden});
// a row template: a plain container, or (box) a raised row with hover
const row = (name, w, h, children, {root = 'cont', dyn = 'lifted_hover', color = E.row} = {}) => write(P + name + '_xml', layout(P + name + '_xml', w, h,
    root === 'cont' ? cont(0, 0, w, h, children, {name}) : box(0, 0, w, h, children, {name, params: 17, dyn, style: 2, color})));
const L = () => lbl(0, 4, 112, '', {name: 'field_label'});

// ---------- rail: the content group after the zone layers (rows 40 → 36 px so twenty fit)
{
    const file = DIR + 'vortex_map_editor_xml.xml';
    let s = fs.readFileSync(file, 'utf8');
    if(!s.includes('name="rail_separator"'))
    {
        const i = s.indexOf('name="rail_list"'), j = s.indexOf('</itemlist_vertical>', i);
        let blk = s.slice(i, j);
        blk = blk.replaceAll('width="108" height="40" params="17" style="2" name="rail_row"', 'width="108" height="36" params="17" style="2" name="rail_row"')
            .replaceAll('<static_bitmap x="6" y="4" width="32" height="32"', '<static_bitmap x="6" y="2" width="32" height="32"')
            .replaceAll('<text x="44" y="12" width="62" height="16" params="16" style="3" name="rail_label"', '<text x="44" y="10" width="62" height="16" params="16" style="3" name="rail_label"')
            .replace('<var key="spacing" value="3" type="int"/>', '<var key="spacing" value="2" type="int"/>');
        const ind = (t, n) => t.split('\n').map((l) => ' '.repeat(n) + l).join('\n');
        const railRow = (uri, color, caption) => box(0, 0, 108, 36, [
            `<static_bitmap x="6" y="2" width="32" height="32" params="16" style="3" tags="%23icon" color="${color}">\n  <variables>\n    ${V('asset_uri', uri)}\n    ${V('stretched_x', 'false', 'Boolean')}\n    ${V('stretched_y', 'false', 'Boolean')}\n    ${V('zoom_x', '2', 'Number')}\n    ${V('zoom_y', '2', 'Number')}\n  </variables>\n</static_bitmap>`,
            `<text x="44" y="10" width="62" height="16" params="16" style="3" name="rail_label" caption="${caption}">\n  <variables>\n    ${V('text_style', 'u_regular')}\n    ${V('font_size', '11', 'uint')}\n    ${V('mouse_wheel_enabled', 'false', 'Boolean')}\n  </variables>\n</text>`,
        ], {name: 'rail_row', params: 17, dyn: 'lifted_hover', style: 2, color: '0xf2f2ec'});
        const extra = [
            cont(0, 0, 108, 18, [shape(0, 13, 108, 1, '0xffa8b8c8', {radius: 0}), lbl(2, -1, 104, K('rail.group'), {name: 'rail_separator_txt', size: 9, bold: true, color: E.head})], {name: 'rail_separator'}),
            railRow(U + 'rpg_item_weapon_sword_attack_melee_slashing_damage_icon', '0x8a94a0', K('rail.items')),
            railRow(U + 'rpg_magic_sparkles_enchantment_icon', '0xb060e0', K('rail.vfx')),
            railRow(U + 'media_audio_sound_volume_3_icon', '0x2a8fd6', K('rail.sfx')),
            railRow(U + 'software_speech_bubble_exclaimation_mark_quest_new_icon', '0xe0a020', K('rail.quests')),
        ].map((x) => ind(x, 22)).join('\n');
        const close = blk.lastIndexOf('</children>');
        blk = blk.slice(0, close).trimEnd() + '\n' + extra + '\n                  ' + blk.slice(close);
        s = s.slice(0, i) + blk + s.slice(j);
        fs.writeFileSync(file, s);
    }
    // Twenty rows pass the rail's height on a window under 900 px: the list scrolls.
    if(!s.includes('<scrollable_itemlist_vertical x="6" y="6" width="108" height="797" params="2064" style="3" name="rail_list">'))
    {
        const i = s.indexOf('name="rail_list"'), a = s.lastIndexOf('<itemlist_vertical', i), j = s.indexOf('</itemlist_vertical>', i);
        s = s.slice(0, a) + '<scrollable_itemlist_vertical' + s.slice(a + '<itemlist_vertical'.length, j) + '</scrollable_itemlist_vertical>' + s.slice(j + '</itemlist_vertical>'.length);
        fs.writeFileSync(file, s);
    }
}

// ---------- left slot: the content library
write(P + 'left_library_xml', layout(P + 'left_library_xml', 300, 584, panel(0, 0, 300, 584, 'library', '', [
    cont(0, 24, 300, 560, [
        box(8, 8, 284, 24, [bmp(4, 4, 16, 16, I.search, {color: '0x888880'}), input(24, 4, 254, 'search_input', K('search'))], {style: 2, color: E.well, name: 'search_box'}),
        list(8, 38, 284, 118, 'category_list', 4, {grid: true}),
        box(8, 162, 284, 352, [list(6, 6, 272, 340, 'library_list', 3, {scroll: true})], {style: 2, name: 'library_box'}),
        ebtn(8, 522, 90, 'list_button_0', K('add'), E.green), ebtn(104, 522, 90, 'list_button_1', K('duplicate')), ebtn(200, 522, 90, 'list_button_2', K('delete'), E.red),
    ], {name: 'library_body'}),
])));
row('category_tile', 132, 26, [selected(132, 26), bmp(5, 5, 16, 16, I.star, {name: 'category_icon'}), lbl(26, 4, 104, '', {name: 'category_txt'})], {root: 'box'});
row('library_row', 258, 44, [
    selected(258, 44), box(4, 4, 36, 36, [art(2, 2, 32, 'item_icon')], {style: 2, color: E.well, name: 'icon_box'}),
    lbl(48, 5, 136, '', {name: 'item_title', bold: true, size: 11}), lbl(48, 23, 136, '', {name: 'item_sub', size: 9, color: E.sub}),
    lbl(176, 14, 52, '', {name: 'item_meta', align: 'right'}), dot(236, 17, 'status_dot'),
], {root: 'box'});

// ---------- inspector: field templates of the owner's shape, for buildField's new kinds
row('field_range', FW, 26, [L(), field(118, 0, 60, 'field_min'), ...spin(178, 0, 'field_min'), lbl(192, 4, 40, '', {name: 'field_sep', align: 'center', color: E.sub}), field(236, 0, 64, 'field_max'), ...spin(300, 0, 'field_max')]);
row('field_slider', FW, 26, [bmp(0, 5, 16, 16, I.star, {name: 'field_icon', hidden: true}), L(), slide(118, 5, 140, 'field', 98), box(264, 0, 52, 24, [lbl(0, 4, 48, '', {name: 'field_value', align: 'right'})], {style: 2, color: E.white, name: 'value_box'})]);
row('field_color', FW, 26, [L(), box(118, 0, 30, 24, [shape(3, 3, 24, 18, '0xffd24a', {name: 'field_swatch', radius: 2})], {style: 2, color: E.white}), field(152, 0, 136, 'field'), ibtn(292, 1, 'field_button', I.more)]);
row('field_pick', FW, 26, [L(), field(118, 0, 170, 'field'), ibtn(292, 1, 'field_button', I.more)]);
row('field_tags', FW, 26, [L(), hlist(118, 2, 170, 20, 'tag_list', 4), ibtn(292, 1, 'field_button', I.plus)]);
row('tag_chip', 50, 20, [box(0, 0, 50, 20, [lbl(0, 1, 50, '', {name: 'tag_txt', size: 9, align: 'center', color: E.head})], {style: 2, color: '0xb8d4f4', name: 'chip_box'})]);
row('field_info', FW, 20, [lbl(0, 2, 112, '', {name: 'field_label', color: E.sub}), dot(118, 5, 'field_dot', '0x4cc040', {hidden: true}), lbl(118, 2, 198, '', {name: 'field_value', bold: true})]);
row('field_vec3', FW, 26, [L(), field(118, 0, 62, 'field_x'), field(186, 0, 62, 'field_y'), field(254, 0, 62, 'field_z')]);
row('field_gradient', FW, 28, [box(0, 0, 286, 28, Array.from({length: 8}, (_, i) => shape(3 + i * 35, 3, 35, 22, '0xffd24a', {name: `seg_${i}`, radius: 0})), {style: 2, color: E.white, name: 'gradient_box'}), ibtn(292, 3, 'field_button', I.more)]);
row('field_preview', FW, 68, [L(), box(236, 0, 80, 68, [art(0, 0, 80, 'preview_image')], {style: 2, color: E.dark, name: 'preview_box'})]);
row('field_add', FW, 24, [box(0, 2, 20, 20, [bmp(2, 2, 16, 16, I.plus, {color: '0xffffff'})], {style: 2, color: '0x2f9e2f', params: 17, dyn: 'button', name: 'add_button'}), lbl(26, 4, 290, '', {name: 'field_label', color: E.head})]);
row('field_choice', FW, 26, [box(0, 2, 22, 22, [lbl(0, 3, 22, '', {name: 'choice_index', bold: true, color: E.white, align: 'center'})], {style: 2, color: '0x2a6ad0', name: 'index_box'}), field(28, 0, 260, 'field'), ibtn(292, 1, 'remove_button', I.x, {color: E.red})]);
row('field_loot', FW, 34, [
    box(0, 2, 30, 30, [art(-1, -1, 32, 'loot_icon')], {style: 2, color: E.well, name: 'icon_box'}),
    lbl(36, 9, 122, '', {name: 'loot_name'}),
    box(160, 5, 46, 24, [lbl(0, 4, 46, '', {name: 'loot_pct', align: 'center'})], {style: 2, color: E.white}),
    box(210, 5, 50, 24, [lbl(0, 4, 50, '', {name: 'loot_qty', align: 'center'})], {style: 2, color: E.white}),
    ...spin(264, 5, 'loot_order'), ibtn(284, 6, 'remove_button', I.x, {color: E.red}),
]);
row('field_node', FW, 56, [box(0, 0, FW, 56, [
    box(6, 6, 44, 44, [art(6, 6, 32, 'node_icon')], {style: 2, color: E.white, name: 'node_icon_box'}),
    lbl(58, 6, 250, '', {name: 'node_title', bold: true, size: 12}), txt(58, 24, 250, 30, {name: 'node_desc', size: 9, color: E.sub, multi: true}),
], {style: 2, color: '0xfff1c8', name: 'node_box'})]);

// ---------- viewport: an item's sheet (items have no map: the view shows the object itself)
const EQUIP = [['head', 82, 4], ['amulet', 132, 20], ['cape', 32, 20], ['weapon', 4, 66], ['shield', 160, 66], ['ring1', 4, 108], ['ring2', 160, 108], ['chest', 32, 150], ['feet', 82, 158], ['gloves', 132, 150]];
const slotBox = (x, y, s, name) => box(x, y, s, s, [art(2, 2, s - 4, `${name}_icon`, I.sword, {hidden: true})], {name, params: 17, dyn: 'button', style: 2, color: '0x3a4a60'});
const table = (x, y, w, h, name, title, addCaption, cols) => panel(x, y, w, h, name, title, [
    shape(8, 28, w - 16, 18, '0xd6e2ee', {radius: 0}),
    ...cols.map(([c, cx, cw]) => lbl(8 + cx, 29, cw, c, {size: 9, bold: true, align: cx < 8 ? '' : 'center', color: E.head})),
    list(8, 48, w - 16, h - 54, `${name}_list`, 0, {scroll: true}),
], {extra: [box(w - 138, 2, 132, 20, [bmp(4, 2, 16, 16, I.plus, {color: '0x2f9e2f'}), lbl(22, 1, 108, addCaption, {size: 9})], {style: 2, color: E.white, params: 17, dyn: 'button', name: `${name}_add`})]});
write(P + 'item_sheet_xml', layout(P + 'item_sheet_xml', 632, 582, box(0, 0, 632, 582, [
    box(8, 8, 200, 220, [dot(8, 8, 'art_rarity', '0x4cc040'), art(36, 18, 128, 'item_art'), hlist(10, 170, 180, 40, 'variant_list', 4)], {style: 2, color: '0x1c3048', name: 'art_box'}),
    box(216, 8, 200, 220, [
        txt(8, 6, 186, 22, {name: 'item_name', size: 15, bold: true}),
        box(8, 32, 96, 20, [lbl(0, 1, 96, '', {name: 'rarity_txt', bold: true, color: E.white, align: 'center'})], {style: 2, color: '0x40a040', name: 'rarity_badge'}),
        lbl(110, 34, 84, '', {name: 'level_txt', bold: true}),
        box(8, 60, 184, 152, [txt(6, 4, 172, 144, {name: 'item_desc', size: 10, color: '0x3a4650', multi: true})], {style: 2, color: E.white, name: 'desc_box'}),
    ], {style: 2, color: E.panel, name: 'identity_box'}),
    panel(424, 8, 200, 220, 'equip', K('item.equip'), [box(4, 24, 192, 192, [
        `<widget x="56" y="22" width="80" height="150" params="16" style="3" name="avatar_image">\n  <variables>\n    ${V('widget_type', 'avatar_image')}\n  </variables>\n</widget>`,
        ...EQUIP.map(([k, x, y]) => slotBox(x, y, 30, `slot_${k}`)),
    ], {style: 2, color: '0x22344a', name: 'equip_body'})]),
    panel(8, 236, 300, 228, 'stats', K('item.stats'), [list(8, 28, 284, 194, 'stat_list', 0)]),
    panel(316, 236, 308, 92, 'affixes', K('item.affixes'), [list(8, 28, 292, 42, 'affix_list', 2), box(8, 70, 18, 18, [bmp(1, 1, 16, 16, I.plus, {color: '0xffffff'})], {style: 2, color: '0x2f9e2f', params: 17, dyn: 'button', name: 'affix_add'}), lbl(32, 71, 200, K('item.affix_add'), {color: E.head})]),
    panel(316, 334, 308, 60, 'sockets', K('item.sockets'), [hlist(8, 26, 160, 30, 'socket_list', 6), ebtn(146, 30, 154, 'socket_unlock', K('item.socket_unlock'))]),
    panel(316, 400, 308, 64, 'set_bonus', K('item.set'), [lbl(0, 26, 308, K('item.set_none'), {size: 9, color: E.sub, align: 'center'}), box(8, 42, 18, 18, [bmp(1, 1, 16, 16, I.plus, {color: '0xffffff'})], {style: 2, color: '0x2f9e2f', params: 17, dyn: 'button', name: 'set_add'}), lbl(32, 43, 200, K('item.set_link'), {color: E.head})]),
    panel(8, 472, 200, 102, 'icons', K('item.icons'), [hlist(8, 28, 136, 40, 'icon_list', 4), ebtn(8, 72, 90, 'icons_import', K('item.import')), lbl(104, 76, 90, '32 × 32 px', {size: 9, color: E.sub})]),
    panel(216, 472, 200, 102, 'variants', K('item.variants'), [hlist(8, 32, 184, 32, 'look_list', 4)]),
    panel(424, 472, 200, 102, 'borders', K('item.borders'), [hlist(6, 28, 190, 70, 'border_list', 2)]),
], {name: 'item_sheet', style: 2, color: '0xd6dee8'})));
row('icon_slot', 40, 40, [selected(40, 40), art(4, 4, 32, 'slot_icon')], {root: 'box', dyn: 'button', color: '0x2a3a50'});
row('icon_slot_small', 32, 32, [art(2, 2, 28, 'slot_icon')], {root: 'box', dyn: 'button', color: '0x2a3a50'});
row('rarity_slot', 36, 68, [box(0, 0, 36, 36, [box(3, 3, 30, 30, [art(-1, -1, 32, 'slot_icon')], {style: 2, color: '0x2a3a50'})], {style: 2, color: '0x9a9a9a', name: 'slot_box'}), txt(-4, 36, 44, 30, {name: 'slot_txt', size: 8, align: 'center', multi: true})]);
row('stat_row', 284, 18, [bmp(2, 1, 16, 16, I.sword, {name: 'stat_icon'}), lbl(24, 1, 150, '', {name: 'stat_label'}), lbl(176, 1, 108, '', {name: 'stat_value', bold: true})]);
row('affix_row', 292, 20, [lbl(6, 2, 40, '', {name: 'affix_value', bold: true}), lbl(50, 2, 140, '', {name: 'affix_name'}), box(196, 1, 64, 18, [lbl(0, 0, 64, '', {name: 'affix_kind', size: 9, align: 'center', color: E.head})], {style: 2, color: '0xdce8f6', name: 'kind_box'}), ibtn(268, 0, 'remove_button', I.x, {w: 20, h: 20, color: E.red})], {root: 'box', dyn: '', color: E.white});
row('socket', 30, 30, [shape(0, 0, 30, 30, '0xffc8ccd2', {name: 'socket_shape', radius: 15, stroke: '0xff6a7280'}), art(3, 3, 24, 'socket_gem', U + 'rpg_gem_jewelcrafting_diamond_points_currency_icon', {hidden: true})]);
for(const [name, cols] of [['drop_row', [['source', 0, 150], ['type', 150, 80], ['rate', 230, 60], ['min', 290, 60], ['max', 350, 50]]], ['recipe_row', [['recipe', 0, 210], ['job', 210, 110], ['req', 320, 80]]]])
    row(name, 452, 20, [shape(0, 19, 452, 1, '0xffd6dce4', {radius: 0}), ...cols.map(([c, x, w]) => lbl(x + 4, 2, w, '', {name: `col_${c}`, size: 9, align: x === 0 ? '' : 'center'})), ibtn(406, 1, 'edit_button', I.pencil, {w: 18, h: 18}), ibtn(428, 1, 'remove_button', I.x, {w: 18, h: 18, color: E.red})]);

// ---------- viewport: a node graph (quests, interactions); links are orthogonal segments
write(P + 'graph_xml', layout(P + 'graph_xml', 632, 582, box(0, 0, 632, 582, [
    cont(0, 0, 632, 582, [], {name: 'link_layer'}),
    cont(0, 0, 632, 582, [], {name: 'node_layer'}),
    drop(512, 10, 112, 'zoom_menu', K('graph.zoom')),
], {name: 'graph', style: 2, color: '0xc4ced8'})));
row('graph_node', 170, 92, [
    box(0, 0, 170, 92, [shape(1, 1, 168, 26, '0xff8ac080', {name: 'node_band', radius: 2}), bmp(4, 3, 22, 22, I.star, {name: 'node_icon', stretch: true}), lbl(30, 5, 136, '', {name: 'node_title', bold: true, size: 11}),
        lbl(8, 30, 156, '', {name: 'node_id', bold: true, size: 9}), txt(8, 46, 156, 42, {name: 'node_txt', size: 9, color: '0x3a4650', multi: true}),
        list(6, 62, 158, 24, 'choice_list', 2, {hidden: true})], {style: 2, color: '0xf4fbf2', name: 'node_body'}),
    dot(-5, 40, 'port_in', '0x4a90e0', {size: 10, hidden: true}), dot(165, 40, 'port_yes', '0x4cc040', {size: 10}), dot(165, 66, 'port_no', '0xe03030', {size: 10, hidden: true}),
]);
row('graph_choice_row', 158, 18, [box(0, 0, 158, 18, [box(2, 2, 14, 14, [lbl(0, -1, 14, '', {name: 'choice_index', size: 9, bold: true, color: E.white, align: 'center'})], {style: 2, color: '0x2a6ad0', name: 'index_box'}), lbl(20, 1, 136, '', {name: 'choice_txt', size: 9})], {style: 2, color: '0xe8f4e4', name: 'choice_box'})]);
row('graph_link', 2, 2, [shape(0, 0, 2, 2, '0xff2a9a50', {name: 'link_shape', radius: 0})]);
row('graph_arrow', 16, 16, [bmp(0, 0, 16, 16, I.right, {name: 'arrow_icon', color: '0x2a9a50'})]);
row('graph_link_label', 36, 16, [box(0, 0, 36, 16, [lbl(0, -1, 36, '', {name: 'label_txt', size: 9, bold: true, align: 'center', color: E.white})], {style: 2, color: '0x2a9a50', name: 'label_box'})]);
// the node palette over the graph (interactions): kinds on the left, templates of the kind on the right
write(P + 'graph_palette_xml', layout(P + 'graph_palette_xml', 330, 250, panel(0, 0, 330, 250, 'palette', K('graph.add_node'), [
    box(8, 28, 314, 22, [bmp(3, 3, 16, 16, I.search, {color: '0x888880'}), input(22, 3, 286, 'palette_search', K('graph.search_node'))], {style: 2, color: E.well}),
    list(8, 56, 112, 188, 'kind_list', 1, {scroll: true}),
    list(126, 56, 196, 188, 'template_list', 3, {scroll: true}),
])));
row('graph_kind_row', 100, 20, [selected(100, 20), bmp(3, 2, 16, 16, I.star, {name: 'kind_icon'}), lbl(24, 2, 76, '', {name: 'kind_txt', size: 9})], {root: 'box', color: E.white});
row('graph_template_row', 182, 36, [art(4, 2, 32, 'template_icon'), lbl(42, 2, 138, '', {name: 'template_title', bold: true, size: 9}), lbl(42, 18, 138, '', {name: 'template_sub', size: 8, color: E.sub})], {root: 'box', color: E.white});

// ---------- bottom slot (942 × 217), one per content kind
const T0 = 210; // VFX lane origin in a track row; 388 px per second
write(P + 'bottom_resource_xml', layout(P + 'bottom_resource_xml', 942, 217, cont(0, 0, 942, 217, [
    panel(0, 0, 560, 217, 'loot_detail', K('res.loot_detail'), [
        box(8, 28, 326, 183, [
            box(4, 4, 28, 28, [art(-2, -2, 32, 'entry_icon')], {style: 2, color: E.well}), lbl(38, 10, 240, '', {name: 'entry_name', bold: true, size: 11}), ibtn(298, 6, 'entry_delete', I.trash, {color: '0xffffff', tint: E.red}),
            list(4, 38, FW, 140, 'entry_fields', 2),
        ], {style: 2, color: E.white, name: 'entry_card'}),
        list(340, 28, 212, 183, 'slot_list', 3),
    ]),
    panel(566, 0, 376, 217, 'distribution', K('res.distribution'), [
        box(8, 28, 250, 132, [bmp(0, 0, 250, 132, 'rpg/map_editor_backdrop', {name: 'heat_image', tags: false, stretch: true}), cont(0, 0, 250, 132, [], {name: 'heat_layer'})], {style: 2, color: E.dark, name: 'heat_box'}),
        drop(100, 32, 154, 'heat_menu', K('res.heat_respawn'), {h: 22}),
        ibtn(266, 28, 'zoom_in', I.plus), ibtn(266, 54, 'zoom_out', I.minus),
        lbl(266, 86, 104, K('res.respawn_area'), {size: 9, bold: true}),
        box(266, 106, 12, 12, [], {style: 2, color: '0xf0c030'}), lbl(282, 104, 90, K('res.area_gather'), {size: 9}),
        box(266, 124, 12, 12, [], {style: 2, color: '0x40c040'}), lbl(282, 122, 90, K('res.area_respawn'), {size: 9}),
        lbl(8, 164, 40, K('res.low'), {size: 9}),
        cont(42, 167, 210, 10, Array.from({length: 7}, (_, i) => shape(i * 30, 0, 30, 10, ['0xff3040e0', '0xff20a0f0', '0xff20d0a0', '0xff60e040', '0xffe0e030', '0xfff09020', '0xffe02020'][i], {radius: 0})), {name: 'heat_scale'}),
        lbl(256, 164, 60, K('res.high'), {size: 9}),
        lbl(8, 188, 140, K('res.density_here')), slide(150, 191, 150, 'zone_density', 104), field(310, 186, 58, 'zone_density_value', '70%'),
    ]),
], {name: 'bottom_resource'})));
row('loot_slot_row', 212, 32, [
    box(2, 1, 30, 30, [art(-1, -1, 32, 'slot_icon')], {style: 2, color: E.well, name: 'icon_box'}),
    lbl(36, 8, 86, '', {name: 'slot_name', size: 9}),
    box(122, 4, 34, 24, [lbl(0, 4, 34, '', {name: 'slot_pct', align: 'center', size: 9})], {style: 2, color: E.white}),
    box(158, 4, 30, 24, [lbl(0, 4, 30, '', {name: 'slot_qty', align: 'center', size: 9})], {style: 2, color: E.white}),
    ibtn(190, 5, 'slot_action', I.x, {w: 20, h: 22, color: E.red}),
], {root: 'box', dyn: '', color: E.white});
write(P + 'bottom_vfx_xml', layout(P + 'bottom_vfx_xml', 942, 217, panel(0, 0, 942, 217, 'timeline', K('vfx.timeline'), [
    cont(8, 28, 170, 24, [ibtn(0, 0, 'play', U + 'arrows_media_controls_play_triangle_icon', {w: 28, h: 24, color: '0x2f9e2f'}), ibtn(32, 0, 'stop', U + 'arrows_media_controls_stop_icon', {w: 28, h: 24}), ibtn(64, 0, 'rewind', I.left, {w: 28, h: 24}), chk(100, 3, 'loop'), lbl(122, 4, 48, K('vfx.loop'), {size: 9})], {name: 'transport'}),
    lbl(184, 32, 98, K('vfx.display'), {align: 'right'}), drop(286, 28, 100, 'display_menu', K('vfx.display_normal')),
    chk(400, 31, 'show_grid'), lbl(420, 32, 46, K('vfx.grid')), chk(470, 31, 'show_marks'), lbl(490, 32, 56, K('vfx.marks')), chk(550, 31, 'show_angles'), lbl(570, 32, 90, K('vfx.angles')),
    lbl(670, 32, 110, K('vfx.total'), {align: 'right'}), field(784, 28, 90, 'total_duration', '1.60 s'), ibtn(878, 29, 'duration_minus', I.minus), ibtn(904, 29, 'duration_plus', I.plus),
    ...Array.from({length: 10}, (_, i) => lbl(8 + T0 + Math.round(i * 0.2 * 388) - 15, 54, 30, (i * 0.2).toFixed(2), {name: `tick_${i}`, size: 9, color: E.sub, align: 'center'})),
    box(8, 70, 926, 141, [list(0, 0, 926, 141, 'track_list', 0, {scroll: true})], {style: 2, color: E.white, name: 'tracks_box'}),
    cont(0, 52, 942, 159, [], {name: 'playhead_layer'}),
])));
row('playhead', 44, 160, [shape(21, 16, 2, 144, '0xffe02020', {name: 'playhead_line', radius: 0}), box(2, 0, 40, 16, [lbl(0, -1, 40, '', {name: 'playhead_txt', size: 9, bold: true, color: E.white, align: 'center'})], {style: 2, color: '0xe02020', name: 'playhead_badge'})]);
row('vfx_track_row', 912, 22, [
    shape(0, 0, 912, 22, '0xdce8f6', {name: 'bg', radius: 0}), shape(0, 0, 200, 22, '0xc8dcf2', {name: 'head_bg', radius: 0}),
    chk(4, 2, 'track_check'), bmp(26, 3, 16, 16, I.star, {name: 'track_icon'}), lbl(46, 3, 104, '', {name: 'track_name', bold: true}),
    ibtn(154, 1, 'track_eye', I.eye, {w: 20, h: 20}), ibtn(176, 1, 'track_remove', I.x, {w: 20, h: 20}),
    shape(T0, 5, 400, 12, '0xff8ab8e8', {name: 'bar', radius: 3}), cont(0, 0, 912, 22, [], {name: 'lane'}),
]);
row('vfx_prop_row', 912, 15, [
    shape(0, 0, 912, 15, '0xf2f6fb', {name: 'bg', radius: 0}), shape(0, 0, 200, 15, '0xe4eef8', {name: 'head_bg', radius: 0}),
    shape(34, 6, 4, 4, '0xff8090a0', {radius: 2}), lbl(44, -1, 140, '', {name: 'prop_name', size: 9, color: E.sub}),
    shape(T0, 6, 300, 2, '0xff8ab8e8', {name: 'bar', radius: 1}), cont(0, 0, 912, 15, [], {name: 'lane'}),
]);
row('key', 9, 9, [shape(0, 0, 9, 9, '0xff4a90e0', {name: 'key_shape', radius: 2, stroke: '0xff1f3a5a'})]);
const S0 = 150; // SFX lane origin; 25.5 px per second (0 → 30 s)
write(P + 'bottom_sfx_xml', layout(P + 'bottom_sfx_xml', 942, 217, panel(0, 0, 942, 217, 'timeline', K('sfx.timeline'), [
    cont(8, 28, 926, 24, [], {name: 'tool_row'}),
    ...Array.from({length: 7}, (_, i) => lbl(8 + S0 + Math.round(i * 5 * 25.5) - 18, 54, 36, `00:${String(i * 5).padStart(2, '0')}`, {name: `tick_${i}`, size: 9, color: E.sub, align: 'center'})),
    box(8, 70, 926, 118, [list(0, 1, 926, 116, 'track_list', 1)], {style: 2, color: '0xc8d0da', name: 'tracks_box'}),
    cont(0, 52, 942, 136, [], {name: 'playhead_layer'}),
    lbl(8, 194, 110, '', {name: 'time_txt', size: 9}), slide(118, 194, 560, 'progress', 236), bmp(700, 194, 16, 16, U + 'media_audio_sound_volume_2_icon', {color: '0x3a4a5a'}), slide(722, 194, 140, 'volume', 104),
])));
row('sfx_track_row', 926, 28, [
    box(0, 0, 146, 28, [bmp(6, 6, 16, 16, U + 'media_audio_sound_volume_3_icon', {name: 'track_icon', color: '0xffffff'}), lbl(26, 5, 66, '', {name: 'track_name', bold: true, color: E.white}),
        box(94, 4, 22, 20, [lbl(0, 1, 22, 'M', {bold: true, align: 'center'})], {style: 2, color: E.white, params: 17, dyn: 'button', name: 'mute'}),
        box(120, 4, 22, 20, [lbl(0, 1, 22, 'S', {bold: true, align: 'center'})], {style: 2, color: E.white, params: 17, dyn: 'button', name: 'solo'})], {style: 2, color: '0x4a90d9', name: 'track_head'}),
    box(S0, 0, 776, 28, [], {style: 2, color: '0xdde3ea', name: 'lane_bg'}), cont(S0, 0, 776, 28, [], {name: 'lane'}),
]);
write(P + 'sfx_clip_xml', layout(P + 'sfx_clip_xml', 200, 26, box(0, 0, 200, 26, [
    cont(2, 2, 196, 22, [], {name: 'wave'}), lbl(6, -1, 190, '', {name: 'clip_name', size: 8, bold: true}),
], {name: 'sfx_clip', params: 17, dyn: 'lifted_hover', style: 2, color: '0x9cc4f0'})));
row('wave_bar', 2, 22, [shape(0, 0, 2, 22, '0xff2a5a9a', {name: 'bar_shape', radius: 0})]);
row('tool_button', 96, 24, [box(0, 0, 96, 24, [bmp(5, 4, 16, 16, I.plus, {name: 'tool_icon'}), lbl(25, 3, 70, '', {name: 'tool_txt'})], {style: 2, color: E.white, params: 17, dyn: 'button', name: 'tool_box'})]);
row('sfx_emitter', 150, 44, [
    shape(0, 4, 36, 36, '0xff2a6ad0', {name: 'emitter_dot', radius: 18, stroke: '0xffffffff'}), bmp(10, 14, 16, 16, U + 'media_audio_sound_volume_3_icon', {color: '0xffffff'}),
    box(38, 4, 108, 36, [lbl(4, 1, 102, '', {name: 'emitter_name', bold: true, color: E.white}), lbl(4, 17, 102, '', {name: 'emitter_kind', size: 9, color: '0xd8e0e8'})], {style: 2, color: '0x1c2430', name: 'emitter_box'}),
]);
// a resource on the map: its name tag; the ring under it is its spawn radius
row('map_label', 130, 40, [box(10, 0, 110, 34, [lbl(0, 1, 110, '', {name: 'label_name', bold: true, color: E.white, align: 'center'}), lbl(0, 16, 110, '', {name: 'label_level', size: 9, color: '0xd8e0e8', align: 'center'})], {style: 2, color: '0x1c2430', name: 'label_box'})]);
row('heat_blob', 28, 28, [shape(0, 0, 28, 28, '0xffe02020', {name: 'blob_shape', radius: 14})]);
write(P + 'bottom_item_xml', layout(P + 'bottom_item_xml', 942, 217, cont(0, 0, 942, 217, [
    table(0, 0, 468, 217, 'drops', K('item.drops'), K('item.drops_add'), [[K('col.source'), 4, 150], [K('col.type'), 154, 80], [K('col.rate'), 234, 60], [K('col.min'), 294, 60], [K('col.max'), 354, 50]]),
    table(474, 0, 468, 217, 'recipes', K('item.recipes'), K('item.recipes_add'), [[K('col.recipe'), 4, 210], [K('col.job'), 214, 110], [K('col.req'), 324, 80]]),
], {name: 'bottom_item'})));
const consoleTabs = (x, y, names) => cont(x, y, 500, 22, names.map(([n, uri, c], i) => box(i * 124, 0, 120, 22, [bmp(4, 3, 16, 16, uri, {color: c}), lbl(24, 3, 94, '', {name: `${n}_txt`, size: 9})], {name: `filter_${n}`, params: 17, dyn: 'button', style: 2, color: i === 0 ? E.sel : E.white})), {name: 'console_filters'});
write(P + 'bottom_quest_xml', layout(P + 'bottom_quest_xml', 942, 217, cont(0, 0, 942, 217, [
    panel(0, 0, 530, 217, 'console', K('quest.console'), [consoleTabs(8, 28, [['all', I.info, '0x2a6ad0'], ['errors', I.x, '0xd23a2a'], ['warnings', I.warn, '0xe0a020'], ['infos', I.info, '0x2a8fd6']]), box(8, 56, 514, 155, [list(4, 4, 506, 147, 'console_list', 1, {scroll: true})], {style: 2, color: E.white})]),
    panel(536, 0, 230, 217, 'rewards', K('quest.rewards'), [list(8, 30, 214, 140, 'reward_grid', 4, {grid: true}), ebtn(8, 182, 214, 'rewards_edit', K('quest.rewards_edit'))]),
    panel(772, 0, 170, 217, 'flow_map', K('quest.flow_map'), [box(6, 28, 130, 183, [cont(0, 0, 130, 183, [], {name: 'flow_layer'})], {style: 2, color: E.white, name: 'flow_box'}), ibtn(142, 28, 'flow_fit', U + 'software_qr_code_scan_small_icon'), ibtn(142, 54, 'flow_in', I.plus), ibtn(142, 80, 'flow_out', I.minus)]),
], {name: 'bottom_quest'})));
row('console_row', 506, 20, [bmp(2, 2, 16, 16, I.info, {name: 'console_icon'}), lbl(24, 2, 420, '', {name: 'console_txt', size: 9}), lbl(446, 2, 58, '', {name: 'console_time', size: 9, color: E.sub, align: 'right'})]);
row('reward_tile', 60, 60, [art(14, 4, 32, 'reward_icon'), lbl(0, 38, 60, '', {name: 'reward_txt', size: 9, bold: true, align: 'center'}), bmp(22, 22, 16, 16, I.plus, {name: 'reward_add', color: '0x9aa0a8', hidden: true})], {root: 'box', dyn: 'button', color: E.white});
write(P + 'bottom_interaction_xml', layout(P + 'bottom_interaction_xml', 942, 217, cont(0, 0, 942, 217, [
    panel(0, 0, 300, 217, 'test', K('npc.test'), [
        ebtn(8, 28, 112, 'test_run', K('npc.run'), '0x2f9e2f'), ebtn(124, 28, 70, 'test_stop', K('npc.stop'), '0x9a9a9a'), ebtn(198, 28, 94, 'test_reset', K('npc.reset')),
        box(8, 58, 284, 153, [bmp(0, 0, 284, 153, 'rpg/map_editor_backdrop', {name: 'test_scene', tags: false, stretch: true})], {style: 2, color: E.dark, name: 'scene_box'}),
    ]),
    panel(306, 0, 336, 217, 'log', K('npc.log'), [box(8, 28, 320, 183, [list(4, 4, 312, 175, 'log_list', 1, {scroll: true})], {style: 2, color: E.white})], {extra: [drop(186, 1, 90, 'log_filter', K('npc.log_all'), {h: 21}), ebtn(280, 0, 52, 'log_clear', K('npc.log_clear'), E.grey, {h: 22})]}),
    panel(648, 0, 294, 217, 'dialogue', K('npc.dialogue'), [
        box(4, 24, 286, 189, [bmp(0, 0, 286, 189, 'rpg/map_editor_backdrop', {name: 'dialogue_scene', tags: false, stretch: true}),
            box(70, 30, 210, 150, [lbl(8, 4, 160, '', {name: 'npc_name', bold: true, size: 11}), ibtn(186, 4, 'dialogue_close', I.x, {w: 18, h: 18}), lbl(8, 22, 196, '', {name: 'npc_prompt', size: 9}), list(6, 44, 198, 100, 'answer_list', 4)], {style: 2, color: '0xfdfdfb', name: 'dialogue_box'}),
        ], {style: 2, color: E.dark}),
    ]),
], {name: 'bottom_interaction'})));
row('answer_row', 198, 24, [selected(198, 24), box(3, 3, 18, 18, [lbl(0, 0, 18, '', {name: 'answer_index', size: 9, bold: true, color: E.white, align: 'center'})], {style: 2, color: '0x2a6ad0'}), lbl(26, 4, 170, '', {name: 'answer_txt', size: 9})], {root: 'box', color: E.white});

locales('mapeditor', {
    'vortex.mapeditor.content.rail.group': 'Contenu', 'vortex.mapeditor.content.rail.items': 'Objets', 'vortex.mapeditor.content.rail.vfx': 'VFX', 'vortex.mapeditor.content.rail.sfx': 'SFX', 'vortex.mapeditor.content.rail.quests': 'Quêtes',
    'vortex.mapeditor.content.search': 'Rechercher…', 'vortex.mapeditor.content.add': 'Ajouter', 'vortex.mapeditor.content.duplicate': 'Dupliquer', 'vortex.mapeditor.content.delete': 'Supprimer',
    'vortex.mapeditor.content.item.equip': 'Aperçu équipement', 'vortex.mapeditor.content.item.stats': 'Statistiques de base', 'vortex.mapeditor.content.item.affixes': 'Affixes', 'vortex.mapeditor.content.item.affix_add': 'Ajouter un affixe',
    'vortex.mapeditor.content.item.sockets': 'Emplacements de gemmes', 'vortex.mapeditor.content.item.socket_unlock': 'Déverrouiller un socket', 'vortex.mapeditor.content.item.set': 'Bonus de set', 'vortex.mapeditor.content.item.set_none': 'Aucun bonus de set', 'vortex.mapeditor.content.item.set_link': 'Associer à un set…',
    'vortex.mapeditor.content.item.icons': 'Atlas d’icônes', 'vortex.mapeditor.content.item.import': 'Importer…', 'vortex.mapeditor.content.item.variants': 'Variantes de couleur', 'vortex.mapeditor.content.item.borders': 'Bordures selon la rareté',
    'vortex.mapeditor.content.item.drops': 'Sources d’obtention (butin)', 'vortex.mapeditor.content.item.drops_add': 'Ajouter une source', 'vortex.mapeditor.content.item.recipes': 'Sources de fabrication', 'vortex.mapeditor.content.item.recipes_add': 'Ajouter une recette',
    'vortex.mapeditor.content.col.source': 'Source', 'vortex.mapeditor.content.col.type': 'Type', 'vortex.mapeditor.content.col.rate': 'Taux', 'vortex.mapeditor.content.col.min': 'Niv. min', 'vortex.mapeditor.content.col.max': 'Niv. max', 'vortex.mapeditor.content.col.recipe': 'Recette', 'vortex.mapeditor.content.col.job': 'Métier', 'vortex.mapeditor.content.col.req': 'Niv. requis',
    'vortex.mapeditor.content.graph.zoom': 'Zoom : 100 %', 'vortex.mapeditor.content.graph.add_node': 'Ajouter un nœud', 'vortex.mapeditor.content.graph.search_node': 'Rechercher un nœud…',
    'vortex.mapeditor.content.res.loot_detail': 'Table de butin détaillée', 'vortex.mapeditor.content.res.distribution': 'Répartition sur la carte', 'vortex.mapeditor.content.res.heat_respawn': 'Densité de réapparition',
    'vortex.mapeditor.content.res.respawn_area': 'Aire de réapparition', 'vortex.mapeditor.content.res.area_gather': 'Zone de collecte', 'vortex.mapeditor.content.res.area_respawn': 'Zone de respawn', 'vortex.mapeditor.content.res.low': 'Faible', 'vortex.mapeditor.content.res.high': 'Élevée', 'vortex.mapeditor.content.res.density_here': 'Densité sur cette zone :',
    'vortex.mapeditor.content.vfx.timeline': 'Chronologie du VFX', 'vortex.mapeditor.content.vfx.loop': 'Boucle', 'vortex.mapeditor.content.vfx.display': 'Affichage :', 'vortex.mapeditor.content.vfx.display_normal': 'Normal', 'vortex.mapeditor.content.vfx.grid': 'Grille', 'vortex.mapeditor.content.vfx.marks': 'Repères', 'vortex.mapeditor.content.vfx.angles': 'Angles du VFX', 'vortex.mapeditor.content.vfx.total': 'Durée totale :',
    'vortex.mapeditor.content.sfx.timeline': 'Timeline et événements sonores',
    'vortex.mapeditor.content.quest.console': 'Console / validation', 'vortex.mapeditor.content.quest.rewards': 'Aperçu des récompenses', 'vortex.mapeditor.content.quest.rewards_edit': 'Modifier les récompenses…', 'vortex.mapeditor.content.quest.flow_map': 'Mini-carte du flux',
    'vortex.mapeditor.content.npc.test': 'Test / simulation', 'vortex.mapeditor.content.npc.run': 'Lancer le test (F5)', 'vortex.mapeditor.content.npc.stop': 'Arrêter', 'vortex.mapeditor.content.npc.reset': 'Réinitialiser', 'vortex.mapeditor.content.npc.log': 'Log d’exécution', 'vortex.mapeditor.content.npc.log_all': 'Tout', 'vortex.mapeditor.content.npc.log_clear': 'Vider', 'vortex.mapeditor.content.npc.dialogue': 'Aperçu en jeu (dialogue)',
}, {
    'vortex.mapeditor.content.rail.group': 'Content', 'vortex.mapeditor.content.rail.items': 'Items', 'vortex.mapeditor.content.rail.vfx': 'VFX', 'vortex.mapeditor.content.rail.sfx': 'SFX', 'vortex.mapeditor.content.rail.quests': 'Quests',
    'vortex.mapeditor.content.search': 'Search…', 'vortex.mapeditor.content.add': 'Add', 'vortex.mapeditor.content.duplicate': 'Duplicate', 'vortex.mapeditor.content.delete': 'Delete',
    'vortex.mapeditor.content.item.equip': 'Equipment preview', 'vortex.mapeditor.content.item.stats': 'Base stats', 'vortex.mapeditor.content.item.affixes': 'Affixes', 'vortex.mapeditor.content.item.affix_add': 'Add an affix',
    'vortex.mapeditor.content.item.sockets': 'Gem sockets', 'vortex.mapeditor.content.item.socket_unlock': 'Unlock a socket', 'vortex.mapeditor.content.item.set': 'Set bonus', 'vortex.mapeditor.content.item.set_none': 'No set bonus', 'vortex.mapeditor.content.item.set_link': 'Link to a set…',
    'vortex.mapeditor.content.item.icons': 'Icon atlas', 'vortex.mapeditor.content.item.import': 'Import…', 'vortex.mapeditor.content.item.variants': 'Colour variants', 'vortex.mapeditor.content.item.borders': 'Borders by rarity',
    'vortex.mapeditor.content.item.drops': 'Drop sources (loot)', 'vortex.mapeditor.content.item.drops_add': 'Add a source', 'vortex.mapeditor.content.item.recipes': 'Crafting sources', 'vortex.mapeditor.content.item.recipes_add': 'Add a recipe',
    'vortex.mapeditor.content.col.source': 'Source', 'vortex.mapeditor.content.col.type': 'Type', 'vortex.mapeditor.content.col.rate': 'Rate', 'vortex.mapeditor.content.col.min': 'Min lv.', 'vortex.mapeditor.content.col.max': 'Max lv.', 'vortex.mapeditor.content.col.recipe': 'Recipe', 'vortex.mapeditor.content.col.job': 'Job', 'vortex.mapeditor.content.col.req': 'Req. lv.',
    'vortex.mapeditor.content.graph.zoom': 'Zoom: 100%', 'vortex.mapeditor.content.graph.add_node': 'Add a node', 'vortex.mapeditor.content.graph.search_node': 'Search a node…',
    'vortex.mapeditor.content.res.loot_detail': 'Detailed loot table', 'vortex.mapeditor.content.res.distribution': 'Distribution on the map', 'vortex.mapeditor.content.res.heat_respawn': 'Respawn density',
    'vortex.mapeditor.content.res.respawn_area': 'Respawn area', 'vortex.mapeditor.content.res.area_gather': 'Gathering zone', 'vortex.mapeditor.content.res.area_respawn': 'Respawn zone', 'vortex.mapeditor.content.res.low': 'Low', 'vortex.mapeditor.content.res.high': 'High', 'vortex.mapeditor.content.res.density_here': 'Density in this zone:',
    'vortex.mapeditor.content.vfx.timeline': 'VFX timeline', 'vortex.mapeditor.content.vfx.loop': 'Loop', 'vortex.mapeditor.content.vfx.display': 'Display:', 'vortex.mapeditor.content.vfx.display_normal': 'Normal', 'vortex.mapeditor.content.vfx.grid': 'Grid', 'vortex.mapeditor.content.vfx.marks': 'Markers', 'vortex.mapeditor.content.vfx.angles': 'VFX angles', 'vortex.mapeditor.content.vfx.total': 'Total duration:',
    'vortex.mapeditor.content.sfx.timeline': 'Timeline and sound events',
    'vortex.mapeditor.content.quest.console': 'Console / validation', 'vortex.mapeditor.content.quest.rewards': 'Rewards preview', 'vortex.mapeditor.content.quest.rewards_edit': 'Edit the rewards…', 'vortex.mapeditor.content.quest.flow_map': 'Flow map',
    'vortex.mapeditor.content.npc.test': 'Test / simulation', 'vortex.mapeditor.content.npc.run': 'Run the test (F5)', 'vortex.mapeditor.content.npc.stop': 'Stop', 'vortex.mapeditor.content.npc.reset': 'Reset', 'vortex.mapeditor.content.npc.log': 'Run log', 'vortex.mapeditor.content.npc.log_all': 'All', 'vortex.mapeditor.content.npc.log_clear': 'Clear', 'vortex.mapeditor.content.npc.dialogue': 'In-game preview (dialogue)',
});
console.log('content layouts written');
