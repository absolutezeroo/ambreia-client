import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findReleaseFile, inlineHeaders, releaseModule} from './vite-plugin-release.mjs';

const release = {
    revision: 'AMBREIA-202610081530',
    incoming: new Map([['AuthenticationOKMessageComposer', 412]]),
    outgoing: new Map([['SSOTicketMessageEvent', 1873]])
};

test('header names become numbers', () =>
{
    assert.equal(
        inlineHeaders('a.set(Outgoing.SSOTicketMessageEvent, X); b(Incoming.AuthenticationOKMessageComposer);', release, 'f.ts'),
        'a.set(1873, X); b(412);'
    );
});

test('a name the release does not have fails the build, naming file and message', () =>
{
    assert.throws(() => inlineHeaders('x(Outgoing.GoneMessageEvent)', release, 'src/f.ts'), /src\/f\.ts.*Outgoing\.GoneMessageEvent.*AMBREIA-202610081530/);
});

test('the headers module of a release build carries the revision and no name', () =>
{
    const module = releaseModule(release);

    assert.match(module, /export const REVISION = "AMBREIA-202610081530";/);
    assert.doesNotMatch(module, /SSOTicketMessageEvent|AuthenticationOKMessageComposer/);
});

test('AMBREIA_RELEASE names the table outright', () =>
{
    assert.equal(findReleaseFile({env: {AMBREIA_RELEASE: '/tmp/r.json'}, repoRoot: '/nowhere'}), '/tmp/r.json');
});

test('no table anywhere fails the build with how to get one', () =>
{
    assert.throws(() => findReleaseFile({env: {VORTEX_EMULATOR_DIR: '/nowhere/emulator'}, repoRoot: '/nowhere'}), /revision-new\.mjs/);
});
