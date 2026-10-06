/**
 * RoomWidgetUserActionMessage
 *
 * @see sources/win63_version/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as
 *
 * Every "do something to this user/pet/bot" request a widget can raise, addressed by `userId` —
 * which for a pet is its pet id, not a room index. InfoStandWidgetHandler.processWidgetMessage()
 * lists all of these in getWidgetMessages(); most are still unimplemented there (see its
 * UNIMPLEMENTED_WIDGET_MESSAGES set).
 *
 * The constant names below are AS3's own where AS3 kept them readable. Six are obfuscated in the
 * secondary (`const_649`, `const_112`, `const_190`, `const_1082`, `const_964`, `const_1082`) and
 * the primary has no pet-message package to cross-reference, so those are named here after their
 * own string values — the values themselves are verbatim and are what actually travels.
 *
 * Note RESPECT_PET's value has a leading space (" RWUAM_RESPECT_PET"). That is not a typo here:
 * it is in the AS3 verbatim, and InfoStandWidgetHandler's switch matches the same spaced literal,
 * so the two agree. Do not "fix" it without changing both.
 *
 * The RPG fork removed pet breeding, monsterplants and the pet supplements: AS3's
 * TOGGLE_PET_BREEDING_PERMISSION, REQUEST_BREED_PET, HARVEST_PET, REVIVE_PET, COMPOST_PLANT,
 * TREAT_PET, GIVE_WATER_TO_PET and GIVE_LIGHT_TO_PET are not ported.
 */
import {RoomWidgetMessage} from './RoomWidgetMessage';

