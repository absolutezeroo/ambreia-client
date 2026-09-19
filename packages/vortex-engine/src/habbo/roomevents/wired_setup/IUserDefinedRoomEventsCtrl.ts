import type {Triggerable} from '@habbo/communication/messages/incoming/userdefinedroomevents/Triggerable';
import type {GuildMembershipsMessageEvent} from '@habbo/communication/messages/incoming/users/GuildMembershipsMessageEvent';
import type {WiredStyle} from './uibuilder/styles/WiredStyle';
import type {PresetManager} from './uibuilder/PresetManager';

/**
 * IUserDefinedRoomEventsCtrl — the wired-setup controller contract (the "wiredCtrl").
 *
 * Name derived: the AS3 interface is obfuscated as `_SafeCls_2147` and has no counterpart in the
 * older vortex-flash-client; the name is derived from its concrete implementer
 * `wired_setup/UserDefinedRoomEventsCtrl`.
 *
 * Several members reference wired types that are not ported yet (Bloc B/C/D). Their signatures are
 * declared faithfully but typed loosely (`unknown`) with a port-gap marker naming the real AS3 type,
 * rather than omitted — see .claude/rules/30-as3-traceability.md.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/roomevents/wired_setup/_SafeCls_2147.as
 */
export interface IUserDefinedRoomEventsCtrl
{
    // AS3: _SafeCls_2147.as::stuffAdded()
    stuffAdded(id: number): void;

    // AS3: _SafeCls_2147.as::stuffSelected()
    stuffSelected(id: number): void;

    // AS3: _SafeCls_2147.as::stuffRemoved()
    stuffRemoved(id: number): void;

    // AS3: _SafeCls_2147.as::getStuffIds()
    getStuffIds(): number[];

    // AS3: _SafeCls_2147.as::getStuffIds2()
    getStuffIds2(): number[];

    // AS3: _SafeCls_2147.as::clearStuffPicks()
    clearStuffPicks(): void;

    // AS3: _SafeCls_2147.as::resetToDefault()
    resetToDefault(): void;

    // AS3: _SafeCls_2147.as::createClipboardCopy()
    createClipboardCopy(): void;

    // AS3: _SafeCls_2147.as::pasteFromClipboard()
    pasteFromClipboard(): void;

    // AS3: _SafeCls_2147.as::hasCurrentElementInClipboard()
    hasCurrentElementInClipboard(): boolean;

    // AS3: _SafeCls_2147.as::get/set activeFurniPicks()
    activeFurniPicks: number;

    // AS3: _SafeCls_2147.as::resizeFrame()
    resizeFrame(): void;

    // AS3: _SafeCls_2147.as::setMergedSourceType()
    setMergedSourceType(a: number, b: number): void;

    // AS3: _SafeCls_2147.as::updateSourceContainer()
    updateSourceContainer(a: number, b: number): void;

    // AS3: _SafeCls_2147.as::get hidePickFurniInstructions()
    readonly hidePickFurniInstructions: boolean;

    // AS3: _SafeCls_2147.as::close()
    close(): void;

    // AS3: _SafeCls_2147.as::prepareForUpdate()
    prepareForUpdate(def: Triggerable): void;

    // AS3: _SafeCls_2147.as::get isUsingAdvancedSettings()
    readonly isUsingAdvancedSettings: boolean;

    // AS3: _SafeCls_2147.as::get wiredStyle()
    readonly wiredStyle: WiredStyle;

    // AS3: _SafeCls_2147.as::get presetManager()
    readonly presetManager: PresetManager;

    // AS3: _SafeCls_2147.as::getStyleByName()
    getStyleByName(name: string): WiredStyle;

    // AS3: _SafeCls_2147.as::setPreferredWiredStyleByName()
    setPreferredWiredStyleByName(name: string): void;

    // AS3: _SafeCls_2147.as::onSaveFailure()
    onSaveFailure(): void;

    // AS3: _SafeCls_2147.as::onSaveSuccess()
    onSaveSuccess(): void;

    // AS3: _SafeCls_2147.as::update()
    update(a?: number, b?: number): void;

    // AS3: _SafeCls_2147.as::onGuildMemberships()
    onGuildMemberships(event: GuildMembershipsMessageEvent): void;

    // AS3: _SafeCls_2147.as::clearCache()
    clearCache(): void;

    // AS3: _SafeCls_2147.as::hasUIOpen()
    hasUIOpen(): boolean;

    /** AIR-only, and the last member the interface gained: the id of the furni being edited. */
    // AS3: sources/AIR-1.0.31/src/com/sulake/habbo/roomevents/wired_setup/_SafeCls_2229.as::getCurrentWiredId()
    getCurrentWiredId(): number;
}
