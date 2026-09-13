import {OrderedMap} from '@core/utils/OrderedMap';
import type {VariableFxStatusModelEntry} from './VariableFxStatusModelEntry';

/**
 * Every status one room object currently carries, grouped by config and then by variable, plus the
 * `updateId` the visualization compares against to decide whether it has to recomposite.
 *
 * @see sources/AIR-1.0.31/scripts/com/sulake/habbo/room/object/variablefx/VariableFxStatusModelData.as
 */
export class VariableFxStatusModelData
{
    // AS3: .../variablefx/VariableFxStatusModelData.as::updateId
    updateId: number;

    // AS3: .../variablefx/VariableFxStatusModelData.as::statusesByConfig
    statusesByConfig: OrderedMap<number, OrderedMap<string, VariableFxStatusModelEntry>> | null;

    // AS3: .../variablefx/VariableFxStatusModelData.as::VariableFxStatusModelData()
    constructor(
        updateId: number,
        statusesByConfig: OrderedMap<number, OrderedMap<string, VariableFxStatusModelEntry>> | null
    )
    {
        this.updateId = updateId;
        this.statusesByConfig = statusesByConfig;
    }

    // AS3: .../variablefx/VariableFxStatusModelData.as::clone()
    clone(): VariableFxStatusModelData
    {
        const copy = new OrderedMap<number, OrderedMap<string, VariableFxStatusModelEntry>>();
        const source = this.statusesByConfig;

        if(source === null) return new VariableFxStatusModelData(this.updateId, copy);

        for(let i = 0; i < source.length; i += 1)
        {
            const configId = source.getKey(i);
            const byVariable = source.getWithIndex(i);

            if(configId === null || byVariable === null) continue;

            const copiedVariables = new OrderedMap<string, VariableFxStatusModelEntry>();

            for(let j = 0; j < byVariable.length; j += 1)
            {
                const variableId = byVariable.getKey(j);
                const entry = byVariable.getWithIndex(j);

                if(variableId === null || entry === null) continue;

                copiedVariables.add(variableId, entry.clone());
            }

            copy.add(configId, copiedVariables);
        }

        return new VariableFxStatusModelData(this.updateId, copy);
    }

    // AS3: .../variablefx/VariableFxStatusModelData.as::dispose()
    dispose(): void
    {
        const source = this.statusesByConfig;

        if(source === null) return;

        for(let i = 0; i < source.length; i += 1)
        {
            const byVariable = source.getWithIndex(i);

            if(byVariable === null) continue;

            for(let j = 0; j < byVariable.length; j += 1)
            {
                byVariable.getWithIndex(j)?.dispose();
            }

            byVariable.dispose();
        }

        source.dispose();
        this.statusesByConfig = null;
    }
}
