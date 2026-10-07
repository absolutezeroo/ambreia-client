/**
 * UserUpdateMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.UserUpdateMessageEventParser
 *
 * Parser for updating room user positions and actions.
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';

export interface IUserUpdateAction
{
    actionType: string;
    actionParameter: string;
}

export interface IUserUpdate
{
    roomIndex: number;
    x: number;
    y: number;
    z: number;
    localZ: number;
    headDir: number;
    bodyDir: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    isMoving: boolean;
    canStandUp: boolean;
    actions: IUserUpdateAction[];
    skipPositionUpdate: boolean;
}

export class UserUpdateMessageParser implements IMessageParser
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/UserUpdateMessageParser.as::_users
    private _users: IUserUpdate[] = [];

    get userCount(): number
    {
        return this._users.length;
    }

    getUser(index: number): IUserUpdate | null
    {
        if(index < 0 || index >= this._users.length)
        {
            return null;
        }

        return this._users[index];
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/UserUpdateMessageParser.as::flush()
    flush(): boolean
    {
        this._users = [];
        return true;
    }

    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/communication/messages/parser/room/engine/UserUpdateMessageParser.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(wrapper === null)
        {
            return false;
        }

        this._users = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const roomIndex = wrapper.readInt();
            const x = wrapper.readInt();
            const y = wrapper.readInt();
            const z = wrapper.readString();
            const headDir = (wrapper.readInt() % 8) * 45;
            const bodyDir = (wrapper.readInt() % 8) * 45;
            const rawActions = wrapper.readString();
            let localZ = 0;
            let targetX = 0;
            let targetY = 0;
            let targetZ = 0;
            let isMoving = false;
            let canStandUp = false;
            let skipPositionUpdate = false;
            const actions: IUserUpdateAction[] = [];

            const actionParts = rawActions.split('/');

            for(const actionPart of actionParts)
            {
                const parts = actionPart.split(' ');
                const actionType = String(parts[0]);
                let actionParameter = '';

                if(actionType === '')
                {
                    continue;
                }

                if(actionType === 'wf')
                {
                    skipPositionUpdate = true;
                }

                if(parts.length >= 2)
                {
                    actionParameter = String(parts[1]);

                    switch(actionType)
                    {
                        case 'mv':
                        {
                            const targetParts = actionParameter.split(',');

                            if(targetParts.length >= 3)
                            {
                                targetX = parseInt(targetParts[0], 10);
                                targetY = parseInt(targetParts[1], 10);
                                targetZ = Number(targetParts[2]);
                                isMoving = true;
                            }
                            break;
                        }

                        case 'sit':
                        {
                            localZ = Number(actionParameter);

                            if(parts.length >= 3)
                            {
                                canStandUp = parts[2] === '1';
                            }
                            break;
                        }

                        case 'lay':
                        {
                            localZ = Math.abs(Number(actionParameter));
                            break;
                        }
                    }
                }

                actions.push({
                    actionType,
                    actionParameter
                });
            }

            this._users.push({
                roomIndex,
                x,
                y,
                z: Number(z),
                localZ,
                headDir,
                bodyDir,
                targetX,
                targetY,
                targetZ,
                isMoving,
                canStandUp,
                actions,
                skipPositionUpdate
            });
        }

        return true;
    }
}
