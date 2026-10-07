/**
 * RoomRenderer
 *
 * Based on AS3: com.sulake.room.renderer.class_3447
 *
 * Manages a collection of room objects and rendering canvases.
 * Objects are fed to the renderer, which distributes them to canvases.
 * Canvases query objects from this renderer (via IRoomSpriteCanvasContainer).
 *
 * @see sources/PRODUCTION-201601012205-226667486/src/com/sulake/room/renderer/RoomRenderer.as
 */
import type {IRoomObject} from '../object/IRoomObject';
import type {IRoomRenderer} from './IRoomRenderer';
import type {IRoomRenderingCanvas} from './IRoomRenderingCanvas';
import type {IRoomSpriteCanvasContainer} from './IRoomSpriteCanvasContainer';

export class RoomRenderer implements IRoomRenderer, IRoomSpriteCanvasContainer
{
    private _objects: Map<string, IRoomObject> = new Map();
    private _objectKeys: string[] = [];
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::_canvases
    private _canvases: Map<string, IRoomRenderingCanvas> = new Map();
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::_disposed
    private _disposed: boolean = false;

    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::get disposed()
    get disposed(): boolean
    {
        return this._disposed;
    }

    private _roomObjectVariableAccurateZ: string | null = null;

    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::get roomObjectVariableAccurateZ()
    get roomObjectVariableAccurateZ(): string | null
    {
        return this._roomObjectVariableAccurateZ;
    }

    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::set roomObjectVariableAccurateZ()
    set roomObjectVariableAccurateZ(value: string | null)
    {
        this._roomObjectVariableAccurateZ = value;
    }

