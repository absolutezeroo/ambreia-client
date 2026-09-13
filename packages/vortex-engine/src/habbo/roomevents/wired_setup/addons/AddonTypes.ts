import type {Triggerable} from '@habbo/communication/messages/incoming/userdefinedroomevents/Triggerable';
import {AddonDefinition} from '@habbo/communication/messages/incoming/userdefinedroomevents/AddonDefinition';

import type {IWiredElement} from '../IWiredElement';
import type {IWiredTypeHolder} from '../IWiredTypeHolder';
import {AchievementEnabler} from './AchievementEnabler';
import {ActionPicker} from './ActionPicker';
import {AddonCode2} from './AddonCode2';
import {AnimationTime} from './AnimationTime';
import {CarryUsers} from './CarryUsers';
import {ConditionEvaluation} from './ConditionEvaluation';
import {ExecuteInOrder} from './ExecuteInOrder';
import {ExecutionLimiter} from './ExecutionLimiter';
import {FurniNamePlaceholder} from './FurniNamePlaceholder';
import {FurniSelectorFilter} from './FurniSelectorFilter';
import {FurniVariableFilter} from './FurniVariableFilter';
import {GlobalPlaceholderAddon} from './GlobalPlaceholderAddon';
import {JumpStrength} from './JumpStrength';
import {UserSelectorFilter} from './UserSelectorFilter';
import {UserVariableFilter} from './UserVariableFilter';
import {VariableCapturer} from './VariableCapturer';
import {VariablePlaceholder} from './VariablePlaceholder';
import {MovePhysics} from './MovePhysics';
import {NoMoveAnimation} from './NoMoveAnimation';
import {UsernamePlaceholder} from './UsernamePlaceholder';
import {VariableTextConverter} from './VariableTextConverter';
import {ChestItemTypeScanner} from './chests/ChestItemTypeScanner';
import {CustomContract} from './chests/CustomContract';
import {Projectile} from './Projectile';
import {VariableTimeUtil} from './VariableTimeUtil';
import {VariableLevelUp} from './VariableLevelUp';
import {VariableFxBossBarAddon} from './variablefx/VariableFxBossBarAddon';
import {VariableFxHealthPointsAddon} from './variablefx/VariableFxHealthPointsAddon';
import {VariableFxLevellingProgressAddon} from './variablefx/VariableFxLevellingProgressAddon';
import {VariableFxNumberDisplayAddon} from './variablefx/VariableFxNumberDisplayAddon';
import {VariableFxProgressBarAddon} from './variablefx/VariableFxProgressBarAddon';
import {VariableFxStatusBarAddon} from './variablefx/VariableFxStatusBarAddon';

/**
 * AddonTypes — the wired addon registry (IWiredTypeHolder): instantiates every addon type and resolves
 * one by its server code.
 *
 * All AS3 addon types are now ported and registered.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/addons/AddonTypes.as
 */
export class AddonTypes implements IWiredTypeHolder
{
    // AS3: AddonTypes.as::_types
    private _types: IWiredElement[] = [
        new ConditionEvaluation(),
        new ActionPicker(),
        new AddonCode2(),
        new ExecutionLimiter(),
        new NoMoveAnimation(),
        new MovePhysics(),
        new CarryUsers(),
        new AnimationTime(),
        new UsernamePlaceholder(),
        new ExecuteInOrder(),
        new FurniNamePlaceholder(),
        new VariableTextConverter(),
        new AchievementEnabler(),
        new GlobalPlaceholderAddon(),
        new JumpStrength(),
        new FurniSelectorFilter(),
        new UserSelectorFilter(),
        new FurniVariableFilter(),
        new UserVariableFilter(),
        new VariableCapturer(),
        new VariablePlaceholder(),
        new ChestItemTypeScanner(),
        new CustomContract(),
        new VariableTimeUtil(),
        new Projectile(),
        new VariableLevelUp(),
        new VariableFxHealthPointsAddon(),
        new VariableFxProgressBarAddon(),
        new VariableFxLevellingProgressAddon(),
        new VariableFxStatusBarAddon(),
        new VariableFxBossBarAddon(),
        new VariableFxNumberDisplayAddon()
    ];

    // AS3: AddonTypes.as::getByCode()
    getByCode(code: number): IWiredElement | null
    {
        for(const type of this._types)
        {
            // AS3 getByCode matches either the positive code or the negativeCode.
            if(type.code === code || type.negativeCode === code)
            {
                return type;
            }
        }

        return null;
    }

    // AS3: AddonTypes.as::getElementByCode()
    getElementByCode(code: number): IWiredElement
    {
        return this.getByCode(code) as IWiredElement;
    }

    // AS3: AddonTypes.as::getKey()
    getKey(): string
    {
        return 'addon';
    }

    // AS3: AddonTypes.as::acceptTriggerable()
    acceptTriggerable(triggerable: Triggerable): boolean
    {
        return triggerable instanceof AddonDefinition;
    }
}
