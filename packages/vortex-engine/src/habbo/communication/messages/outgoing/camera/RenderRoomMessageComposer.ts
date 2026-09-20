import {deflate} from 'pako';
import {MessageComposer} from '@core/communication/messages/MessageComposer';
import {ByteArray} from '@core/communication/util/ByteArray';
import {CryptoTools} from '@core/communication/encryption/CryptoTools';
import {StringUtil} from '@habbo/utils/StringUtil';
import type {IPlaneDrawingData} from '@room/object/visualization/IPlaneDrawingData';
import {JsonMaskDrawingData} from './json/JsonMaskDrawingData';
import {JsonPlaneDrawingData} from './json/JsonPlaneDrawingData';
import {JsonPoint} from './json/JsonPoint';
import {JsonTextureColumnData} from './json/JsonTextureColumnData';

/**
 * Asks the server to render the room as a photo.
 *
 * The payload is a hand-assembled JSON document, zlib-deflated, sent as a single byte array. It is
 * not built with `JSON.stringify` over one object: AS3 concatenates obfuscated key fragments
 * (`StringUtil.makeMagicString`) around a stringified planes array, then appends a timestamp and a
 * checksum derived from the document's own length. Both derived values depend on the exact
 * characters produced, so the fragments, their order and the whitespace inside them are wire
 * format — see `JsonPoint.toJSON()` for the matching constraint on key order.
 *
 * AS3: sources/win63_version/habbo/communication/messages/outgoing/camera/RenderRoomMessageComposer.as
 * (body taken from `_SafeCls_2050` in the primary tree; header 3332 from WIN63's registry — that id
 * is also a server→client header for the loot-box result, which is not a collision, the two tables
 * are independent)
 */
