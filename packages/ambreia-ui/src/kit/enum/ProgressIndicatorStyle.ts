/**
 * Progress indicator visual style values.
 *
 * @see sources/win63_version/habbo/window/enum/ProgressIndicatorStyle.as
 */
export class ProgressIndicatorStyle
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/ProgressIndicatorStyle.as::FLAT
    public static readonly FLAT: string = 'flat';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/ProgressIndicatorStyle.as::ETCHED
    public static readonly ETCHED: string = 'etched';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/window/enum/ProgressIndicatorStyle.as::ALL
    public static readonly ALL: string[] = [
        ProgressIndicatorStyle.FLAT,
        ProgressIndicatorStyle.ETCHED
    ];
}
