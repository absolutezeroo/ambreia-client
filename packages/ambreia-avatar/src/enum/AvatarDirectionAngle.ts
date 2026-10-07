/**
 * Avatar direction angles and flipping data.
 *
 * @see sources/win63_version/habbo/avatar/enum/AvatarDirectionAngle.as
 */
export class AvatarDirectionAngle
{
    public static readonly DIRECTION_ANGLES: number[] = [45, 90, 135, 180, 225, 270, 315, 0];
    public static readonly DIRECTION_IS_FLIPPED: boolean[] = [false, false, false, false, true, true, true, false];
    public static readonly MIN_DIRECTION: number = 0;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/AvatarDirectionAngle.as::MAX_DIRECTION
    public static readonly MAX_DIRECTION: number = 7;
}
