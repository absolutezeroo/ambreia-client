import type {IMessageParser} from '@core/communication/messages/IMessageParser';
import type {IMessageDataWrapper} from '@core/communication/messages/IMessageDataWrapper';
import {OrderedMap} from '@core/utils/OrderedMap';
import {VariableFxConfigUpdateData} from '@habbo/room/object/variablefx/VariableFxConfigUpdateData';

/**
 * The VariableFx configurations in force in a room — the recipes, not the live values.
 *
 * Class name derived: the AS3 parser is obfuscated (`_SafeCls_2977`) and exists in no other tree.
 * Named after the data it builds, which is not obfuscated.
 *
 * @see sources/AIR-1.0.31/src/com/sulake/habbo/communication/messages/parser/userdefinedroomevents/_SafeCls_2977.as
 */
export class VariableFxConfigUpdateParser implements IMessageParser
{
    private _configs: VariableFxConfigUpdateData[] = [];

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2977.as::get configs()
    get configs(): VariableFxConfigUpdateData[]
    {
        return this._configs;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2977.as::flush()
    flush(): boolean
    {
        this._configs = [];
        return true;
    }

    // AS3: .../parser/userdefinedroomevents/_SafeCls_2977.as::parse()
    parse(wrapper: IMessageDataWrapper): boolean
    {
        const count = wrapper.readInt();

        this._configs = [];

        for(let i = 0; i < count; i += 1)
        {
            const configId = wrapper.readInt();
            const isUserFx = wrapper.readBoolean();
            const showMode = wrapper.readInt();
            const visibilityMask = wrapper.readInt();
            const showOnMouseHover = wrapper.readBoolean();
            const showDuration = wrapper.readInt();
            const categoryId = wrapper.readInt();
            const styleId = wrapper.readInt();
            const colorId = wrapper.readInt();
            const widthId = wrapper.readInt();
            const rendererId = wrapper.readInt();
            // Longs, not ints. A bound is a game value the server may put well outside 2^31.
            const defaultMinValue = wrapper.readLong();
            const defaultMaxValue = wrapper.readLong();

            const extra = new OrderedMap<string, string>();
            const extraCount = wrapper.readInt();

            for(let j = 0; j < extraCount; j += 1)
            {
                extra.add(wrapper.readString(), wrapper.readString());
            }

            this._configs.push(new VariableFxConfigUpdateData(
                configId,
                isUserFx,
                showMode,
                visibilityMask,
                showOnMouseHover,
                showDuration,
                categoryId,
                styleId,
                colorId,
                widthId,
                rendererId,
                defaultMinValue,
                defaultMaxValue,
                extra
            ));
        }

        return true;
    }
}
