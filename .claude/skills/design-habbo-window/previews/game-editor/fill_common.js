// Shared helpers of the content previews, on the editor's own window (vortex_map_editor_xml): the rail
// row lit, the left library, the inspector form (inspect_form + field templates, as buildField does),
// the viewport (iso stand-in, item sheet or graph) and the bottom slot.
// Render with --extra=<scratch>/extra (inspect_form and the iso stand-in are not under vortex-layouts).
const P = 'vortex_map_editor_';
const U = 'rpg/ui-icons/';
const A = (d, n) => `rpg/${d}/icon_${String(n).padStart(2, '0')}`; // full-colour art
const IC = {
    plus: U + 'software_signs_maths_plus_addition_bonus_add_new_icon', x: U + 'software_signs_maths_multiplication_x_crossout_checkmark_cancel_icon', more: U + 'controller_buttons_menu_options_settings_icon',
    copy: U + 'software_clipbaord_list_file_copy_paste_icon', trash: U + 'software_trashcan_garbage_bin_rubbish_delete_erase_1_icon', play: U + 'arrows_media_controls_play_triangle_icon', stop: U + 'arrows_media_controls_stop_icon',
    folder: U + 'software_file_folder_directory_explorer_icon', calendar: U + 'software_calendar_dates_organizer_month_1_icon', coin: U + 'rpg_coin_gold_currency_money_gp_icon', star: U + 'boardgames_card_star_icon',
    sound: U + 'media_audio_sound_volume_3_icon', cut: U + 'cosmetics_tool_scissors_hairdresser_haircut_icon', zoomIn: U + 'software_magnifier_zoom_looking_magnifying_glass_plus_in_icon', zoomOut: U + 'software_magnifier_zoom_looking_magnifying_glass_minus_out_icon',
    gear: U + 'software_options_settings_cogwheel_gear_mechanics_icon', info: U + 'software_warning_sign_circle_information_help_icon', warn: U + 'software_warning_sign_triangle_exclaimation_mark_error_icon', check: U + 'software_signs_checkmark_checkbox_ticked_todo_icon',
    music: U + 'media_musical_note_beam_icon', voice: U + 'software_speech_bubble_foreign_language_translation_localization_icon', sparkle: U + 'rpg_magic_sparkles_enchantment_icon', loop: U + 'arrows_reload_refresh_rotate_clockwise_icon',
};
const at = (n) => find(root, n);

// the rail: zone layers 0–15, separator 16, content 17–20 (RailUi's ACTIVE colour)
const RAIL_AT = {floor: 0, decor: 2, npcs: 6, resources: 8, interactives: 10, items: 17, vfx: 18, sfx: 19, quests: 20};
{ const r = find(root, 'rail_list')?.getListItemAt(RAIL_AT[RAIL]); if(r) r.color = 0xff9cc9f5; }
text(root, 'zone_menu', 'Zone : Forêt du Lac Bleu'); text(root, 'zoom_menu', 'Zoom : 100 %');

