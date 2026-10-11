import type {IPerkManager, IPerkAllowance} from './IPerkManager';
import type {IMessageEvent} from '@ambreia/net/messages/IMessageEvent';
import type {IHabboCommunicationManager} from '../communication/IHabboCommunicationManager';
import type {EventEmitter} from 'eventemitter3';
import {PerkAllowancesMessageEvent} from '@ambreia/protocol/incoming/perk/index';
import {PerksUpdatedEvent} from './events/PerksUpdatedEvent';

interface IPerkManagerHost
{
    readonly communication: IHabboCommunicationManager | null;
    readonly events: EventEmitter;
}

/**
 * Perk manager
 * Based on AS3 com.sulake.habbo.session.PerkManager
 */
export class PerkManager implements IPerkManager
{
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/PerkManager.as::_ready
    private _ready: boolean = false;
    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::_sessionDataManager
    private _sessionDataManager: IPerkManagerHost | null = null;
    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::_perkAllowancesMessageEvent
    private _perkAllowancesMessageEvent: IMessageEvent | null = null;
    // AS3: sources/PRODUCTION-201601012205-226667486/src/com/sulake/habbo/session/PerkManager.as::_perks
    private _perks: Map<string, IPerkAllowance> | null = new Map();

    constructor(sessionDataManager: IPerkManagerHost)
    {
        this._sessionDataManager = sessionDataManager;

        if(this._sessionDataManager.communication)
        {
            this._perkAllowancesMessageEvent = this._sessionDataManager.communication.addMessageEvent(
                new PerkAllowancesMessageEvent(this.onPerkAllowances.bind(this))
            );
        }
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::get isReady()
    get isReady(): boolean
    {
        return this._ready;
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::get disposed()
    get disposed(): boolean
    {
        return this._sessionDataManager === null;
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::isPerkAllowed()
    isPerkAllowed(perkCode: string): boolean
    {
        const perk = this._perks?.get(perkCode) ?? null;

        return perk !== null && perk.isAllowed;
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::getPerkErrorMessage()
    getPerkErrorMessage(perkCode: string): string
    {
        const perk = this._perks?.get(perkCode) ?? null;

        return perk !== null ? perk.errorMessage : '';
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::onPerkAllowances()
    private onPerkAllowances(event: IMessageEvent): void
    {
        const parser = (event as PerkAllowancesMessageEvent).getParser();

        for(const perk of parser.getPerks())
        {
            this._perks?.set(perk.code, perk);
        }

        this._ready = true;
        this._sessionDataManager?.events.emit(PerksUpdatedEvent.PERKS_UPDATED, new PerksUpdatedEvent());
    }

    // AS3: .../src/com/sulake/habbo/session/PerkManager.as::dispose()
    dispose(): void
    {
        if(this.disposed) return;

        if(this._perks)
        {
            this._perks.clear();
            this._perks = null;
        }

        if(this._sessionDataManager?.communication && this._perkAllowancesMessageEvent)
        {
            this._sessionDataManager.communication.removeMessageEvent(this._perkAllowancesMessageEvent);
        }

        this._perkAllowancesMessageEvent = null;
        this._sessionDataManager = null;
    }
}
