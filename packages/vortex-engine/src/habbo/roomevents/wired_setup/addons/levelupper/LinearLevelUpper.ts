import {AbstractLevelUpConfig} from './AbstractLevelUpConfig';

/**
 * LinearLevelUpper — a linear level→XP curve: each level past the first costs a fixed step of XP.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/addons/levelupper/LinearLevelUpper.as
 */
export class LinearLevelUpper extends AbstractLevelUpConfig
{
    // AS3: LinearLevelUpper.as::_SafeStr_10199 (name derived: the per-level step)
    private readonly _stepSize: number;

    // AS3: LinearLevelUpper.as::_SafeStr_8797 (name derived: the max level)
    private readonly _maxLevel: number;

    // AS3: LinearLevelUpper.as::LinearLevelUpper()
    constructor(stepSize: number, maxLevel: number)
    {
        super();
        this._stepSize = stepSize;
        this._maxLevel = maxLevel;
    }

    // AS3: LinearLevelUpper.as::get maxLevel()
    override get maxLevel(): number
    {
        return this._maxLevel;
    }

    // AS3: LinearLevelUpper.as::get maxXp()
    override get maxXp(): number
    {
        return this._maxLevel * this._stepSize;
    }

    // AS3: LinearLevelUpper.as::xpForLevel()
    override xpForLevel(level: number): number
    {
        if(level <= 1)
        {
            return 0;
        }

        return this._stepSize * (level - 1);
    }

    /** Levels are 1-based, so the division's floor is offset by one and capped at the maximum. */
    // AS3: LinearLevelUpper.as::currentLevel()
    override currentLevel(xp: number): number
    {
        const bounded = this.boundedValue(xp);

        if(bounded < 0) return 1;

        return Math.min(this._maxLevel, 1 + Math.trunc(bounded / this._stepSize));
    }

    // AS3: LinearLevelUpper.as::totalXpRequired()
    override totalXpRequired(xp: number): number
    {
        return this.isMaxed(xp) ? 0 : this._stepSize;
    }

    // AS3: LinearLevelUpper.as::progress()
    override progress(xp: number): number
    {
        const bounded = this.boundedValue(xp);

        return this.isMaxed(bounded) ? 0 : bounded % this._stepSize;
    }

    // AS3: LinearLevelUpper.as::progressPercentage()
    override progressPercentage(xp: number): number
    {
        const bounded = this.boundedValue(xp);

        return this.isMaxed(bounded) ? 0 : Math.trunc((this.progress(bounded) / this._stepSize) * 100);
    }

    // AS3: LinearLevelUpper.as::xpRemaining()
    override xpRemaining(xp: number): number
    {
        const bounded = this.boundedValue(xp);

        return this.isMaxed(bounded) ? 0 : this._stepSize - this.progress(bounded);
    }

    /**
     * Asked of the LEVEL, not of the XP, and the two disagree at the top of the curve: with a step
     * of 100 and 25 levels, `currentLevel(2400)` is already 25 while `maxXp` is 2500. Comparing the
     * XP would leave a whole level's worth of "not yet maxed" after the last level was reached.
     */
    // AS3: LinearLevelUpper.as::isMaxed()
    override isMaxed(xp: number): boolean
    {
        return this.currentLevel(xp) >= this._maxLevel;
    }
}
