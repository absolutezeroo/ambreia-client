/** An entry of the HUD's menus (the chat's, the + and « plus » ones): a disabled one is greyed. */
export interface IMenuItem
{
    label: string;
    icon: string | null;
    /** The tint of its icon. */
    color: number;
    checked: boolean;
    enabled: boolean;
    pick: () => void;
}