// left: the library
function library(title, cats, rows)
{
    const w = place(at('left_slot'), P + 'left_library_xml', 0, 0);
    text(w, 'library_title', title);
    cats.forEach(([l, uri, c], i) => add(find(w, 'category_list'), P + 'category_tile_xml', (t) => { text(t, 'category_txt', l); icon(t, 'category_icon', uri); tint(t, 'category_icon', c); show(t, 'selected', i === 0); }));
    rows.forEach(([title, sub, meta, dotColor, uri, c], i) => add(find(w, 'library_list'), P + 'library_row_xml', (r) => {
        text(r, 'item_title', title); text(r, 'item_sub', sub); text(r, 'item_meta', meta); icon(r, 'item_icon', uri); tint(r, 'item_icon', c ?? 0xffffff); tint(r, 'status_dot', dotColor); show(r, 'selected', i === 0);
    }));
    return w;
}
// inspector: the editor's inspect_form, rows from the field templates
function inspector(title, rows)
{
    const w = place(at('inspector_slot'), P + 'inspect_form_xml', 0, 0);
    text(w, 'form_title', title); text(w, 'form_hint', '');
    const l = find(w, 'field_list'); l.y = 8; l.height = 769;
    for(const [layout, fill] of rows) add(l, P + layout + '_xml', fill);
    return w;
}
// row builders: [template, fill]; the owner's templates first (field_text…, check_row, section)
const setSlider = (r, frac) => { const s = find(r, 'field'); const f = find(s, 'fill'), k = find(s, 'knob'); if(f) f.width = Math.round(140 * frac); if(k) k.x = Math.max(0, Math.round(140 * frac) - 6); };
const F = {
    section: (t) => ['section', (r) => text(r, 'section_label', t)],
    text: (label, v) => ['field_text', (r) => { text(r, 'field_label', label); text(r, 'field', v); }],
    area: (label, v) => ['field_area', (r) => { text(r, 'field_label', label); text(r, 'field', v); }],
    num: (label, v) => ['field_number', (r) => { text(r, 'field_label', label); text(r, 'field', v); }],
    select: (label, v) => ['field_select', (r) => { text(r, 'field_label', label); text(r, 'field', v); }],
    check: (label, on = true) => ['check_row', (r) => { text(r, 'check_label', label); if(on) find(r, 'check')?.select?.(); }],
    range: (label, a, b, sep = 'à') => ['field_range', (r) => { text(r, 'field_label', label); text(r, 'field_min', a); text(r, 'field_max', b); text(r, 'field_sep', sep); }],
    slider: (label, v, frac, uri, c) => ['field_slider', (r) => { text(r, 'field_label', label); text(r, 'field_value', v); setSlider(r, frac); if(uri) { show(r, 'field_icon'); icon(r, 'field_icon', uri); tint(r, 'field_icon', c); find(r, 'field_label').x = 22; } }],
    color: (label, hex) => ['field_color', (r) => { text(r, 'field_label', label); text(r, 'field', '#' + hex.toString(16).toUpperCase().padStart(6, '0')); tint(r, 'field_swatch', hex); }],
    pick: (label, v, uri = IC.more) => ['field_pick', (r) => { text(r, 'field_label', label); text(r, 'field', v); icon(r, 'field_button_icon', uri); }],
    tags: (label, tags) => ['field_tags', (r) => { text(r, 'field_label', label); for(const t of tags) add(find(r, 'tag_list'), P + 'tag_chip_xml', (c) => { const w = t.length * 6 + 12; c.width = w; find(c, 'chip_box').width = w; find(c, 'tag_txt').width = w; text(c, 'tag_txt', t); }); }],
    info: (label, v, dot) => ['field_info', (r) => { text(r, 'field_label', label); text(r, 'field_value', v); if(dot) { show(r, 'field_dot'); tint(r, 'field_dot', dot); find(r, 'field_value').x = 134; } }],
    vec3: (label, x, y, z) => ['field_vec3', (r) => { text(r, 'field_label', label); text(r, 'field_x', x); text(r, 'field_y', y); text(r, 'field_z', z); }],
    gradient: (colors) => ['field_gradient', (r) => colors.forEach((c, i) => tint(r, `seg_${i}`, c))],
    preview: (label, uri) => ['field_preview', (r) => { text(r, 'field_label', label); icon(r, 'preview_image', uri); }],
    add: (label) => ['field_add', (r) => text(r, 'field_label', label)],
    choice: (i, v) => ['field_choice', (r) => { text(r, 'choice_index', String(i)); text(r, 'field', v); }],
    loot: (name, uri, pct, qty) => ['field_loot', (r) => { text(r, 'loot_name', name); icon(r, 'loot_icon', uri); text(r, 'loot_pct', pct); text(r, 'loot_qty', qty); }],
    node: (title, desc, uri, band) => ['field_node', (r) => { text(r, 'node_title', title); text(r, 'node_desc', desc); icon(r, 'node_icon', uri); if(band) tint(r, 'node_box', band); }],
};

