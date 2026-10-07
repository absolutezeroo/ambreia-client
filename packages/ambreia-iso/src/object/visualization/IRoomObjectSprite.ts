/**
 * IRoomObjectSprite Interface
 *
 * Based on AS3: com.sulake.room.object.visualization.IRoomObjectSprite
 *
 * Interface for individual sprite elements in room object visualizations.
 */
import type {Texture} from 'pixi.js';

export interface IRoomObjectSprite
{
    // AS3's `asset` is a Flash BitmapData; this port renders via PixiJS, so the sprite holds a
    // Texture instead — same role (the pixel data actually drawn), different graphics API.
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get asset()
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::set asset()
    texture: Texture | null;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get assetName()
    assetName: string;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get libraryAssetName()
    libraryAssetName: string;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get assetPosture()
    assetPosture: string | null;
    assetGesture: string | null;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get visible()
    visible: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get tag()
    tag: string;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get alpha()
    alpha: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get color()
    color: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get blendMode()
    blendMode: string;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get filters()
    filters: unknown[] | null;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get flipH()
    flipH: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get flipV()
    flipV: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get direction()
    direction: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get offsetX()
    offsetX: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get offsetY()
    offsetY: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get width()
    width: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get height()
    height: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get relativeDepth()
    relativeDepth: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get varyingDepth()
    varyingDepth: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get clickHandling()
    clickHandling: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get skipMouseHandling()
    skipMouseHandling: boolean;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get instanceId()
    instanceId: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get updateId()
    updateId: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get spriteType()
    spriteType: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get objectType()
    objectType: string | null;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get alphaTolerance()
    alphaTolerance: number;
    // AS3: .../src/com/sulake/room/object/visualization/IRoomObjectSprite.as::get planeId()
    planeId: number;

    dispose(): void;
}
