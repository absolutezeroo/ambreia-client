/**
 * RoomObjectUserTypes
 *
 * Based on AS3: com.sulake.habbo.room.object.RoomObjectUserTypes
 *
 * User type string constants and mapping utilities.
 */
export const RoomObjectUserTypes = {
    USER: 'user',
    PET: 'pet',
    BOT: 'bot',
    RENTABLE_BOT: 'rentable_bot',
    MONSTERPLANT: 'monsterplant',
} as const;

const typeIdMap: Record<string, number> = {
    user: 1,
    pet: 2,
    bot: 3,
    rentable_bot: 4,
};

export function getUserTypeId(type: string): number
{
    return typeIdMap[type] ?? 0;
}

export function getUserTypeName(id: number): string | null
{
    for(const [name, typeId] of Object.entries(typeIdMap))
    {
        if(typeId === id)
        {
            return name;
        }
    }

    return null;
}

export function getVisualizationType(type: string): string
{
    switch(type)
    {
        case 'bot':
        case 'rentable_bot':
            return 'user';

        default:
            return type;
    }
}
