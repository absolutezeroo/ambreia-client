import {Logger} from '@ambreia/common/utils/Logger';
import type {IRoomObjectVisualization} from './visualization/IRoomObjectVisualization';
import type {IRoomObjectVisualizationData} from './visualization/IRoomObjectVisualizationData';

const log = Logger.getLogger('room.object.RoomObjectVisualizationRegistry');

/**
 * Object type → visualization, and → the data class its content parses into. A host registers the
 * modules it wants; a type nobody registered is not drawn.
 *
 * In AS3 two switches in RoomObjectVisualizationFactory.
 */
export class RoomObjectVisualizationRegistry
{
    private readonly _builders = new Map<string, () => IRoomObjectVisualization>();
    private readonly _dataBuilders = new Map<string, () => IRoomObjectVisualizationData>();
    private _defaultData: (() => IRoomObjectVisualizationData) | null = null;
    private readonly _unknown = new Set<string>();

    /** A type registered twice is an error naming it, unless `{override: true}` says it is meant (see RoomObjectLogicRegistry). */
    public register(type: string, create: () => IRoomObjectVisualization, options: {override?: boolean} = {}): void
    {
        if(this._builders.has(type) && !options.override) throw new Error(`Room object visualization "${type}" is already registered; pass {override: true} to replace it`);

        this._builders.set(type, create);
    }

    /** The data class of a type's content; types without one get the default data. */
    public registerData(type: string, create: () => IRoomObjectVisualizationData, options: {override?: boolean} = {}): void
    {
        if(this._dataBuilders.has(type) && !options.override) throw new Error(`Room object visualization data "${type}" is already registered; pass {override: true} to replace it`);

        this._dataBuilders.set(type, create);
    }

    /** AS3's fallthrough: the data class of every type no registerData() names. */
    public setDefaultData(create: () => IRoomObjectVisualizationData): void
    {
        this._defaultData = create;
    }

    public create(type: string): IRoomObjectVisualization | null
    {
        const create = this._builders.get(type);

        if(create) return create();

        if(!this._unknown.has(type))
        {
            this._unknown.add(type);
            log.warn(`No visualization registered for room object type "${type}"; it is not drawn`);
        }

        return null;
    }

    public createData(type: string): IRoomObjectVisualizationData | null
    {
        return (this._dataBuilders.get(type) ?? this._defaultData)?.() ?? null;
    }

    public types(): string[]
    {
        return [...this._builders.keys()].sort();
    }
}
