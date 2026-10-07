import type {IAssetLibrary} from '@ambreia/common/assets/IAssetLibrary';
import {ActionDefinition} from './ActionDefinition';
import type {IActiveActionData} from './IActiveActionData';
import {getXmlAttribute, getXmlChildElements, getXmlRoot} from '../structure/AvatarXmlUtils';

/**
 * Manages avatar action definitions, sorting and filtering.
 *
 * @see sources/win63_version/habbo/avatar/actions/AvatarActionManager.as
 */
export class AvatarActionManager
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::_assets
    private _assets: IAssetLibrary | null;
    private _actions: Map<string, ActionDefinition>;
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::_defaultAction
    private _defaultAction: ActionDefinition | null = null;
    private _defaultLayAction: ActionDefinition | null = null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::AvatarActionManager()
    constructor(assetsOrData: IAssetLibrary | any, data: any = null)
    {
        this._assets = data !== null ? assetsOrData as IAssetLibrary : null;
        this._actions = new Map();
        this.updateActions(data !== null ? data : assetsOrData);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::updateActions()
    public updateActions(data: any): void
    {
        if(!data) return;

        const root = getXmlRoot(data);

        if(root)
        {
            for(const actionElement of getXmlChildElements(root, 'action'))
            {
                const state = getXmlAttribute(actionElement, 'state');

                if(state !== '')
                {
                    this._actions.set(state, new ActionDefinition(actionElement));
                }
            }
        }
        else
        {
            const actions = data?.actions ?? data?.action;

            if(!actions) return;

            const actionList = Array.isArray(actions) ? actions : [actions];

            for(const actionData of actionList)
            {
                const state = String(actionData.state || '');

                if(state !== '')
                {
                    this._actions.set(state, new ActionDefinition(actionData));
                }
            }

            if(data.actionOffsets)
            {
                this.parseActionOffsets(data.actionOffsets);
            }
        }

        this._defaultAction = null;
        this._defaultLayAction = null;
        this.parseActionOffsetsFromAssets();
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::getActionDefinition()
    public getActionDefinition(id: string): ActionDefinition | null
    {
        for(const action of this._actions.values())
        {
            if(action.id === id) return action;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::getActionDefinitionWithState()
    public getActionDefinitionWithState(state: string): ActionDefinition | null
    {
        return this._actions.get(state) || null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::getDefaultAction()
    public getDefaultAction(): ActionDefinition | null
    {
        if(this._defaultAction) return this._defaultAction;

        for(const action of this._actions.values())
        {
            if(action.isDefault)
            {
                this._defaultAction = action;

                return action;
            }
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::getDefaultLayAction()
    public getDefaultLayAction(): ActionDefinition | null
    {
        if(this._defaultLayAction) return this._defaultLayAction;

        const defaultAction = this.getDefaultAction();

        if(!defaultAction) return null;

        this._defaultLayAction = defaultAction.copy();
        this._defaultLayAction.setGeometryType('horizontal');
        this._defaultLayAction.setState('lay');
        this._defaultLayAction.setAssetPartDefinition('lay');

        return this._defaultLayAction;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::getCanvasOffsets()
    public getCanvasOffsets(actions: IActiveActionData[], scale: string, direction: number): number[] | null
    {
        let offsets: number[] | null = null;

        for(const activeAction of actions)
        {
            const actionDef = this._actions.get(activeAction.actionType);

            if(actionDef)
            {
                const actionOffsets = actionDef.getOffsets(scale, direction);

                if(actionOffsets) offsets = actionOffsets;
            }
        }

        return offsets;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::sortActions()
    public sortActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        const filtered = this.filterActions(actions);
        const result: IActiveActionData[] = [];

        for(const action of filtered)
        {
            const definition = this._actions.get(action.actionType);

            if(definition)
            {
                action.definition = definition;
                result.push(action);
            }
        }

        result.sort((a, b) =>
        {
            const precA = a.definition.precedence;
            const precB = b.definition.precedence;

            if(precA < precB) return 1;
            if(precA > precB) return -1;

            return 0;
        });

        return result;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::parseActionOffsets()
    private parseActionOffsetsFromAssets(): void
    {
        if(!this._assets) return;

        for(const action of this._actions.values())
        {
            const state = action.state;
            const assetName = 'action_offset_' + state;

            if(!this._assets.hasAsset(assetName))
            {
                continue;
            }

            const root = getXmlRoot(this._assets.getAssetByName(assetName)?.content ?? null);

            if(!root) continue;

            for(const offsetElement of getXmlChildElements(root, 'offset'))
            {
                const size = getXmlAttribute(offsetElement, 'size');
                const direction = parseInt(getXmlAttribute(offsetElement, 'direction')) || 0;
                const x = parseInt(getXmlAttribute(offsetElement, 'x')) || 0;
                const y = parseInt(getXmlAttribute(offsetElement, 'y')) || 0;
                const z = Number(getXmlAttribute(offsetElement, 'z')) || 0;

                action.setOffsets(size, direction, [x, y, z]);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::parseActionOffsets()
    private parseActionOffsets(offsets: any[]): void
    {
        if(!offsets || offsets.length === 0) return;

        for(const offset of offsets)
        {
            const action = this._actions.get(offset.action);

            if(!action) continue;
            if(!offset.offsets) continue;

            for(const canvasOffset of offset.offsets)
            {
                const size = String(canvasOffset.size || '');
                const direction = canvasOffset.direction;

                if(size === '' || direction === undefined) continue;

                const x = canvasOffset.x || 0;
                const y = canvasOffset.y || 0;
                const z = canvasOffset.z || 0;

                action.setOffsets(size, direction, [x, y, z]);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/avatar/actions/AvatarActionManager.as::filterActions()
    private filterActions(actions: IActiveActionData[]): IActiveActionData[]
    {
        const prevents: Set<string> = new Set();

        for(const action of actions)
        {
            const definition = this._actions.get(action.actionType);

            if(definition)
            {
                for(const p of definition.getPrevents(action.actionParameter))
                {
                    prevents.add(p);
                }
            }
        }

        const result: IActiveActionData[] = [];

        for(const action of actions)
        {
            let key = action.actionType;

            if(action.actionType === 'fx')
            {
                key += '.' + action.actionParameter;
            }

            if(!prevents.has(key))
            {
                result.push(action);
            }
        }

        return result;
    }
}