// viewport: the iso view's stand-in under the view tools, or a content view that replaces it
function isoView()
{
    const slot = at('viewport_slot'); const w = build('preview_backdrop'); slot.addChildAt(w, 0); return find(w, 'marker_layer');
}
function viewport(layout, {tools = false} = {})
{
    const slot = at('viewport_slot'); const w = build(P + layout + '_xml'); slot.addChildAt(w, 0);
    // the zone's overlays (view tools, view info) stay for a graph, not for an item sheet
    for(let i = 1; i < slot.numChildren; i++) { const c = slot.getChildAt(i); if(c) c.visible = tools && (c.name ?? '').startsWith('view_tool'); }
    return w;
}
const bottom = (layout) => place(at('bottom_slot'), P + layout + '_xml', 0, 0);
// a node graph: a node is [x, y, w, h, band colour, body colour, icon, title, id line, text, ports]
function node(layer, [x, y, w, h, band, body, uri, title, idTxt, body2, {no = false, yesY = 40, inPort = true} = {}])
{
    return place(layer, P + 'graph_node_xml', x, y, (n) => {
        n.width = w; n.height = h; const b = find(n, 'node_body'); b.width = w; b.height = h; tint(n, 'node_body', body);
        const band_ = find(n, 'node_band'); band_.width = w - 2; band_.color = band;
        icon(n, 'node_icon', uri); text(n, 'node_title', title); text(n, 'node_id', idTxt); text(n, 'node_txt', body2);
        find(n, 'node_title').width = w - 34; find(n, 'node_id').width = w - 14; find(n, 'node_txt').width = w - 14;
        const yes = find(n, 'port_yes'); yes.x = w - 5; yes.y = yesY; const nop = find(n, 'port_no'); nop.x = w - 5; show(n, 'port_no', no); show(n, 'port_in', inPort);
    });
}
function link(layer, pts, color = 0xff2a9a50, {arrow = true, dashed = false} = {})
{
    const seg = (sx, sy, sw, sh) => place(layer, P + 'graph_link_xml', sx, sy, (l) => { l.width = sw; l.height = sh; const s = find(l, 'link_shape'); s.width = sw; s.height = sh; s.color = color; });
    for(let i = 0; i < pts.length - 1; i++)
    {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        if(dashed && y1 === y2) for(let x = Math.min(x1, x2); x < Math.max(x1, x2); x += 10) seg(x, y1 - 1, 6, 3);
        else seg(Math.min(x1, x2) - 1, Math.min(y1, y2) - 1, Math.abs(x2 - x1) + 3, Math.abs(y2 - y1) + 3);
    }
    if(arrow)
    {
        const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1];
        const dir = x2 > x1 ? 'right_east' : x2 < x1 ? 'left_west' : y2 > y1 ? 'down_south' : 'up_north';
        place(layer, P + 'graph_arrow_xml', x2 - 8 - (x2 > x1 ? 6 : x2 < x1 ? -6 : 0), y2 - 8 - (y2 > y1 ? 6 : y2 < y1 ? -6 : 0), (a) => { icon(a, 'arrow_icon', `${U}arrows_pointer_${dir}_icon`); tint(a, 'arrow_icon', color & 0xffffff); });
    }
}
const linkLabel = (layer, x, y, t, color) => place(layer, P + 'graph_link_label_xml', x, y, (l) => { text(l, 'label_txt', t); tint(l, 'label_box', color); });
const consoleRow = (list_, layout, kind, t, time) => add(list_, P + layout + '_xml', (r) => { const [uri, c] = {info: [IC.info, 0x2a8fd6], warn: [IC.warn, 0xe0a020], ok: [IC.check, 0x2f9e2f], err: [IC.x, 0xd23a2a], play: [IC.play, 0x2a6ad0]}[kind]; icon(r, 'console_icon', uri); tint(r, 'console_icon', c); text(r, 'console_txt', t); text(r, 'console_time', time); });
