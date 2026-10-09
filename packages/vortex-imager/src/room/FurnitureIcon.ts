/**
 * The hotel's own catalogue icon of a furni, from the icons .ambreia directory (spec
 * 2026-10-09-ambreia-everything, icons revision). The furni's scale-1 render draws the `_icon_`
 * assets of its piece, which differ from this icon for about four in ten (custom furni drawn apart,
 * coloured layers the render misses), so `size=icon` serves this first and renders only without it.
 */
import type {AmbreiaDirectory} from '@ambreia/common/assets/pack/AmbreiaDirectory';

export interface IHotelIcon
{
    bytes: Buffer;
    contentType: string;
}

/** `sofa_silo*2` → `sofa_silo_2_icon`: the name the hotel gave the icon file. */
export function hotelIconName(className: string): string
{
    return `${className.replace('*', '_')}_icon`;
}

/** The icon's image, or null when the directory has no icon for the class. */
export async function readHotelIcon(icons: AmbreiaDirectory, className: string): Promise<IHotelIcon | null>
{
    const files = await icons.read(hotelIconName(className));
    const image = files?.find(file => file.name.endsWith('.png') || file.name.endsWith('.webp'));

    if(!image) return null;

    return {bytes: Buffer.from(image.data), contentType: image.name.endsWith('.webp') ? 'image/webp' : 'image/png'};
}