export class RenderRoomMessageComposer extends MessageComposer<[ByteArray]>
{
    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::_SafeStr_10248
    private readonly _roomPlanesData: JsonPlaneDrawingData[];

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::_SafeStr_10217
    private readonly _sprites: string;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::_SafeStr_10271
    private readonly _modifiers: string;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::_SafeStr_10275
    private _effectData: string = '[]';

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::roomId
    private readonly _roomId: number;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::zoomLevel
    private _zoomLevel: number = 1;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::topSecurityLevel
    private readonly _topSecurityLevel: number;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::time
    private _time: number;

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::_SafeStr_4556
    protected _data: ByteArray[] = [];

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::RenderRoomMessageComposer()
    constructor(
        planes: IPlaneDrawingData[],
        sprites: string,
        modifiers: string,
        roomId: number,
        topSecurityLevel: number
    )
    {
        super();

        this._roomPlanesData = this.getRoomPlanesDataArray(planes);
        this._sprites = sprites;
        this._modifiers = modifiers;
        this._roomId = roomId;
        this._topSecurityLevel = topSecurityLevel;
        this._time = Date.now();
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::planesString()
    private static planesString(): string
    {
        return StringUtil.makeMagicString(142, 178, 155, 183, 194, 196, 168, 157, 195, 152, 143, 163, 197, 154, 200, 148, 158, 148, 200);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::spritesString()
    private static spritesString(): string
    {
        return StringUtil.makeMagicString(113, 119, 172, 167, 152, 139, 154, 118, 141, 140, 125, 169, 152, 119, 168, 165, 129, 146);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::modifiersString()
    private static modifiersString(): string
    {
        return StringUtil.makeMagicString(129, 188, 141, 133, 186, 137, 164, 132, 160, 132, 185, 134, 168, 183, 162, 149, 181, 135);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::filtersString()
    private static filtersString(): string
    {
        return StringUtil.makeMagicString(131, 190, 163, 186, 162, 159, 146, 177, 172, 172, 132, 136, 170, 186, 164, 151, 164);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::roomIdString()
    private static roomIdString(): string
    {
        return StringUtil.makeMagicString(122, 181, 177, 127, 144, 130, 147, 129, 125, 157, 126, 145, 142, 145, 170);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::zoomString()
    private static zoomString(): string
    {
        return StringUtil.makeMagicString(126, 132, 128, 180, 166, 134, 158, 167, 151, 148, 133, 132, 181, 159, 146, 158, 159);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::statusString()
    private static statusString(): string
    {
        return StringUtil.makeMagicString(118, 124, 120, 172, 157, 164, 171, 145, 167, 143, 139, 173, 154, 159, 141, 134, 170);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::timestampString()
    private static timestampString(): string
    {
        return StringUtil.makeMagicString(137, 178, 196, 192, 164, 143, 165, 144, 193, 158, 164, 155, 143, 144, 163, 191, 160, 153, 149, 173, 169, 173, 195);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::checksumString()
    private static checksumString(): string
    {
        return StringUtil.makeMagicString(120, 179, 124, 161, 132, 139, 150, 176, 139, 145, 157, 141, 169, 127, 152, 175, 153, 140, 156, 143);
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::jsonEndString()
    private static jsonEndString(): string
    {
        return StringUtil.makeMagicString(136, 148, 159, 145, 168);
    }

    /**
	 * AS3 uses `ByteArray.compress("zlib")`, which is a zlib stream (header + Adler-32), not a raw
	 * deflate — pako's `deflate` defaults to the same framing.
	 */
    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::deflate()
    private static deflateString(value: string): ByteArray
    {
        const source = new ByteArray();

        source.writeUTFBytes(value);

        const compressed = deflate(source.getUint8ArrayView().subarray(0, source.length));
        const result = new ByteArray(compressed.length);

        for(const byte of compressed)
        {
            result.writeByte(byte);
        }

        result.position = 0;

        return result;
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::addEffectData()
    addEffectData(effectData: string): void
    {
        this._effectData = effectData;
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::setZoom()
    setZoom(zoomLevel: number): void
    {
        this._zoomLevel = zoomLevel;
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::compressData()
    compressData(): void
    {
        // The replacer drops empty mask arrays rather than emitting `"masks":[]`.
        const roomPlanesDataJsonObj = JSON.stringify(
            this._roomPlanesData,
            (key: string, value: unknown) =>
            {
                if(key === 'masks' && Array.isArray(value) && value.length === 0)
                {
                    return undefined;
                }

                return value;
            }
        );

        let dataStrJsonObj = RenderRoomMessageComposer.planesString() + roomPlanesDataJsonObj
            + RenderRoomMessageComposer.spritesString() + this._sprites
            + RenderRoomMessageComposer.modifiersString() + this._modifiers
            + RenderRoomMessageComposer.filtersString() + this._effectData
            + RenderRoomMessageComposer.roomIdString() + this._roomId;

        if(this._zoomLevel !== 1)
        {
            dataStrJsonObj += RenderRoomMessageComposer.zoomString() + this._zoomLevel;
        }

        // `time` is mutated here, not just read: the last two digits are stripped off and reused
        // below, and the truncated value is what the timestamp field carries.
        const timeLastDigits = this._time % 100;

        this._time -= timeLastDigits;

        const status = (this._time / 100) % 23 + this._topSecurityLevel;

        dataStrJsonObj += RenderRoomMessageComposer.statusString() + status;

        let check = dataStrJsonObj.length;

        check = (check + this._time / 100 * 17) % 1493;

        const bytes = CryptoTools.stringToByteArray(dataStrJsonObj);
        const checksum = CryptoTools.fletcher100(bytes, check, this._roomId);

        dataStrJsonObj += RenderRoomMessageComposer.timestampString() + (this._time + checksum);
        dataStrJsonObj += RenderRoomMessageComposer.checksumString() + (timeLastDigits + 13) * (check + 29)
            + RenderRoomMessageComposer.jsonEndString();

        this._data = [RenderRoomMessageComposer.deflateString(dataStrJsonObj)];
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::getRoomPlanesDataArray()
    protected getRoomPlanesDataArray(planes: IPlaneDrawingData[]): JsonPlaneDrawingData[]
    {
        const result: JsonPlaneDrawingData[] = [];

        for(const plane of planes)
        {
            const jsonPlane = new JsonPlaneDrawingData();

            jsonPlane.z = plane.z;

            // AS3 indexes the first four corners unguarded; a plane with fewer would throw there.
            const cornerPoints = plane.cornerPoints ?? [];

            jsonPlane.addCornerPoint(cornerPoints[0].x, cornerPoints[0].y);
            jsonPlane.addCornerPoint(cornerPoints[1].x, cornerPoints[1].y);
            jsonPlane.addCornerPoint(cornerPoints[2].x, cornerPoints[2].y);
            jsonPlane.addCornerPoint(cornerPoints[3].x, cornerPoints[3].y);

            jsonPlane.color = plane.color;

            const maskAssetNames = plane.maskAssetNames;
            const maskAssetLocations = plane.maskAssetLocations;
            const maskAssetFlipHs = plane.maskAssetFlipHs;
            const maskAssetFlipVs = plane.maskAssetFlipVs;

            let i = 0;

            while(i < maskAssetNames.length)
            {
                jsonPlane.addMask(new JsonMaskDrawingData(
                    maskAssetNames[i],
                    new JsonPoint(maskAssetLocations[i].x, maskAssetLocations[i].y),
                    maskAssetFlipHs[i],
                    maskAssetFlipVs[i]
                ));

                i++;
            }

            jsonPlane.setBottomAligned(plane.isBottomAligned());

            const assetNameColumns = plane.assetNameColumns;

            if(assetNameColumns.length !== 0)
            {
                for(const column of assetNameColumns)
                {
                    const texCol = new JsonTextureColumnData();

                    for(const assetName of column)
                    {
                        texCol.addAssetName(assetName);
                    }

                    jsonPlane.addTexCol(texCol);
                }
            }

            result.push(jsonPlane);
        }

        return result;
    }

    /**
	 * AS3 returns `true` unconditionally after compressing on demand, so a composer that has not
	 * been packed yet packs itself here rather than reporting that it cannot be sent.
	 */
    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::isSendable()
    isSendable(): boolean
    {
        if(this._data.length === 0)
        {
            this.compressData();
        }

        return true;
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::getMessageArray()
    getMessageArray(): [ByteArray]
    {
        if(this._data.length === 0)
        {
            throw new Error('Render room message sending attempt before packData() is called.');
        }

        return [this._data[0]];
    }

    // AS3: .../outgoing/camera/RenderRoomMessageComposer.as::dispose()
    dispose(): void
    {
        this._data = [];

        super.dispose();
    }
}