    /**
	 * Dispose all canvases and objects.
	 *
	 * @see AS3 class_3447 lines 51-84
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::dispose()
    dispose(): void
    {
        if(this._disposed) return;

        for(const canvas of this._canvases.values())
        {
            canvas.dispose();
        }

        this._canvases.clear();
        this._objects.clear();
        this._objectKeys.length = 0;
        this._disposed = true;
    }

    /**
	 * Reset the object list.
	 *
	 * @see AS3 class_3447 line 87
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::reset()
    reset(): void
    {
        this._objects.clear();
        this._objectKeys.length = 0;
    }

    /**
	 * Get the string identifier for a room object.
	 *
	 * @see AS3 class_3447 lines 91-98
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getRoomObjectIdentifier()
    getRoomObjectIdentifier(object: IRoomObject): string | null
    {
        if(object !== null)
        {
            return String(object.getInstanceId());
        }

        return null;
    }

    /**
	 * Add a room object to the renderer.
	 *
	 * @see AS3 class_3447 lines 100-107
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::feedRoomObject()
    feedRoomObject(object: IRoomObject): void
    {
        if(object === null) return;

        const id = this.getRoomObjectIdentifier(object);

        if(id === null) return;

        if(!this._objects.has(id))
        {
            this._objectKeys.push(id);
        }

        this._objects.set(id, object);
    }

    /**
	 * Remove a room object from the renderer and notify canvases.
	 *
	 * @see AS3 class_3447 lines 109-125
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::removeRoomObject()
    removeRoomObject(object: IRoomObject): void
    {
        const id = this.getRoomObjectIdentifier(object);

        if(id === null) return;

        this._objects.delete(id);

        const keyIndex = this._objectKeys.indexOf(id);

        if(keyIndex >= 0)
        {
            this._objectKeys.splice(keyIndex, 1);
        }

        // Notify canvases that an object was removed
        for(const canvas of this._canvases.values())
        {
            if('roomObjectRemoved' in canvas && typeof (canvas as any).roomObjectRemoved === 'function')
            {
                (canvas as any).roomObjectRemoved(id);
            }
        }
    }

    /**
	 * Get a room object by its identifier.
	 *
	 * @see AS3 class_3447 lines 127-130
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getRoomObject()
    getRoomObject(id: string): IRoomObject | null
    {
        return this._objects.get(id) ?? null;
    }

    /**
	 * Get a room object by index.
	 *
	 * @see AS3 class_3447 lines 132-135
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getRoomObjectWithIndex()
    getRoomObjectWithIndex(index: number): IRoomObject | null
    {
        if(index < 0 || index >= this._objectKeys.length) return null;

        return this._objects.get(this._objectKeys[index]) ?? null;
    }

    /**
	 * Get the ID of a room object by index.
	 *
	 * @see AS3 class_3447 lines 137-140
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getRoomObjectIdWithIndex()
    getRoomObjectIdWithIndex(index: number): string | null
    {
        if(index < 0 || index >= this._objectKeys.length) return null;

        return this._objectKeys[index];
    }

    /**
	 * Get the total number of room objects.
	 *
	 * @see AS3 class_3447 lines 142-145
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getRoomObjectCount()
    getRoomObjectCount(): number
    {
        return this._objects.size;
    }

    /**
	 * Render all canvases.
	 *
	 * @see AS3 class_3447 lines 147-163
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::render()
    render(): void
    {
        const time = performance.now();

        for(const canvas of this._canvases.values())
        {
            canvas.render(time);
        }
    }

    /**
	 * Create a new canvas or reinitialize an existing one.
	 *
	 * @see AS3 class_3447 lines 165-181
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::createCanvas()
    createCanvas(id: number, width: number, height: number, scale: number): IRoomRenderingCanvas
    {
        const key = String(id);
        const existing = this._canvases.get(key);

        if(existing)
        {
            existing.initialize(width, height);

            // A re-created canvas takes the new scale on its *geometry*, not through
            // `setScale()` — that one is display zoom, a different number. `win63_version`
            // decompiles this line as `null.scale = param4`, the captured-reference bug; the
            // primary tree has `_loc6_.scale = param4` and settles it.
            // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_2253.as::createCanvas()
            const geometry = existing.geometry as {scale: number} | null;

            if(geometry !== null) geometry.scale = scale;

            return existing;
        }

        const canvas = this.createCanvasInstance(id, width, height, scale);

        this._canvases.set(key, canvas);

        return canvas;
    }

    /**
	 * Get a canvas by ID.
	 *
	 * @see AS3 class_3447 lines 188-191
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::getCanvas()
    getCanvas(id: number): IRoomRenderingCanvas | null
    {
        return this._canvases.get(String(id)) ?? null;
    }

    /**
	 * Dispose a canvas by ID.
	 *
	 * @see AS3 class_3447 lines 193-201
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::disposeCanvas()
    disposeCanvas(id: number): boolean
    {
        const key = String(id);
        const canvas = this._canvases.get(key);

        if(canvas)
        {
            canvas.dispose();
            this._canvases.delete(key);
        }

        return false;
    }

    /**
	 * Update cycle: render all canvases, then call canvas.update() for event dispatch.
	 *
	 * @see AS3 class_3447 lines 203-218
	 */
    // AS3: .../src/com/sulake/room/renderer/_SafeCls_2253.as::update()
    update(_time: number): void
    {
        this.render();

        for(const canvas of this._canvases.values())
        {
            canvas.update();
        }
    }

    /**
	 * Create a canvas instance. Protected to allow subclasses to override
	 * with custom canvas types (e.g., HabboRoomSpriteCanvas).
	 *
	 * @see AS3 class_3447 lines 183-186
	 */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_2253.as::createCanvasInstance()
    // DEVIATION: AS3's base is concrete here — it returns a real canvas instance — where this is
    //   an abstract hook that throws. The reason is the layering rule the port is built on:
    //   `room/` never imports from `habbo/room/`, and the only concrete canvas
    //   (`RoomRenderingCanvas`) lives there. Returning one would invert the dependency the whole
    //   engine/client split rests on. Harmless in practice: `HabboRoomRenderer` overrides this,
    //   the same way AS3's own callers only ever use the Habbo-specific renderer subclass.
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/room/renderer/_SafeCls_2253.as::createCanvasInstance()
    protected createCanvasInstance(_id: number, _width: number, _height: number, _scale: number): IRoomRenderingCanvas
    {
        throw new Error('[RoomRenderer] createCanvasInstance must be overridden');
    }
}