export class RoomWidgetUserActionMessage extends RoomWidgetMessage
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::WHISPER_USER
    public static readonly WHISPER_USER: string = 'RWUAM_WHISPER_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::IGNORE_USER
    public static readonly IGNORE_USER: string = 'RWUAM_IGNORE_USER';
    public static readonly IGNORE_USER_BUBBLE: string = 'RWUAM_IGNORE_USER_BUBBLE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::UNIGNORE_USER
    public static readonly UNIGNORE_USER: string = 'RWUAM_UNIGNORE_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::KICK_USER
    public static readonly KICK_USER: string = 'RWUAM_KICK_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::BAN_USER_HOUR
    public static readonly BAN_USER_HOUR: string = 'RWUAM_BAN_USER_HOUR';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::BAN_USER_DAY
    public static readonly BAN_USER_DAY: string = 'RWUAM_BAN_USER_DAY';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::BAN_USER_PERM
    public static readonly BAN_USER_PERM: string = 'RWUAM_BAN_USER_PERM';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::MUTE_USER_2MIN
    public static readonly MUTE_USER_2MIN: string = 'RWUAM_MUTE_USER_2MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::MUTE_USER_5MIN
    public static readonly MUTE_USER_5MIN: string = 'RWUAM_MUTE_USER_5MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::MUTE_USER_10MIN
    public static readonly MUTE_USER_10MIN: string = 'RWUAM_MUTE_USER_10MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::SEND_FRIEND_REQUEST
    public static readonly SEND_FRIEND_REQUEST: string = 'RWUAM_SEND_FRIEND_REQUEST';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::RESPECT_USER
    public static readonly RESPECT_USER: string = 'RWUAM_RESPECT_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::REPLENISH_RESPECT
    public static readonly REPLENISH_RESPECT: string = 'RWUAM_REPLENISH_RESPECT_USER';
    public static readonly WIRED_INSPECT: string = 'RWUAM_WIRED_INSPECT';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::WIRED_INSPECT_PET
    public static readonly WIRED_INSPECT_PET: string = 'RWUAM_WIRED_INSPECT_PET';
    public static readonly WIRED_INSPECT_BOT: string = 'RWUAM_WIRED_INSPECT_BOT';
    public static readonly OPEN_PROFILE: string = 'RWUAM_OPEN_PROFILE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::GIVE_RIGHTS
    public static readonly GIVE_RIGHTS: string = 'RWUAM_GIVE_RIGHTS';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::TAKE_RIGHTS
    public static readonly TAKE_RIGHTS: string = 'RWUAM_TAKE_RIGHTS';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::START_TRADING
    public static readonly START_TRADING: string = 'RWUAM_START_TRADING';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::OPEN_HOME_PAGE
    public static readonly OPEN_HOME_PAGE: string = 'RWUAM_OPEN_HOME_PAGE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::REPORT
    public static readonly REPORT: string = 'RWUAM_REPORT';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::PICK_UP_PET
    public static readonly PICK_UP_PET: string = 'RWUAM_PICKUP_PET';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::MOUNT_PET
    public static readonly MOUNT_PET: string = 'RWUAM_MOUNT_PET';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::TOGGLE_PET_RIDING_PERMISSION
    public static readonly TOGGLE_PET_RIDING_PERMISSION: string = 'RWUAM_TOGGLE_PET_RIDING_PERMISSION';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::DISMOUNT_PET
    public static readonly DISMOUNT_PET: string = 'RWUAM_DISMOUNT_PET';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::SADDLE_OFF
    public static readonly SADDLE_OFF: string = 'RWUAM_SADDLE_OFF';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::TRAIN_PET
    public static readonly TRAIN_PET: string = 'RWUAM_TRAIN_PET';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::RESPECT_PET
    // The leading space is AS3's, verbatim — see the class header.
    public static readonly RESPECT_PET: string = ' RWUAM_RESPECT_PET';

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::REQUEST_PET_UPDATE
    public static readonly REQUEST_PET_UPDATE: string = 'RWUAM_REQUEST_PET_UPDATE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::START_NAME_CHANGE
    public static readonly START_NAME_CHANGE: string = 'RWUAM_START_NAME_CHANGE';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::PASS_CARRY_ITEM
    public static readonly PASS_CARRY_ITEM: string = 'RWUAM_PASS_CARRY_ITEM';
    public static readonly DROP_CARRY_ITEM: string = 'RWUAM_DROP_CARRY_ITEM';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::GIVE_CARRY_ITEM_TO_PET
    public static readonly GIVE_CARRY_ITEM_TO_PET: string = 'RWUAM_GIVE_CARRY_ITEM_TO_PET';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::GET_BOT_INFO
    public static readonly GET_BOT_INFO: string = 'RWUAM_GET_BOT_INFO';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::REPORT_CFH_OTHER
    public static readonly REPORT_CFH_OTHER: string = 'RWUAM_REPORT_CFH_OTHER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_ALERT_USER
    public static readonly AMBASSADOR_ALERT_USER: string = 'RWUAM_AMBASSADOR_ALERT_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_KICK_USER
    public static readonly AMBASSADOR_KICK_USER: string = 'RWUAM_AMBASSADOR_KICK_USER';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_2MIN
    public static readonly AMBASSADOR_MUTE_USER_2MIN: string = 'RWUAM_AMBASSADOR_MUTE_2MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_15MIN
    public static readonly AMBASSADOR_MUTE_USER_15MIN: string = 'RWUAM_AMBASSADOR_MUTE_15MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_10MIN
    public static readonly AMBASSADOR_MUTE_USER_10MIN: string = 'RWUAM_AMBASSADOR_MUTE_10MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_60MIN
    public static readonly AMBASSADOR_MUTE_USER_60MIN: string = 'RWUAM_AMBASSADOR_MUTE_60MIN';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_18HOUR
    public static readonly AMBASSADOR_MUTE_USER_18HOUR: string = 'RWUAM_AMBASSADOR_MUTE_18HOUR';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_36HOUR
    public static readonly AMBASSADOR_MUTE_USER_36HOUR: string = 'RWUAM_AMBASSADOR_MUTE_36HOUR';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_MUTE_USER_72HOUR
    public static readonly AMBASSADOR_MUTE_USER_72HOUR: string = 'RWUAM_AMBASSADOR_MUTE_72HOUR';
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::AMBASSADOR_UNMUTE_USER
    public static readonly AMBASSADOR_UNMUTE_USER: string = 'RWUAM_AMBASSADOR_UNMUTE';

    private _userId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::RoomWidgetUserActionMessage()
    constructor(type: string, userId: number = 0)
    {
        super(type);

        this._userId = userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/ui/widget/messages/RoomWidgetUserActionMessage.as::get userId()
    public get userId(): number
    {
        return this._userId;
    }
}
