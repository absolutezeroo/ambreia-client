/**
 * One playable sound instance — a generic effect or a pitched sample.
 *
 * The class name is recovered from `PRODUCTION-201601012205-226667486`, where this
 * interface is unobfuscated as `IHabboSound`; WIN63 has it as `_SafeCls_2097` but keeps
 * every member name readable.
 *
 * AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/sound/_SafeCls_2097.as
 */
export interface IHabboSound
{
    // AS3: .../sound/_SafeCls_2097.as::play()
    play(startPosition?: number): boolean;

    // AS3: .../sound/_SafeCls_2097.as::stop()
    stop(): boolean;

    // AS3: .../sound/_SafeCls_2097.as::get volume()
    get volume(): number;

    // AS3: .../sound/_SafeCls_2097.as::set volume()
    set volume(value: number);

    // AS3: .../sound/_SafeCls_2097.as::get position()
    get position(): number;

    // AS3: .../sound/_SafeCls_2097.as::set position()
    set position(value: number);

    // AS3: .../sound/_SafeCls_2097.as::get length()
    get length(): number;

    // AS3: .../sound/_SafeCls_2097.as::get ready()
    get ready(): boolean;

    // AS3: .../sound/_SafeCls_2097.as::get finished()
    get finished(): boolean;

    // AS3: .../sound/_SafeCls_2097.as::get fadeOutSeconds()
    get fadeOutSeconds(): number;

    // AS3: .../sound/_SafeCls_2097.as::set fadeOutSeconds()
    set fadeOutSeconds(value: number);

    // AS3: .../sound/_SafeCls_2097.as::get fadeInSeconds()
    get fadeInSeconds(): number;

    // AS3: .../sound/_SafeCls_2097.as::set fadeInSeconds()
    set fadeInSeconds(value: number);
}
