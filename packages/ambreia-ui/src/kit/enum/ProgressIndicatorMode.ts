/**
 * Progress indicator fill mode values.
 *
 * @see sources/win63_version/habbo/window/enum/ProgressIndicatorMode.as
 */
export class ProgressIndicatorMode
{
    public static readonly POSITION: string = 'position';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/ProgressIndicatorMode.as::PROGRESS
    public static readonly PROGRESS: string = 'progress';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/ProgressIndicatorMode.as::ALL
    public static readonly ALL: string[] = [
        ProgressIndicatorMode.POSITION,
        ProgressIndicatorMode.PROGRESS
    ];
}
