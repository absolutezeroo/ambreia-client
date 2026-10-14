/** Where vortex_hud_quest_tracker_xml's list starts, its padding under it, and its title bar alone. */
const LIST_TOP = 34;
const PADDING = 8;
const TITLE_BAR = 32;

/** The list's height for its rows (their heights) and its spacing between them. */
export function rowsHeight(rows: readonly number[], spacing: number): number
{
    return rows.reduce((sum, row, index) => sum + row + (index > 0 ? spacing : 0), 0);
}

/** The quest tracker's height for its rows, or its title bar when folded. */
export function trackerHeight(rows: readonly number[], spacing: number, folded: boolean): number
{
    return folded ? TITLE_BAR : LIST_TOP + rowsHeight(rows, spacing) + PADDING;
}
