import {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxStatusData} from '@habbo/room/object/visualization/variablefx/VariableFxStatusData';
import {VariableFxCatalog} from '@habbo/room/object/visualization/variablefx/VariableFxCatalog';
import {MathUtils} from '@habbo/utils/MathUtils';
import {LinearLevelUpper} from '../../levelupper/LinearLevelUpper';
import type {VariableFxEditorState} from './VariableFxEditorState';

/**
 * The fake value the editor's preview animates, and the rules that make it look real.
 *
 * A preview showing a static bar teaches nothing, so `randomize()` invents a plausible next value —
 * but "plausible" differs per category, which is most of this class:
 *
 * - A normal effect picks a value inside the configured range, and RETRIES up to fifty times until
 *   the new progress differs from the old by at least 20%. Without that a random pick often lands
 *   a pixel from where it was and the preview looks broken rather than still.
 * - A level effect picks between three behaviours by dice: a quarter of the time just a value
 *   change, 40% a single level up or down (so the level-up animation is what you see), and the
 *   rest a jump of up to 25 levels.
 * - A heart stack overrides the range entirely — 9 or 15 hearts depending on width — because the
 *   configured 0..100 would ask for a hundred hearts.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/addons/variablefx/model/VariableFxPreviewStatus.as
 */
export class VariableFxPreviewStatus
{
    // AS3: .../model/VariableFxPreviewStatus.as::MAX_LEVEL
    private static readonly MAX_LEVEL: number = 25;

    // AS3: .../model/VariableFxPreviewStatus.as::LEVEL_STEP (name derived)
    //   The AS3 constant is `_SafeStr_11691`, value 100 — the XP one level costs.
    private static readonly LEVEL_STEP: number = 100;

    /** Four plausible team colours, so a DYNAMIC_TEAM_COLOR preview is not always the same one. */
    // AS3: .../model/VariableFxPreviewStatus.as::TEAM_COLORS
    private static readonly TEAM_COLORS: readonly string[] = ['#df291e', '#36b24a', '#3b7de3', '#ffd83d'];

    // AS3: .../model/VariableFxPreviewStatus.as::LEVEL_UPPER
    private static readonly LEVEL_UPPER: LinearLevelUpper = new LinearLevelUpper(
        VariableFxPreviewStatus.LEVEL_STEP, VariableFxPreviewStatus.MAX_LEVEL
    );

    // AS3: .../model/VariableFxPreviewStatus.as::_value (name derived)
    private _value: number = 50;

    // AS3: .../model/VariableFxPreviewStatus.as::_progress (name derived)
    private _progress: number = 0.5;

    // AS3: .../model/VariableFxPreviewStatus.as::_delegatedColor
    private _delegatedColor: string = '#ffffff';

    /**
     * Whether the user has pressed randomize at least once.
     *
     * Before that, the style's own `defaultStatusExtra` wins for every key it sets; afterwards the
     * randomized level and colour override it. That is what makes the first preview show the
     * style's intended example and later ones show movement.
     */
    // AS3: .../model/VariableFxPreviewStatus.as::_randomized (name derived)
    private _randomized: boolean = false;

    // AS3: .../model/VariableFxPreviewStatus.as::_overrideMinValue
    private _overrideMinValue: number | null = null;

    // AS3: .../model/VariableFxPreviewStatus.as::_overrideMaxValue
    private _overrideMaxValue: number | null = null;

    // AS3: .../model/VariableFxPreviewStatus.as::randomize()
    randomize(state: VariableFxEditorState): void
    {
        if(state.colorId === VariableFxCatalog.resolveColorId('DYNAMIC_TEAM_COLOR'))
        {
            this._delegatedColor = VariableFxPreviewStatus.TEAM_COLORS[
                Math.floor(Math.random() * VariableFxPreviewStatus.TEAM_COLORS.length)
            ];
        }

        this.updateHealthPointPreviewOverrides(state);

        if(state.categoryId === 2) this.randomizeLevel(state);
        else this.randomizeNormal(state);

        this._randomized = true;
    }

    // AS3: .../model/VariableFxPreviewStatus.as::toStatusData()
    toStatusData(state: VariableFxEditorState | null = null): VariableFxStatusData
    {
        const extra = new OrderedMap();

        if(state !== null)
        {
            VariableFxPreviewStatus.copyExtra(state.currentStyle().defaultStatusExtra, extra);

            this.updateHealthPointPreviewOverrides(state);

            if(this._delegatedColor === '#ffffff'
                && state.colorId === VariableFxCatalog.resolveColorId('DYNAMIC_TEAM_COLOR'))
            {
                this._delegatedColor = VariableFxPreviewStatus.TEAM_COLORS[0];
            }
        }

        const upper = VariableFxPreviewStatus.LEVEL_UPPER;

        VariableFxPreviewStatus.setIfRandomizedOrAbsent(
            extra, 'current_level', String(upper.currentLevel(this._value)), this._randomized
        );
        VariableFxPreviewStatus.setIfRandomizedOrAbsent(
            extra, 'is_maxed', String(upper.isMaxed(this._value)), this._randomized
        );
        VariableFxPreviewStatus.setIfRandomizedOrAbsent(
            extra, 'max_level', String(upper.maxLevel), this._randomized
        );
        VariableFxPreviewStatus.setIfRandomizedOrAbsent(
            extra, 'delegated_color', this._delegatedColor, this._randomized
        );

        return new VariableFxStatusData(this._value, this._overrideMinValue, this._overrideMaxValue, extra, false);
    }

