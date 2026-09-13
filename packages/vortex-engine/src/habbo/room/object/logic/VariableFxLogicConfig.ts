/**
 * The logic side's copy of a VariableFx configuration — only the fields that decide *whether and
 * when* an effect is visible. Everything about how it looks (renderer, colour, width, style) stays
 * on the visualization side's own config.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/logic/VariableFxLogicConfig.as
 */
export class VariableFxLogicConfig
{
    // AS3: .../room/object/logic/VariableFxLogicConfig.as::configId
    configId: number;

    // AS3: .../room/object/logic/VariableFxLogicConfig.as::isUserFx
    isUserFx: boolean;

    /**
     * 1 means "only inside a visibility window"; any other value means always on. That single
     * comparison is the whole of `showMode`'s use in the logic.
     */
    // AS3: .../room/object/logic/VariableFxLogicConfig.as::showMode
    showMode: number;

    /**
     * Which value changes open the visibility window, as a 4-bit mask. The bits are recoverable
     * from `MovingObjectLogic.getVariableFxChangeMask()`, which is the only thing that produces
     * the value tested against it:
     *
     *   1  the status was created
     *   2  the value went up
     *   4  the value went down
     *   8  the value did not change
     *
     * which is also why the wired editor clamps it to 0..15.
     */
    // AS3: .../room/object/logic/VariableFxLogicConfig.as::visibilityMask
    //   Name recovered — see VariableFxConfigUpdateData.visibilityMask.
    visibilityMask: number;

    // AS3: .../room/object/logic/VariableFxLogicConfig.as::showOnMouseHover
    showOnMouseHover: boolean;

    // AS3: .../room/object/logic/VariableFxLogicConfig.as::showDuration
    showDuration: number;

    /**
     * Stamped by the manager on every upsert, and compared by the object logic to notice that the
     * room's configs have changed under it without having to diff them.
     */
    // AS3: .../room/object/logic/VariableFxLogicConfig.as::updateId
    updateId: number;

    // AS3: .../room/object/logic/VariableFxLogicConfig.as::VariableFxLogicConfig()
    constructor(
        configId: number,
        isUserFx: boolean,
        showMode: number,
        visibilityMask: number,
        showOnMouseHover: boolean,
        showDuration: number,
        updateId: number = 0
    )
    {
        this.configId = configId;
        this.isUserFx = isUserFx;
        this.showMode = showMode;
        this.visibilityMask = visibilityMask;
        this.showOnMouseHover = showOnMouseHover;
        this.showDuration = showDuration;
        this.updateId = updateId;
    }
}
