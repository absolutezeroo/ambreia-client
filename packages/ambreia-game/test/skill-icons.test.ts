import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONTENT_ICON_IMAGES, FALLBACK_SKILL, iconOf} from '../src/features/skills/contentIcons';

test('a definition\'s icon is the content\'s, the generic one when it has none', () =>
{
    assert.equal(iconOf({icon: 'rpg/skills/rogue_skill_icon_2'}, FALLBACK_SKILL), 'rpg/skills/rogue_skill_icon_2');
    assert.equal(iconOf({icon: ''}, FALLBACK_SKILL), FALLBACK_SKILL);
    assert.equal(iconOf({}, FALLBACK_SKILL), FALLBACK_SKILL);
    assert.equal(iconOf(null, FALLBACK_SKILL), FALLBACK_SKILL);
});

test('every icon the content can name is decoded at load', () =>
{
    assert.equal(CONTENT_ICON_IMAGES.length, 30 + 64);
    assert.ok(CONTENT_ICON_IMAGES.includes('rpg/skills/warrior_skill_icon_10'));
    assert.ok(CONTENT_ICON_IMAGES.includes('rpg/status-effects/icon_00'));
    assert.ok(CONTENT_ICON_IMAGES.includes('rpg/status-effects/icon_63'));
});
