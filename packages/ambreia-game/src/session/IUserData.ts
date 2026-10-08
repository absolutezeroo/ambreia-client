import type {BotSkillData} from '@ambreia/protocol/parser/room/bot/BotSkillData';
/**
 * Interface for room user data
 * Based on AS3 com.sulake.habbo.session.class_3490 (IUserData)
 */
export interface IUserData
{
    // Room object identification
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get roomObjectId()
    readonly roomObjectId: number;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get type()
    readonly type: number;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get webID()
    readonly webID: number;

    // User information
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get name()
    name: string;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get figure()
    figure: string;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get sex()
    sex: string;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get custom()
    custom: string;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get achievementScore()
    achievementScore: number;

    // Owner information (for pets/bots)
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get ownerId()
    ownerId: number;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get ownerName()
    ownerName: string;

    // Pet properties. The RPG fork removed pet breeding and monsterplants: AS3's rarityLevel,
    // canBreed, canHarvest, canRevive and hasBreedingPermission are not ported.
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get petLevel()
    petLevel: number;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get hasSaddle()
    hasSaddle: boolean;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get isRiding()
    isRiding: boolean;

    // Bot properties
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get botSkills()
    botSkills: number[];
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get botSkillData()
    botSkillData: BotSkillData[];

    // Moderation
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get isModerator()
    isModerator: boolean;
    // AS3: .../src/com/sulake/habbo/session/_SafeCls_1826.as::get isBlocked()
    isBlocked: boolean;
}
