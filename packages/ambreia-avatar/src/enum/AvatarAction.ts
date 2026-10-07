/**
 * Avatar action identifiers and utility methods for expressions/gestures.
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as (AvatarAction)
 */
export class AvatarAction
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::SIGN
    public static readonly SIGN: string = 'sign';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::SLEEP
    public static readonly SLEEP: string = 'Sleep';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::CARRY_OBJECT
    public static readonly CARRY_OBJECT: string = 'cri';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::USE_OBJECT
    public static readonly USE_OBJECT: string = 'usei';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EFFECT
    public static readonly EFFECT: string = 'fx';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::TALK
    public static readonly TALK: string = 'talk';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE
    public static readonly GESTURE: string = 'gest';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION
    public static readonly EXPRESSION: string = 'expression';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::VOTE
    public static readonly VOTE: string = 'vote';
    // The 2016 build calls this `DANCE`; the 2026 client renamed it without changing the value.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::EXPRESSION_JUMP
    public static readonly EXPRESSION_JUMP: string = 'dance';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::TYPING
    public static readonly TYPING: string = 'typing';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::MUTED
    public static readonly MUTED: string = 'muted';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PLAYING_GAME
    public static readonly PLAYING_GAME: string = 'playing_game';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GUIDE_STATUS
    public static readonly GUIDE_STATUS: string = 'guide';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_RESPECT
    public static readonly EXPRESSION_RESPECT: string = 'respect';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_WAVE
    public static readonly EXPRESSION_WAVE: string = 'wave';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_BLOW_A_KISS
    public static readonly EXPRESSION_BLOW_A_KISS: string = 'blow';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::EXPRESSION_67
    public static readonly EXPRESSION_67: string = '67';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_LAUGH
    public static readonly EXPRESSION_LAUGH: string = 'laugh';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_CRY
    public static readonly EXPRESSION_CRY: string = 'cry';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_IDLE
    public static readonly EXPRESSION_IDLE: string = 'idle';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_SNOWBOARD_OLLIE
    public static readonly EXPRESSION_SNOWBOARD_OLLIE: string = 'sbollie';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_SNOWBORD_360
    public static readonly EXPRESSION_SNOWBORD_360: string = 'sb360';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_RIDE_JUMP
    public static readonly EXPRESSION_RIDE_JUMP: string = 'ridejump';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE_SMILE
    public static readonly GESTURE_SMILE: string = 'sml';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE_AGGRAVATED
    public static readonly GESTURE_AGGRAVATED: string = 'agr';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE_SURPRISED
    public static readonly GESTURE_SURPRISED: string = 'srp';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE_SAD
    public static readonly GESTURE_SAD: string = 'sad';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_JOY
    public static readonly PET_GESTURE_JOY: string = 'joy';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_CRAZY
    public static readonly PET_GESTURE_CRAZY: string = 'crz';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_TONGUE
    public static readonly PET_GESTURE_TONGUE: string = 'tng';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_BLINK
    public static readonly PET_GESTURE_BLINK: string = 'eyb';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_MISERABLE
    public static readonly PET_GESTURE_MISERABLE: string = 'mis';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::PET_GESTURE_PUZZLED
    public static readonly PET_GESTURE_PUZZLED: string = 'puz';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE
    public static readonly POSTURE: string = 'posture';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_STAND
    public static readonly POSTURE_STAND: string = 'std';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_SIT
    public static readonly POSTURE_SIT: string = 'sit';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_WALK
    public static readonly POSTURE_WALK: string = 'mv';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_LAY
    public static readonly POSTURE_LAY: string = 'lay';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_SWIM
    public static readonly POSTURE_SWIM: string = 'swim';
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::POSTURE_FLOAT
    public static readonly POSTURE_FLOAT: string = 'float';
    // The five below are `SNOWWAR_*` in the 2016 build and `POSTURE_SNOWWAR_*` in the 2026 one —
    // same values, and the 2026 name says what they are: postures, not actions.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::POSTURE_SNOWWAR_RUN
    public static readonly POSTURE_SNOWWAR_RUN: string = 'swrun';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::POSTURE_SNOWWAR_DIE_FRONT
    public static readonly POSTURE_SNOWWAR_DIE_FRONT: string = 'swdiefront';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::POSTURE_SNOWWAR_DIE_BACK
    public static readonly POSTURE_SNOWWAR_DIE_BACK: string = 'swdieback';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::POSTURE_SNOWWAR_PICK
    public static readonly POSTURE_SNOWWAR_PICK: string = 'swpick';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/enum/_SafeCls_2652.as::POSTURE_SNOWWAR_THROW
    public static readonly POSTURE_SNOWWAR_THROW: string = 'swthrow';

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::GESTURE_MAP
    private static readonly GESTURE_MAP: string[] = [
        '', 'sml', 'agr', 'srp', 'sad', 'joy', 'crz', 'tng', 'eyb', 'mis', 'puz'
    ];

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::EXPRESSION_MAP
    private static readonly EXPRESSION_MAP: string[] = [
        '', 'wave', 'blow', 'laugh', 'cry', 'idle', 'dance', 'respect', 'sbollie', 'sb360', 'ridejump'
    ];

    /**
	 * Gets the expression display time in milliseconds.
	 *
	 * @param id - The expression identifier
	 * @returns Duration in milliseconds
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::getExpressionTime()
    public static getExpressionTime(id: number): number
    {
        switch(id)
        {
            case 1:
                return 5000;
            case 2:
                return 1400;
            case 67:
                return 990;
            case 3:
                return 2000;
            case 4:
                return 2000;
            case 5:
                return 0;
            case 6:
                return 700;
            case 7:
                return 2000;
            case 8:
                return 1500;
            case 9:
                return 1500;
            case 10:
                return 1500;
            default:
                return 0;
        }
    }

    /**
	 * Gets the expression id from its string name.
	 *
	 * @param expression - The expression string
	 * @returns The expression id, or -1 if not found
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::getExpressionId()
    public static getExpressionId(expression: string): number
    {
        if(expression === AvatarAction.EXPRESSION_67)
        {
            return 67;
        }

        return AvatarAction.EXPRESSION_MAP.indexOf(expression);
    }

    /**
	 * Gets the expression string from its id.
	 *
	 * @param expressionId - The expression id
	 * @returns The expression string, or empty string if not found
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::getExpression()
    public static getExpression(expressionId: number): string
    {
        if(expressionId === 67)
        {
            return AvatarAction.EXPRESSION_67;
        }

        if(expressionId < AvatarAction.EXPRESSION_MAP.length)
        {
            return AvatarAction.EXPRESSION_MAP[expressionId];
        }

        return '';
    }

    /**
	 * Gets the gesture id from its string name.
	 *
	 * @param gesture - The gesture string
	 * @returns The gesture id, or -1 if not found
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::getGestureId()
    public static getGestureId(gesture: string): number
    {
        return AvatarAction.GESTURE_MAP.indexOf(gesture);
    }

    /**
	 * Gets the gesture string from its id.
	 *
	 * @param gestureId - The gesture id
	 * @returns The gesture string, or empty string if not found
	 */
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/avatar/enum/AvatarAction.as::getGesture()
    public static getGesture(gestureId: number): string
    {
        if(gestureId < AvatarAction.GESTURE_MAP.length)
        {
            return AvatarAction.GESTURE_MAP[gestureId];
        }

        return '';
    }
}
