import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';

/**
 * One playlist entry (`_SafeCls_2941` in the primary tree, `class_3334` in `win63_version` —
 * obfuscated in every available tree). The CLASS name is DERIVED, from its three fields and from
 * `YoutubeDisplayWidget.populatePlaylists()`; never passed off as recovered. The three member
 * names are not derived: the backing fields are obfuscated, but the getters over them
 * (`get playlistId()`, `get title()`, `get description()`) are readable in the same file.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_2941.as
 */
export interface IYoutubePlaylist
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_2941.as::get playlistId()
    playlistId: string;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_2941.as::get title()
    title: string;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_2941.as::get description()
    description: string;
}

/**
 * Parses the YouTube display's playlist list plus which one is currently selected.
 *
 * The real name is recovered from `sources/win63_version/habbo/communication/messages/parser/
 * room/furniture/YoutubeDisplayPlaylistsMessageEventParser.as` — obfuscated as `_SafeCls_4185` in
 * the primary tree. Field read order matches the primary tree exactly: furniId, then a count,
 * then that many (playlistId, title, description) string triples, then the selected playlist id.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as
 */
export class YoutubeDisplayPlaylistsMessageEventParser implements IMessageParser
{
    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::_SafeStr_6628
    private _furniId: number = 0;

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::_SafeStr_7409
    private _playlists: IYoutubePlaylist[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::_SafeStr_10163
    private _selectedPlaylistId: string = '';

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::get furniId()
    get furniId(): number
    {
        return this._furniId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::get playlists()
    get playlists(): IYoutubePlaylist[]
    {
        return this._playlists;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::get selectedPlaylistId()
    get selectedPlaylistId(): string
    {
        return this._selectedPlaylistId;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::flush()
    flush(): boolean
    {
        this._playlists = [];

        return true;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/unknowns/_SafePkg_2942/_SafeCls_4185.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._furniId = wrapper.readInt();

        const count = wrapper.readInt();

        this._playlists = [];

        for(let i = 0; i < count; i++)
        {
            const playlistId = wrapper.readString();
            const title = wrapper.readString();
            const description = wrapper.readString();

            this._playlists.push({playlistId, title, description});
        }

        this._selectedPlaylistId = wrapper.readString();

        return true;
    }
}
