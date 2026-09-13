/**
 * AbstractLevelUpConfig — base for the level→XP curve simulators (LinearLevelUpper,
 * ExponentialLevelUpper, InterpolateLevelUpper) that drive VariableLevelUp's preview, and now the
 * Variable FX editor's level preview too.
 *
 * AS3 throws from every unimplemented member rather than returning a neutral value, and that is
 * kept: a curve with no `currentLevel()` silently answering 0 would make a level preview look
 * plausible and be wrong. `boundedValue()` is the one member with a real body here, because every
 * subclass needs the same clamp.
 *
 * AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/levelupper/AbstractLevelUpConfig.as
 */
export class AbstractLevelUpConfig
{
    // AS3: AbstractLevelUpConfig.as::get maxLevel()
    get maxLevel(): number
    {
        return 0;
    }

    // AS3: AbstractLevelUpConfig.as::get maxXp()
    get maxXp(): number
    {
        return 0;
    }

    // AS3: AbstractLevelUpConfig.as::xpForLevel()
    xpForLevel(_level: number): number
    {
        return 0;
    }

    // AS3: AbstractLevelUpConfig.as::currentLevel()
    currentLevel(_xp: number): number
    {
        return AbstractLevelUpConfig.abstractMethod('currentLevel');
    }

    // AS3: AbstractLevelUpConfig.as::totalXpRequired()
    totalXpRequired(_xp: number): number
    {
        return AbstractLevelUpConfig.abstractMethod('totalXpRequired');
    }

    // AS3: AbstractLevelUpConfig.as::progress()
    progress(_xp: number): number
    {
        return AbstractLevelUpConfig.abstractMethod('progress');
    }

    // AS3: AbstractLevelUpConfig.as::progressPercentage()
    progressPercentage(_xp: number): number
    {
        return AbstractLevelUpConfig.abstractMethod('progressPercentage');
    }

    // AS3: AbstractLevelUpConfig.as::xpRemaining()
    xpRemaining(_xp: number): number
    {
        return AbstractLevelUpConfig.abstractMethod('xpRemaining');
    }

    // AS3: AbstractLevelUpConfig.as::isMaxed()
    isMaxed(_xp: number): boolean
    {
        return AbstractLevelUpConfig.abstractMethod('isMaxed') !== 0;
    }

    /** Clamps into 0..maxXp — every subclass's methods start with this. */
    // AS3: AbstractLevelUpConfig.as::boundedValue()
    boundedValue(xp: number): number
    {
        if(xp < 0) return 0;

        return Math.min(xp, this.maxXp);
    }

    // AS3: AbstractLevelUpConfig.as::abstractMethod()
    private static abstractMethod(name: string): never
    {
        throw new Error(`AbstractLevelUpConfig.${name} must be implemented by a subclass.`);
    }
}
