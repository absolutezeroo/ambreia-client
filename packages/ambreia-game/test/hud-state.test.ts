// The HUD's state (features/hud): what the player frame and the action bar show. The server fills
// it once the RPG network exists (F3); until then the dev hook does.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {barFill, cooldownLabel, PlayerHudState} from '../src/features/hud/PlayerHudState';

test('a bar fills in proportion, clamped, and stays empty while the maximum is unknown', () =>
{
    assert.equal(barFill(50, 100, 224), 112);
    assert.equal(barFill(150, 100, 224), 224);
    assert.equal(barFill(-5, 100, 224), 0);
    assert.equal(barFill(10, 0, 224), 0);
    assert.equal(barFill(null, null, 224), 0);
    assert.equal(barFill(1, 3, 224), 75);
});

test('a cooldown shows whole seconds left, rounded up, and nothing once over', () =>
{
    const slot = {icon: 'rpg/skills/warrior_skill_icon_1', key: '1', cooldownEnd: 10_000};

    assert.equal(cooldownLabel(slot, 7_100), '3');
    assert.equal(cooldownLabel(slot, 9_999), '1');
    assert.equal(cooldownLabel(slot, 10_000), null);
    assert.equal(cooldownLabel({icon: null, key: '2'}, 0), null);
});

test('the bar starts with six skill slots (the server bar) and four item slots, keys 1 to 0, empty', () =>
{
    const state = new PlayerHudState();

    assert.deepEqual(state.value.skills.map(slot => [slot.key, slot.icon]), [['1', null], ['2', null], ['3', null], ['4', null], ['5', null], ['6', null]]);
    assert.deepEqual(state.value.items.map(slot => slot.key), ['7', '8', '9', '0']);
});

test('an update merges and tells the view once', () =>
{
    const state = new PlayerHudState();
    let changes = 0;

    state.events.on('changed', () => changes++);
    state.update({level: 12, hp: 80, hpMax: 120});
    state.setSlot('skills', 0, {icon: 'rpg/skills/warrior_skill_icon_1'});
    state.startCooldown('skills', 0, 4_000, 1_000);

    assert.equal(changes, 3);
    assert.equal(state.value.level, 12);
    assert.equal(state.value.hp, 80);
    assert.equal(state.value.skills[0].icon, 'rpg/skills/warrior_skill_icon_1');
    assert.equal(state.value.skills[0].cooldownEnd, 5_000);
    assert.equal(state.value.mana, null);
});

test('a slot outside the bar is refused, not created', () =>
{
    assert.throws(() => new PlayerHudState().setSlot('items', 4, {icon: 'x'}), /slot 4/);
});
