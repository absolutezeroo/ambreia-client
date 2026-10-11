import type {EventEmitter} from 'eventemitter3';
import type {IVector3d} from '../utils/IVector3d';
import type {IRoomGeometry} from '../utils/IRoomGeometry';
import type {RoomObjectUpdateMessage} from '../messages/RoomObjectUpdateMessage';
import type {IRoomObjectModel} from './IRoomObjectModel';
import type {IRoomObjectModelController} from './IRoomObjectModelController';
import type {IRoomObjectMouseHandler} from './logic/IRoomObjectMouseHandler';
import type {IRoomObjectVisualizationData} from './visualization/IRoomObjectVisualizationData';

/** Recursive room-object contracts are colocated so their type graph stays acyclic. */
export interface IRoomObject
{
    getId(): number;

    getInstanceId(): number;

    getType(): string;

    isInitialized(): boolean;

    getLocation(): IVector3d;

    getDirection(): IVector3d;

    getModel(): IRoomObjectModel;

    getVisualization(): IRoomObjectVisualization | null;

    getMouseHandler(): IRoomObjectMouseHandler | null;

    getAvatarLibraryAssetName(): string;

    getState(index: number): number;

    getUpdateID(): number;

    tearDown(): void;
}

export interface IRoomObjectVisualization
{
    object: IRoomObject | null;

    readonly boundingRectangle: { x: number; y: number; width: number; height: number };

    readonly image: HTMLCanvasElement | null;

    dispose(): void;

    initialize(data: IRoomObjectVisualizationData): boolean;

    update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void;

    getImage(backgroundColor: number, originalId: number): HTMLCanvasElement | null;

    getInstanceId(): number;

    getUpdateID(): number;
}

export interface IRoomObjectEventHandler extends IRoomObjectMouseHandler
{
    object: IRoomObjectController | null;

    eventDispatcher: EventEmitter | null;

    readonly widget: string | null;

    readonly contextMenu: string | null;

    dispose(): void;

    initialize(data: unknown): void;

    tearDown(): void;

    update(time: number): void;

    processUpdateMessage(message: RoomObjectUpdateMessage): void;

    useObject(): void;

    getEventTypes(): string[];
}

export interface IRoomObjectController extends IRoomObject
{
    dispose(): void;

    setInitialized(value: boolean): void;

    setLocation(location: IVector3d): void;

    setDirection(direction: IVector3d): void;

    setVisualization(visualization: IRoomObjectVisualization | null): void;

    setState(state: number, index: number): boolean;

    setEventHandler(handler: IRoomObjectEventHandler | null): void;

    getEventHandler(): IRoomObjectEventHandler | null;

    getModelController(): IRoomObjectModelController;
}
