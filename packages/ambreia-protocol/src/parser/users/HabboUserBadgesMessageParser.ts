import type {IMessageDataWrapper} from '@ambreia/net/messages/IMessageDataWrapper';
import type {IMessageParser} from '@ambreia/net/messages/IMessageParser';

/**
 * One equipped badge as the wire carries it.
 *
 * AS3 builds a `_SafeCls_3300` from the same four fields — its `slotIndex` is this
 * interface's `slotId`, the name the rest of the port's badge code already uses.
 * `slotIndex` is `badgeIndex - 1` (`_SafeCls_3300.as::get slotIndex()`/`get badgeIndex()`): the
 * wire carries the 1-based slot number, and `slotIndex` converts it to the 0-based value
 * `InfoStandUserView.updateBadges()` bounds-checks to [0,4] and indexes the 5 badge slots with -
 * so `slotId` here must already be that converted, 0-based value; see parse() below.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as
 */
export interface ISelectedBadge
{
    /**
	 * The raw 1-based slot number, exactly as the wire carries it.
	 *
	 * Nothing in the primary tree reads it — only `slotIndex`'s own `- 1` touches it — but it is
	 * a real member of the AS3 DTO and the value `slotId` is derived from, so both are carried
	 * rather than only the converted one.
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1731/_SafeCls_3300.as::get badgeIndex()
    badgeIndex: number;
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1731/_SafeCls_3300.as::get slotIndex()
    slotId: number;
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1731/_SafeCls_3300.as::get badgeCode()
    badgeCode: string;
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1731/_SafeCls_3300.as::get ownerCount()
    ownerCount: number;
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1731/_SafeCls_3300.as::get badgeRarityId()
    badgeRarityId: number;
}

/**
 * HabboUserBadgesMessageParser — the badges a user is wearing (header 1292).
 *
 * Four fields per badge, not two. The two-field shape this parser used to read came from
 * `win63_version`'s decompile of the same class, which drops the last two reads; the primary
 * tree's `_SafeCls_2978.as` reads slotId, badgeCode, ownerCount and badgeRarityId, and the
 * inventory handler feeds all four to `BadgesModel.updateBadge()`. `vortex-emulator`'s
 * `HabboUserBadgesMessageComposerSerializer` was widened to match in the same change.
 *
 * @see sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as
 */
export class HabboUserBadgesMessageParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::_userId
    // Derived name: obfuscated in the primary tree; the accessor it backs is readable.
    private _userId: number = -1;
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::_selectedBadges
    private _selectedBadges: ISelectedBadge[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::get userId()
    get userId(): number
    {
        return this._userId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::get selectedBadges()
    get selectedBadges(): ISelectedBadge[]
    {
        return this._selectedBadges;
    }

    /**
	 * The badge codes alone, in wire order.
	 */
    // TS-only: the shape this parser exposed before it read all four fields; kept because the
    // profile badge grid only wants the codes.
    get badges(): string[]
    {
        return this._selectedBadges.map((badge) => badge.badgeCode);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::flush()
    flush(): boolean
    {
        this._userId = -1;
        this._selectedBadges = [];

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_1891/_SafeCls_2978.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();
        this._selectedBadges = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            // AS3: `_SafeCls_3300`'s constructor stores the raw wire int as `badgeIndex`, and every
            // consumer (InfoStandUserView.updateBadges()) reads `slotIndex` (`badgeIndex - 1`)
            // instead - the wire's 1-based slot number, converted here to the 0-based index this
            // port's `slotId` is used as everywhere else (see ISelectedBadge above). Reading the
            // raw value straight through, as this used to, put every equipped badge one slot off
            // and silently dropped whichever badge occupied wire slot 5 (5 > the [0,4] bounds
            // check).
            const badgeIndex = wrapper.readInt();
            const slotId = badgeIndex - 1;
            const badgeCode = wrapper.readString();
            const ownerCount = wrapper.readInt();
            const badgeRarityId = wrapper.readInt();

            this._selectedBadges.push({badgeIndex, slotId, badgeCode, ownerCount, badgeRarityId});
        }

        return true;
    }
}
