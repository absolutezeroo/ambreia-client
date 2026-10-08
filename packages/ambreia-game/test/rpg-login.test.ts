// features/login and the creation screen's rules (F3a §4, §6.4): the web API's routes and errors,
// the registration form checked as the server will, the name rules and the figure edits.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AuthApi, AuthApiError} from '../src/features/login/AuthApi';
import {passwordStrength, registerProblem} from '../src/features/login/AuthForm';
import {isNameValid, nameRules, partColor, partSet, withPartColor, withPartSet} from '../src/features/character/CharacterLook';

function fakeFetch(answers: Array<{status: number; body?: unknown}>, calls: Array<{url: string; init?: RequestInit}>): typeof fetch
{
    return (async (url: string, init?: RequestInit) =>
    {
        calls.push({url, init});
        const answer = answers.shift()!;

        return new Response(answer.body === undefined ? 'Too many' : JSON.stringify(answer.body), {status: answer.status});
    }) as typeof fetch;
}

test('AuthApi signs in, then asks for the account ticket', async () =>
{
    const calls: Array<{url: string; init?: RequestInit}> = [];
    const api = new AuthApi('/webapi', fakeFetch([{status: 200, body: {requiresOnboarding: false}}, {status: 200, body: {ssoToken: 'abc'}}], calls));

    await api.login('a@b.fr', 'secret123');
    assert.equal(await api.accountTicket(), 'abc');
    assert.equal(calls[0].url, '/webapi/api/public/authentication/login');
    assert.deepEqual(JSON.parse(calls[0].init!.body as string), {email: 'a@b.fr', password: 'secret123'});
    assert.equal(calls[1].url, '/webapi/api/ssotoken');
    assert.equal(calls[1].init!.method, 'GET');
});

test('AuthApi reports the server\'s code, or the status when there is no JSON', async () =>
{
    const api = new AuthApi('/webapi', fakeFetch([{status: 401, body: {error: 'pocket.auth.login_failed'}}, {status: 429}], []));

    await assert.rejects(api.login('a@b.fr', 'x'), (error: AuthApiError) => error.code === 'pocket.auth.login_failed');
    await assert.rejects(api.register('a@b.fr', 'x', 'x'), (error: AuthApiError) => error.code === 'rate_limited');
});

test('registration is checked as the server will', () =>
{
    const form = {email: 'a@b.fr', password: 'Secret12', confirm: 'Secret12', acceptTerms: true, acceptPrivacy: true};

    assert.equal(registerProblem(form), null);
    assert.equal(registerProblem({...form, email: 'nope'}), 'email_invalid');
    assert.equal(registerProblem({...form, password: 'short', confirm: 'short'}), 'pocket.auth.password_too_short');
    assert.equal(registerProblem({...form, confirm: 'Secret13'}), 'password_mismatch');
    assert.equal(registerProblem({...form, acceptPrivacy: false}), 'terms_not_accepted');
    assert.deepEqual(['short', 'abcdefgh', 'abcdefG1', 'abcdefG1!xyz'].map(passwordStrength), [0, 1, 2, 3]);
});

test('names follow the server\'s shape', () =>
{
    assert.equal(isNameValid('Aéris_2'), true);
    assert.equal(isNameValid('ab'), false);
    assert.equal(isNameValid('a'.repeat(16)), false);
    assert.deepEqual(nameRules('Bad name!'), {length: true, chars: false, spaces: false});
});

test('figure edits keep the other parts and colours', () =>
{
    const figure = 'hr-115-42.hd-195-19.ch-3030-82';

    assert.equal(withPartSet(figure, 'hr', 3, 1), 'hr-3-42.hd-195-19.ch-3030-82');
    assert.equal(withPartSet(figure, 'lg', 275, 1408), 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408');
    assert.equal(withPartColor(figure, 'hd', 8), 'hr-115-42.hd-195-8.ch-3030-82');
    assert.equal(withPartColor(figure, 'sh', 8), figure);
    assert.equal(partSet(figure, 'ch'), 3030);
    assert.equal(partColor(figure, 'hr'), 42);
});
