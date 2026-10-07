/**
 * UsersMessageParser
 *
 * Based on AS3: com.sulake.habbo.communication.messages.parser.room.engine.UsersMessageEventParser
 *
 * Parser for room users (avatars, pets, bots).
 */
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';
import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import {RoomUserData} from '@habbo/communication/messages/incoming/room/engine/RoomUserData';

export class UsersMessageParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::_users
    private _users: RoomUserData[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::getUserCount()
    get userCount(): number
    {
        return this._users.length;
    }

    /**
     * The 56-colour palette the legacy pet figure format indexed into.
     *
     * Read only by `convertOldPetFigure()`, which is itself dead — kept beside it rather than
     * inlined so the method reads as AS3 writes it.
     */
    // AS3: .../src/unknowns/_SafePkg_2184/_SafeCls_2309.as::convertOldPetFigure() (`_loc10_`)
    private static readonly OLD_PET_FIGURE_COLOURS: string[] = [
        'FF7B3A', 'FF9763', 'FFCDB3', 'F59500', 'FBBD5C', 'FEE4B2', 'EDD400', 'F5E759',
        'FBF8B1', '84A95F', 'B0C993', 'DBEFC7', '65B197', '91C7B5', 'C5EDDE', '7F89B2',
        '98A1C5', 'CAD2EC', 'A47FB8', 'C09ED5', 'DBC7E9', 'BD7E9D', 'DA9DBD', 'ECC6DB',
        'DD7B7D', 'F08B90', 'F9BABF', 'ABABAB', 'D4D4D4', 'FFFFFF', 'D98961', 'DFA281',
        'F1D2C2', 'D5B35F', 'DAC480', 'FCFAD3', 'EAA7AF', '86BC40', 'E8CE25', '8E8839',
        '888F67', '5E9414', '84CE84', '96E75A', '88E70D', 'B99105', 'C8D71D', '838851',
        'C08337', '83A785', 'E6AF26', 'ECFF99', '94FFF9', 'ABC8E5', 'F2E5CC', 'D2FF00'
    ];

    /**
     * Rewrites a pre-migration pet figure (`"<type> <breed> <hexColour>"`) as a modern one.
     *
     * Dead in AS3 as well — no call site in the primary tree or in `win63_version` — but a real
     * static member of the parser, so it is ported rather than left as a hole. Note the two
     * off-by-one adjustments are AS3's own: the breed is read `+ 1`, and a colour the palette
     * does not contain yields index 0 through `indexOf(...) + 1`.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::convertOldPetFigure()
    static convertOldPetFigure(figure: string): string
    {
        const parts = figure.split(' ');

        if(parts.length < 3) return '';

        const type = parseInt(parts[0]!, 10);
        const breed = parseInt(parts[1]!, 10) + 1;
        const colour = parts[2]!.substr(parts[2]!.length - 6, 6);

        // Types above 1 all collapse onto 64: the old format only ever had two.
        const setId = (type <= 1) ? (25 * type + breed) : 64;
        const colourId = UsersMessageParser.OLD_PET_FIGURE_COLOURS.indexOf(colour.toUpperCase()) + 1;

        return `phd-${setId}-${colourId}.pbd-${setId}-${colourId}.ptl-${setId}-${colourId}`;
    }

    getUser(index: number): RoomUserData | null
    {
        if(index < 0 || index >= this._users.length)
        {
            return null;
        }

        const data = this._users[index];

        if(data !== null)
        {
            data.setReadOnly();
        }

        return data;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::flush()
    flush(): boolean
    {
        this._users = [];
        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        this._users = Array.from({length: count}, () =>
        {
            const webId = wrapper.readInt();
            const name = wrapper.readString();
            const custom = wrapper.readString();
            const figure = wrapper.readString();
            const roomIndex = wrapper.readInt();
            const x = wrapper.readInt();
            const y = wrapper.readInt();
            const z = wrapper.readString();
            const dir = wrapper.readInt();
            const userType = wrapper.readInt();

            const userData = new RoomUserData(roomIndex);
            userData.dir = dir;
            userData.name = name;
            userData.custom = custom;
            userData.x = x;
            userData.y = y;
            userData.z = parseFloat(z);

            switch(userType)
            {
                case 1: // Regular user
                {
                    userData.webID = webId;
                    userData.userType = RoomUserData.USER_TYPE_USER;
                    userData.sex = this.resolveSex(wrapper.readString());
                    userData.groupID = String(wrapper.readInt());
                    userData.groupStatus = wrapper.readInt();
                    userData.groupName = wrapper.readString();

                    const swimFigure = wrapper.readString();
                    userData.figure = swimFigure ? this.convertSwimFigure(swimFigure, figure, userData.sex) : figure;

                    userData.achievementScore = wrapper.readInt();
                    userData.isModerator = wrapper.readBoolean();

                    // The last field of a type-1 avatar, and the reason this parser used to die on
                    // "End of buffer". It does not exist in the 2016 PRODUCTION build this file was
                    // transcribed from, so it was never read — leaving four bytes per user in the
                    // buffer, which the next iteration consumed as `webId` and pushed every
                    // subsequent field one slot out until a readString() ran off the end. The
                    // primary tree reads it (`_SafeCls_2309.as::parse()`) and the emulator writes it
                    // (`RoomAvatarSerializer.SerializePlayerAvatar`, `.WriteInteger(BadgesRank)`).
                    userData.badgesRank = wrapper.readInt();
                    break;
                }

                case 2: // Pet
                    userData.userType = RoomUserData.USER_TYPE_PET;
                    userData.figure = figure;
                    userData.webID = webId;
                    userData.subType = wrapper.readInt().toString();
                    userData.ownerId = wrapper.readInt();
                    userData.ownerName = wrapper.readString();
                    userData.rarityLevel = wrapper.readInt();
                    userData.hasSaddle = wrapper.readBoolean();
                    userData.isRiding = wrapper.readBoolean();
                    userData.canBreed = wrapper.readBoolean();
                    userData.canHarvest = wrapper.readBoolean();
                    userData.canRevive = wrapper.readBoolean();
                    userData.hasBreedingPermission = wrapper.readBoolean();
                    userData.petLevel = wrapper.readInt();
                    userData.petPosture = wrapper.readString();
                    break;

                case 3: // Old bot
                    userData.userType = RoomUserData.USER_TYPE_OLD_BOT;
                    // AS3 assigns the id it read at the top of the loop, like every other branch;
                    // `-roomIndex` was invented here. Nothing observable changes — the emulator
                    // never emits a type-3 avatar — but the two ids are not interchangeable.
                    userData.webID = webId;
                    userData.figure = figure.includes('/') ? 'hr-100-.hd-180-1.ch-876-66.lg-270-94.sh-300-64' : figure;
                    userData.sex = 'M';
                    break;

                case 4: // Rentable bot
                {
                    userData.userType = RoomUserData.USER_TYPE_BOT;
                    userData.webID = webId;
                    userData.sex = this.resolveSex(wrapper.readString());
                    userData.figure = figure;
                    userData.ownerId = wrapper.readInt();
                    userData.ownerName = wrapper.readString();

                    const skillCount = wrapper.readInt();
                    if(skillCount > 0)
                    {
                        userData.botSkills = Array.from({length: skillCount}, () => wrapper.readShort());
                    }
                    break;
                }
            }

            return userData;
        });

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::resolveSex()
    private resolveSex(value: string): string
    {
        return value[0]?.toLowerCase() === 'f' ? 'F' : 'M';
    }

    /**
     * The swimsuit colours the server names by hex, indexed into a swimsuit part id.
     *
     * Order is load-bearing — the id is the index — so this is the array verbatim, in order.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::convertSwimFigure()
    private static readonly SWIM_COLOURS: readonly string[] = [
        '238,238,238', '250,56,49', '253,146,160', '42,199,210', '53,51,44', '239,255,146',
        '198,255,152', '255,146,90', '157,89,126', '182,243,255', '109,255,51', '51,120,201',
        '255,182,49', '223,161,233', '249,251,50', '202,175,143', '197,198,197', '71,98,61',
        '138,131,97', '255,140,51', '84,198,39', '30,108,153', '152,79,136', '119,200,255',
        '255,192,142', '60,75,135', '124,44,71', '215,255,227', '143,63,28', '255,99,147',
        '31,155,121', '253,255,51'
    ];

    /**
     * Appends the swimsuit parts to a figure.
     *
     * This used to be the 2016 PRODUCTION version, which hardcodes the swimsuit colour to 10001 and
     * always emits a swim type. The 2026 client derives both from the wire value — which is
     * `<something>=<name>/<r,g,b>` — and, crucially, **leaves both at 1** when the string carries no
     * `=`, producing `.ss-1-1`. Same root cause as the missing `badgesRank` above: the file was
     * transcribed from a build ten years older than the one this port targets.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2184/_SafeCls_2309.as::convertSwimFigure()
    private convertSwimFigure(swimFigure: string, baseFigure: string, sex: string): string
    {
        let skinColour = 1;

        for(const part of baseFigure.split('.'))
        {
            const fields = part.split('-');

            if(fields.length > 2 && fields[0] === 'hd')
            {
                skinColour = parseInt(fields[2]);
            }
        }

        let swimType = 1;
        let swimColour = 1;
        const parts = swimFigure.split('=');

        if(parts.length > 1)
        {
            // AS3 also pulls out `_loc14_` (the half before the slash) here and never uses it.
            const colourName = parts[1].split('/')[1];

            swimType = sex === 'F' ? 10010 : 10011;
            swimColour = 10000 + UsersMessageParser.SWIM_COLOURS.indexOf(colourName) + 1;
        }

        return `${baseFigure}.bds-10001-${skinColour}.ss-${swimType}-${swimColour}`;
    }
}