    /**
     * A value inside the range, far enough from the last one to be visible.
     *
     * The fifty-try cap is AS3's and matters: with a one-wide range every pick is the same value
     * and the loop would never satisfy its own condition.
     */
    // AS3: .../model/VariableFxPreviewStatus.as::randomizeNormal()
    private randomizeNormal(state: VariableFxEditorState): void
    {
        let min = this._overrideMinValue ?? state.defaultMinValue;
        let max = this._overrideMaxValue ?? state.defaultMaxValue;

        if(max <= min)
        {
            min = 0;
            max = 100;
        }

        const previousValue = this._value;
        let progress = this._progress;
        let tries = 0;

        while((previousValue === this._value || Math.abs(progress - this._progress) < 0.2) && tries < 50)
        {
            this._value = min + Math.round(Math.random() * (max - min));
            progress = (this._value - min) / (max - min);
            tries += 1;
        }

        this._progress = progress;
    }

    /** Three behaviours by dice — see the class comment for why. */
    // AS3: .../model/VariableFxPreviewStatus.as::randomizeLevel()
    private randomizeLevel(state: VariableFxEditorState): void
    {
        const roll = Math.random();

        if(roll < 0.25)
        {
            this.randomizeNormal(state);

            return;
        }

        const upper = VariableFxPreviewStatus.LEVEL_UPPER;
        const level = upper.currentLevel(this._value);

        if(roll < 0.65)
        {
            // Up when there is room and the coin says so, down otherwise — level 1 can only go up.
            if(level < upper.maxLevel && (level <= 1 || Math.random() < 0.5))
            {
                this._value += VariableFxPreviewStatus.LEVEL_STEP;
                this._overrideMinValue = upper.xpForLevel(level + 1);
                this._overrideMaxValue = upper.xpForLevel(Math.min(VariableFxPreviewStatus.MAX_LEVEL, level + 2));
            }
            else
            {
                this._value -= VariableFxPreviewStatus.LEVEL_STEP;
                this._overrideMinValue = upper.xpForLevel(level - 1);
                this._overrideMaxValue = upper.xpForLevel(level);
            }

            this.randomizeNormal(state);

            return;
        }

        let delta = Math.trunc(-VariableFxPreviewStatus.MAX_LEVEL + Math.random() * (2 * VariableFxPreviewStatus.MAX_LEVEL));
        let tries = 0;

        while((level + delta < 1 || level + delta > VariableFxPreviewStatus.MAX_LEVEL) && tries < 50)
        {
            delta = Math.trunc(-VariableFxPreviewStatus.MAX_LEVEL + Math.random() * (2 * VariableFxPreviewStatus.MAX_LEVEL));
            tries += 1;
        }

        this._value += MathUtils.clamp(
            delta * VariableFxPreviewStatus.LEVEL_STEP,
            0,
            VariableFxPreviewStatus.LEVEL_STEP * (VariableFxPreviewStatus.MAX_LEVEL + 1)
        );

        const target = level + delta;

        // At the ceiling the range collapses to a point, which is what tells the renderer to show a
        // full bar rather than a fraction of a level that does not exist.
        if(target === VariableFxPreviewStatus.MAX_LEVEL)
        {
            this._overrideMinValue = this._value;
            this._overrideMaxValue = this._value;
            this._progress = 1;

            return;
        }

        this._overrideMinValue = upper.xpForLevel(target);
        this._overrideMaxValue = upper.xpForLevel(target + 1);

        this.randomizeNormal(state);
    }

    // AS3: .../model/VariableFxPreviewStatus.as::updateHealthPointPreviewOverrides()
    private updateHealthPointPreviewOverrides(state: VariableFxEditorState): void
    {
        if(state.categoryId !== 0) return;

        if(state.rendererId === 12)
        {
            this.applyStackedHeartPreviewOverrides(state);

            return;
        }

        this._overrideMinValue = null;
        this._overrideMaxValue = null;
    }

    /** 9 hearts at medium, 15 at large — and never more than the configured range allows. */
    // AS3: .../model/VariableFxPreviewStatus.as::applyStackedHeartPreviewOverrides()
    private applyStackedHeartPreviewOverrides(state: VariableFxEditorState): void
    {
        const range = state.defaultMaxValue - state.defaultMinValue;
        const hearts = state.widthId === VariableFxCatalog.resolveWidthId('medium') ? 9 : 15;

        this._overrideMinValue = 0;
        this._overrideMaxValue = MathUtils.clamp(hearts, 1, range);
    }

    // AS3: .../model/VariableFxPreviewStatus.as::copyExtra()
    private static copyExtra(source: OrderedMap | null, target: OrderedMap): void
    {
        if(source === null) return;

        for(const key of source.getKeys())
        {
            const value = source.getValue(key);

            VariableFxPreviewStatus.setExtra(target, String(key), value === null ? '' : String(value));
        }
    }

    /**
     * AS3 tests `getValue(key) == null` to mean "the style did not set this".
     *
     * Kept as `hasKey()` rather than a null test, because this port's OrderedMap returns the stored
     * value and a style CAN legitimately store an empty string — the null test would then overwrite
     * it. See the `getString() never returns null` note in the project's own conventions.
     */
    // AS3: .../model/VariableFxPreviewStatus.as::toStatusData()
    private static setIfRandomizedOrAbsent(extra: OrderedMap, key: string, value: string, randomized: boolean): void
    {
        if(!randomized && extra.hasKey(key)) return;

        VariableFxPreviewStatus.setExtra(extra, key, value);
    }

    // AS3: .../model/VariableFxPreviewStatus.as::toStatusData()
    private static setExtra(extra: OrderedMap, key: string, value: string): void
    {
        if(extra.hasKey(key)) extra.replace(key, value);
        else extra.add(key, value);
    }
}
