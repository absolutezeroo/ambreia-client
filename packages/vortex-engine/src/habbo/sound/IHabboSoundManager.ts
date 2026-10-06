import type EventEmitter from 'eventemitter3';
import type {IHabboSound} from './IHabboSound';

/**
 * The sound manager: three volume channels (generic effects, music, furniture) and the
 * effect cache behind `playSound()`. AS3 also hands out the music controller and loads songs;
 * the RPG fork removed jukebox music, so `musicController` and the song loader are gone.
 *
 * The class name is recovered from `PRODUCTION-201601012205-226667486`
 * (`IHabboSoundManager`); WIN63 has it as `_SafeCls_95` with every member readable.
 *
 * AS3 declares `extends IUnknown` (the DI reference-counting contract). This port has no
 * `IUnknown` interface — `Component` carries `release()`/`disposed` directly — so the
 * extends clause is dropped here, as it is on every other `I<Manager>` in this tree.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/sound/_SafeCls_95.as
 */
export interface IHabboSoundManager
{
    // AS3: .../sound/_SafeCls_95.as::get genericVolume()
    get genericVolume(): number;

    // AS3: .../sound/_SafeCls_95.as::set genericVolume()
    set genericVolume(value: number);

    // AS3: .../sound/_SafeCls_95.as::get traxVolume()
    get traxVolume(): number;

    // AS3: .../sound/_SafeCls_95.as::set traxVolume()
    set traxVolume(value: number);

    // AS3: .../sound/_SafeCls_95.as::get furniVolume()
    get furniVolume(): number;

    // AS3: .../sound/_SafeCls_95.as::set furniVolume()
    set furniVolume(value: number);

    // AS3: .../sound/_SafeCls_95.as::playSound()
    playSound(soundId: string, loops?: number): void;

    // AS3: .../sound/_SafeCls_95.as::stopSound()
    stopSound(soundId: string): void;

    // AS3: .../sound/_SafeCls_95.as::playSoundAtPitch()
    playSoundAtPitch(soundId: string, pitch: number): IHabboSound | null;

    // AS3: .../sound/_SafeCls_95.as::mute()
    mute(muted: boolean): void;

    // AS3: .../sound/_SafeCls_95.as::previewVolume()
    previewVolume(generic: number, furni: number, trax: number): void;

    // AS3: .../sound/_SafeCls_95.as::get events()
    get events(): EventEmitter;
}
