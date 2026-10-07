import type {IHabboConfigurationManager} from '@habbo/configuration/IHabboConfigurationManager';

/**
 * Activity point type constants and icon style lookup.
 *
 * @see sources/win63_version/habbo/catalog/purse/class_2085.as
 */
export class ActivityPointTypeEnum
{
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::DUCKET
    public static readonly DUCKET: number = 0;
    public static readonly SUBSCRIPTION_GIFT_POINTS: number = 3;
    public static readonly LOYALTY: number = 5;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::CREDITS
    public static readonly CREDITS: number = 7;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SEASONAL_1
    public static readonly SEASONAL_1: number = 101;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SEASONAL_2
    public static readonly SEASONAL_2: number = 102;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SEASONAL_3
    public static readonly SEASONAL_3: number = 103;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SEASONAL_4
    public static readonly SEASONAL_4: number = 104;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SEASONAL_5
    public static readonly SEASONAL_5: number = 105;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::NO_OP_1
    public static readonly NO_OP_1: number = 1;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::NO_OP_2
    public static readonly NO_OP_2: number = 2;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::NO_OP_4
    public static readonly NO_OP_4: number = 4;
    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::SILVER
    public static readonly SILVER: number = 1000;
    public static readonly EMERALD: number = 1001;

    private static readonly SEASONAL_ICON_STYLES: Map<string, [number, number]> = new Map([
        ['snowflakes', [27, 27]],
        ['horseshoes', [31, 30]],
        ['nuts', [39, 38]],
        ['stars', [45, 44]],
        ['clouds', [46, 47]],
        ['plain_pumpkins', [49, 50]],
        ['seashells', [55, 55]],
        ['flowers', [59, 58]],
        ['candy', [61, 60]],
        ['popsicles', [63, 62]],
        ['golden_fishes', [65, 64]],
        ['balloons', [67, 66]],
        ['pumpkins', [69, 68]],
        ['easter_eggs', [73, 72]],
        ['truffles', [75, 74]],
        ['blue_balloons', [77, 76]],
        ['mushrooms', [79, 78]],
    ]);

    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::values()
    public static values(): number[]
    {
        return [
            ActivityPointTypeEnum.DUCKET,
            ActivityPointTypeEnum.SEASONAL_1,
            ActivityPointTypeEnum.SEASONAL_2,
            ActivityPointTypeEnum.SEASONAL_3,
            ActivityPointTypeEnum.SEASONAL_4,
            ActivityPointTypeEnum.SEASONAL_5,
            ActivityPointTypeEnum.NO_OP_1,
            ActivityPointTypeEnum.NO_OP_2,
            ActivityPointTypeEnum.NO_OP_4,
        ];
    }

    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::getIconStyleFor()
    public static getIconStyleFor(
        type: number,
        configuration: IHabboConfigurationManager,
        big: boolean,
        combo: boolean = false
    ): number
    {
        if(type === -1 || type === ActivityPointTypeEnum.CREDITS) return big ? 34 : 35;
        if(type === ActivityPointTypeEnum.DUCKET) return big ? 32 : 33;
        if(type === ActivityPointTypeEnum.SUBSCRIPTION_GIFT_POINTS) return big ? 36 : 37;

        if(type === ActivityPointTypeEnum.LOYALTY)
        {
            if(configuration.getBoolean('diamonds.enabled')) return big ? 41 : 42;

            return big ? 53 : 54;
        }

        if(type === ActivityPointTypeEnum.SILVER) return big ? 56 : 57;
        if(type === ActivityPointTypeEnum.EMERALD) return big ? 70 : 71;

        if(ActivityPointTypeEnum.isSeasonal(type))
        {
            const id = configuration.getProperty(`seasonalcurrency.id.${type}`);
            const style = ActivityPointTypeEnum.SEASONAL_ICON_STYLES.get(id);

            if(style) return big ? style[1] : style[0];
        }

        return configuration.getInteger(`currencyiconstyle.${big ? 'big' : 'small'}.${type}${combo ? '.combo' : ''}`, 0);
    }

    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::isVisible()
    public static isVisible(type: number): boolean
    {
        return type !== ActivityPointTypeEnum.NO_OP_1
            && type !== ActivityPointTypeEnum.NO_OP_2
            && type !== ActivityPointTypeEnum.NO_OP_4;
    }

    // AS3: sources/win63_version/habbo/catalog/purse/class_2085.as::isSeasonal()
    public static isSeasonal(type: number): boolean
    {
        return type >= ActivityPointTypeEnum.SEASONAL_1 && type <= ActivityPointTypeEnum.SEASONAL_5;
    }
}
