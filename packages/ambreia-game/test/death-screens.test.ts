// M1d §4: the KO screen counts to the auto-release (none once the player waits), the offer counts to
// its expiry, and a choice is sent once per KO whatever the clicks.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatDuration, koTimer, offerTimer} from '../src/features/combat/views/deathTimers';
import {OnceChoice} from '../src/features/combat/views/OnceChoice';

test('a duration reads in minutes and seconds, seconds alone under a minute, never negative', () =>
{
    assert.equal(formatDuration(155_000), '2 min 35 s');
    assert.equal(formatDuration(60_000), '1 min 00 s');
    assert.equal(formatDuration(9_400), '10 s');
    assert.equal(formatDuration(-5), '0 s');
});

test('the KO timer runs to the auto-release, and stops once the player waits', () =>
{
    assert.equal(koTimer({kind: 'ko', autoReleaseAt: 61_000, waiting: false, offer: null}, 1_000), 60_000);
    assert.equal(koTimer({kind: 'ko', autoReleaseAt: null, waiting: true, offer: null}, 1_000), null);
    assert.equal(koTimer({kind: 'alive'}, 1_000), null);
});

test('the offer timer gives the time left and the bar\'s share of the offer\'s whole time', () =>
{
    assert.deepEqual(offerTimer({casterObjectId: 2, healthPercent: 35, expiresAt: 31_000}, 16_000, 30_000), {leftMs: 15_000, fraction: 0.5});
    assert.deepEqual(offerTimer({casterObjectId: 2, healthPercent: 35, expiresAt: 31_000}, 40_000, 30_000), {leftMs: 0, fraction: 0});
});

test('each choice goes once: release or accept end the choices of the KO, a new offer can be answered again', () =>
{
    const sent: string[] = [];
    const once = new OnceChoice(choice => sent.push(choice));

    once.choose('wait');
    once.choose('wait');
    once.choose('decline');
    once.choose('decline');
    assert.deepEqual(sent, ['wait', 'decline']);

    once.newOffer();
    once.choose('accept');
    once.choose('release');
    assert.deepEqual(sent, ['wait', 'decline', 'accept'], 'standing up: nothing more');

    once.reset();
    once.choose('release');
    once.choose('release');
    assert.deepEqual(sent, ['wait', 'decline', 'accept', 'release']);
});

import {setPlatform, BROWSER_PLATFORM} from '@ambreia/common/platform/Platform';
import {CombatModel} from '../src/features/combat/CombatModel';
import {DeathScreens} from '../src/features/combat/views/DeathScreens';

let clock = 1000;

setPlatform({...BROWSER_PLATFORM, now: () => clock});

function screens(): {model: CombatModel; log: string[]; sent: string[]; ticks: Array<() => void>; screens: DeathScreens}
{
    const model = new CombatModel();
    const log: string[] = [];
    const sent: string[] = [];
    const ticks: Array<() => void> = [];
    const ko = {show: (_p: unknown, timer: number | null, waiting: boolean) => log.push(`ko ${timer} ${waiting}`), hide: () => log.push('ko hide')};
    const offer = {show: (caster: {name: string}, percent: number, left: number, fraction: number) => log.push(`offer ${caster.name} ${percent} ${left} ${fraction}`), hide: () => log.push('offer hide')};
    const deaths = new DeathScreens(model, ko, offer, new OnceChoice(choice => sent.push(choice)),
        () => ({figure: 'hd', level: 5, className: 'Mage'}),
        objectId => objectId === 2 ? {name: 'Léa', figure: 'hd', level: null} : null,
        (run) =>
        {
            ticks.push(run);

            return {clear: () => ticks.splice(ticks.indexOf(run), 1)};
        });

    return {model, log, sent, ticks, screens: deaths};
}

test('a KO shows the screen and ticks; an offer shows its panel; the vitals back hide both and stop the ticker', () =>
{
    const {model, log, ticks} = screens();

    model.setKo(60);
    assert.deepEqual(log.slice(-2), ['ko 60000 false', 'offer hide']);
    assert.equal(ticks.length, 1);

    clock = 11_000;
    ticks[0]();
    assert.equal(log.at(-2), 'ko 50000 false');

    model.setOffer(2, 35, 30_000);
    assert.equal(log.at(-1), 'offer Léa 35 30000 1');

    model.setSelfVitals(35, 100, 10, 50, false);
    assert.deepEqual(log.slice(-2), ['ko hide', 'offer hide']);
    assert.equal(ticks.length, 0);
});

test('the choices go through once; a new KO opens them again', () =>
{
    const {model, sent, screens: deaths} = screens();

    model.setKo(60);
    deaths.choose('release');
    deaths.choose('release');
    assert.deepEqual(sent, ['release']);

    model.setSelfVitals(50, 100, 10, 50, false);
    model.setKo(60);
    deaths.choose('wait');
    assert.deepEqual(sent, ['release', 'wait']);
});
