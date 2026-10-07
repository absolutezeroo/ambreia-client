import type {IAvatarImage} from '@ambreia/avatar/IAvatarImage';

/**
 * Utility for extracting a focused avatar face bitmap.
 *
 * Port of AS3 HabboFaceFocuser.
 *
 * @see sources/win63_version/habbo/utils/HabboFaceFocuser.as
 */
export class HabboFaceFocuser
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboFaceFocuser.as::ICON_HEIGHT_NORMAL
    private static readonly ICON_HEIGHT_NORMAL: number = 50;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboFaceFocuser.as::ICON_WIDTH_NORMAL
    private static readonly ICON_WIDTH_NORMAL: number = 50;
    private static readonly X_OFFSETS: number[] = [-100, -100, 21, 21, -100, -100, -100, -100, -100];
    private static readonly Y_OFFSETS: number[] = [-100, -100, 28, 30, -100, -100, -100, -100, -100];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboFaceFocuser.as::focusUserFace()
    public static focusUserFace(
        avatarImage: IAvatarImage,
        setType: string,
        direction: number,
        scale: number,
        width: number = -1,
        height: number = -1
    ): ImageBitmap | null
    {
        const sourceWidth = HabboFaceFocuser.ICON_WIDTH_NORMAL * scale;
        const sourceHeight = HabboFaceFocuser.ICON_HEIGHT_NORMAL * scale;
        const targetWidth = width === -1 ? sourceWidth : width;
        const targetHeight = height === -1 ? sourceHeight : height;

        avatarImage.setDirection(setType, direction);

        const texture = avatarImage.getImage(setType, true, scale);
        const resource = texture?.source?.resource as CanvasImageSource | null;

        if(!resource) return null;

        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const context = canvas.getContext('2d');

        if(!context) return null;

        const targetY = (targetHeight - sourceHeight) / 2;

        context.drawImage(
            resource,
            HabboFaceFocuser.X_OFFSETS[direction] * scale,
            HabboFaceFocuser.Y_OFFSETS[direction] * scale,
            sourceWidth,
            sourceHeight,
            0,
            targetY,
            sourceWidth,
            sourceHeight
        );

        return canvas.transferToImageBitmap();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/utils/HabboFaceFocuser.as::cutCircleFromBitmap()
    public static cutCircleFromBitmap(bitmap: ImageBitmap, radius: number): ImageBitmap | null
    {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');

        if(!context) return null;

        context.beginPath();
        context.arc(bitmap.width / 2, bitmap.height / 2, radius, 0, Math.PI * 2);
        context.closePath();
        context.clip();
        context.drawImage(bitmap, 0, 0);

        return canvas.transferToImageBitmap();
    }
}
