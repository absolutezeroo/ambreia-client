/**
 * An inventory effect, as the avatar editor's effects page sees it.
 *
 * Interface name DERIVED: the AS3 file is `habbo/avatar/_SafeCls_3781.as` and the identifier exists
 * in no tree. Named for what it describes and where it lives — it is declared in `habbo/avatar/`
 * rather than in `habbo/inventory/`, i.e. it is the editor's view of an effect, not the
 * inventory's. `habbo/inventory/_SafeCls_1973.as` is the inventory's own, narrower one.
 *
 * The sole implementor is `habbo/inventory/effects/Effect`, which satisfies all four interfaces it
 * carries from one set of fields — `icon` and `iconImage` below are two names for the same one.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/_SafeCls_3781.as
 */
export interface IAvatarEffect
{
    // AS3: .../avatar/_SafeCls_3781.as::get amountInInventory()
    // How many copies the user owns; the grid item shows a badge only above 1.
    readonly amountInInventory: number;

    // AS3: .../avatar/_SafeCls_3781.as::get type()
    readonly type: number;

    // AS3: .../avatar/_SafeCls_3781.as::get subType()
    readonly subType: number;

    // AS3: .../avatar/_SafeCls_3781.as::get secondsLeft()
    // Counts down in real time on `Effect`; the param view re-reads it once a second.
    readonly secondsLeft: number;

    // AS3: .../avatar/_SafeCls_3781.as::get duration()
    readonly duration: number;

    // AS3: .../avatar/_SafeCls_3781.as::get isPermanent()
    // A permanent effect shows a **full** progress bar rather than its remaining time.
    readonly isPermanent: boolean;

    // AS3: .../avatar/_SafeCls_3781.as::get isActive()
    readonly isActive: boolean;

    // AS3: .../avatar/_SafeCls_3781.as::get isInUse()
    readonly isInUse: boolean;

    // AS3: .../avatar/_SafeCls_3781.as::get icon()
    readonly icon: ImageBitmap | null;

    // AS3: .../avatar/_SafeCls_3781.as::get iconImage()
    // The same backing field as `icon` — `Effect` returns `_SafeStr_5528` from both.
    iconImage: ImageBitmap | null;

    // AS3: .../avatar/_SafeCls_3781.as::get isSelected()
    isSelected: boolean;
}
