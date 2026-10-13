// The login screen's parts (features/login/screen/): the sign-in flow, the remembered e-mail, the error texts.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AuthApiError} from '../src/features/login/AuthApi';
import {authErrorKey} from '../src/features/login/screen/authErrors';
import {RememberedEmail} from '../src/features/login/screen/RememberedEmail';
import {SignInFlow} from '../src/features/login/screen/SignInFlow';

test('a sign-in that works ends with the account ticket; one that fails says its code; one at a time', async () =>
{
    const tickets: string[] = [];
    const codes: string[] = [];
    const flow = new SignInFlow(async () => 'ticket-1', ticket => tickets.push(ticket), code => codes.push(code));
    let release: () => void = () => {};
    const slow = flow.run(() => new Promise<void>(resolve => { release = resolve; }));

    assert.equal(flow.busy, true);
    await flow.run(async () => { throw new Error('never runs'); });
    release();
    await slow;
    await flow.run(async () => { throw new AuthApiError('pocket.auth.login_failed'); });
    await flow.run(async () => { throw new Error('boom'); });

    assert.deepEqual(tickets, ['ticket-1']);
    assert.deepEqual(codes, ['pocket.auth.login_failed', 'unknown']);
    assert.equal(flow.busy, false);
});

test('the e-mail is remembered, forgotten, and nothing breaks where storage refuses', () =>
{
    const map = new Map<string, string>();
    const storage = {getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); }};
    const remembered = new RememberedEmail(() => storage);

    remembered.set('a@b.fr');
    assert.equal(remembered.get(), 'a@b.fr');
    remembered.set(null);
    assert.equal(remembered.get(), null);

    const refusing = new RememberedEmail(() => { throw new Error('SecurityError'); });

    refusing.set('a@b.fr');
    assert.equal(refusing.get(), null);
});

test('a server or form code reads as its text; an unknown one as the generic error', () =>
{
    assert.equal(authErrorKey('pocket.auth.invalid_login'), 'vortex.auth.error.credentials');
    assert.equal(authErrorKey('password_mismatch'), 'vortex.auth.field.mismatch');
    assert.equal(authErrorKey('http_500'), 'vortex.auth.error.unknown');
});
