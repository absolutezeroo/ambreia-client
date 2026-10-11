/** Wire thickness value for the editor dropdown selection. */
export function getThicknessSettingBySelectionIndex(index: number): number
{
    switch(index)
    {
        case 0: return -2;
        case 1: return -1;
        case 3: return 1;
        default: return 0;
    }
}
