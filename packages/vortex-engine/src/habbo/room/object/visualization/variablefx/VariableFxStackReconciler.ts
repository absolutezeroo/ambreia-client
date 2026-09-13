import type {VariableFxStatusModelData} from '../../variablefx/VariableFxStatusModelData';
import type {StackedAdditionStack} from '../stacked/StackedAdditionStack';
import type {VariableFxConfigStore} from '../VariableFxConfigStore';
import type {IVariableFxAssetProvider} from './IVariableFxAssetProvider';
import type {VariableFxRendererRegistry} from './VariableFxRendererRegistry';
import {VariableFxStackAddition} from './VariableFxStackAddition';

/**
 * Brings an addition stack in line with the wire's status model, once per change.
 *
 * The whole method is a set reconciliation: every `(configId, variableId)` in the model is shown —
 * creating an addition for it if there is none — and every addition NOT in the model is hidden.
 * Hidden, not removed: {@link VariableFxStackAddition} fades out and reports itself finished, and
 * the stack drops it then. That is what makes an effect ending look like an effect ending.
 *
 * The two remembered update ids at the top are the reason this is cheap enough to call every frame.
 * Nothing here runs unless the status model or the config store has actually changed generation,
 * and between changes the call is two integer comparisons.
 *
 * Named for what it does: the AS3 class is `_SafeCls_3641` and the name exists in no tree.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/room/object/visualization/variablefx/_SafeCls_3641.as
 */
export class VariableFxStackReconciler
{
    // AS3: .../variablefx/_SafeCls_3641.as::_lastStatusUpdateId (name derived)
    private _lastStatusUpdateId: number = -1;

    // AS3: .../variablefx/_SafeCls_3641.as::_lastConfigUpdateId (name derived)
    private _lastConfigUpdateId: number = -1;

    /**
     * Returns whether anything changed — which is what the visualization turns into its own dirty
     * flag, and therefore what makes the next frame go through `stack.update()` rather than the
     * early-returning `stack.animate()`.
     */
    // AS3: .../variablefx/_SafeCls_3641.as::reconcile()
    reconcile(
        model: VariableFxStatusModelData | null,
        configs: VariableFxConfigStore | null,
        assetProvider: IVariableFxAssetProvider | null,
        registry: VariableFxRendererRegistry | null,
        stack: StackedAdditionStack | null,
        layer: number,
        time: number
    ): boolean
    {
        if(stack === null) return false;

        const statusUpdateId = model === null ? 0 : model.updateId;
        const configUpdateId = configs === null ? 0 : configs.updateId;

        if(statusUpdateId === this._lastStatusUpdateId && configUpdateId === this._lastConfigUpdateId)
        {
            return false;
        }

        const seen = new Map<number, Set<string>>();
        let changed = false;

        if(model !== null && configs !== null && assetProvider !== null && registry !== null)
        {
            const byConfig = model.statusesByConfig;

            for(let configIndex = 0; byConfig !== null && configIndex < byConfig.length; configIndex++)
            {
                const configId = byConfig.getKey(configIndex);
                const statuses = byConfig.getWithIndex(configIndex);

                if(configId === null || statuses === null) continue;

                for(let statusIndex = 0; statusIndex < statuses.length; statusIndex++)
                {
                    const variableId = statuses.getKey(statusIndex);
                    const entry = statuses.getWithIndex(statusIndex);

                    if(variableId === null || entry === null) continue;

                    let addition = VariableFxStackReconciler.getVariableFxAddition(stack, configId, variableId);

                    if(addition === null)
                    {
                        addition = new VariableFxStackAddition(configId, variableId, configs, assetProvider, registry);
                        changed = true;
                    }

                    // Re-added every pass on purpose: `createdAt` is part of the sort key and can
                    // move, and the stack's `add()` is a no-op when nothing about the key changed.
                    stack.add(addition, layer, entry.createdAt, configId, variableId);

                    if(addition.show(entry, time)) changed = true;

                    VariableFxStackReconciler.markSeen(seen, configId, variableId);
                }
            }
        }

        for(const addition of VariableFxStackReconciler.getVariableFxAdditions(stack))
        {
            if(VariableFxStackReconciler.hasSeen(seen, addition.configId, addition.variableId)) continue;

            if(addition.hide(time)) changed = true;
        }

        this._lastStatusUpdateId = statusUpdateId;
        this._lastConfigUpdateId = configUpdateId;

        return changed;
    }

    // AS3: .../variablefx/_SafeCls_3641.as::getVariableFxAddition()
    private static getVariableFxAddition(
        stack: StackedAdditionStack,
        configId: number,
        variableId: string
    ): VariableFxStackAddition | null
    {
        for(const addition of VariableFxStackReconciler.getVariableFxAdditions(stack))
        {
            if(addition.configId === configId && addition.variableId === variableId) return addition;
        }

        return null;
    }

    // AS3: .../variablefx/_SafeCls_3641.as::getVariableFxAdditions()
    private static getVariableFxAdditions(stack: StackedAdditionStack): VariableFxStackAddition[]
    {
        return stack.getAdditionsByType(VariableFxStackAddition);
    }

    // AS3: .../variablefx/_SafeCls_3641.as::markSeen()
    private static markSeen(seen: Map<number, Set<string>>, configId: number, variableId: string): void
    {
        let variables = seen.get(configId);

        if(variables === undefined)
        {
            variables = new Set();

            seen.set(configId, variables);
        }

        variables.add(variableId);
    }

    // AS3: .../variablefx/_SafeCls_3641.as::hasSeen()
    private static hasSeen(seen: Map<number, Set<string>>, configId: number, variableId: string): boolean
    {
        const variables = seen.get(configId);

        return variables !== undefined && variables.has(variableId);
    }
}
