// The characters screen's parts (features/character/select/): the creation flow's two requests.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RpgCharacterResultMessage} from '@ambreia/protocol/incoming/rpg/characters/RpgCharacterResultMessage';
import {RpgCharacterChooseClassMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterChooseClassMessage';
import {RpgCharacterCreateMessage} from '@ambreia/protocol/outgoing/rpg/characters/RpgCharacterCreateMessage';
import {CreationFlow} from '../src/features/character/select/CreationFlow';

const {ACTION_CREATE, ACTION_CHOOSE_CLASS, ACTION_ENTER_WORLD} = RpgCharacterResultMessage;
const result = (action: number, code: string, playerId = 0) => new RpgCharacterResultMessage(action, code, playerId);
const draft = (playerId = 0) => ({playerId, name: 'Lyra', figure: 'hd-180-1', gender: 'F', classId: 'class.mage'});

test('a new character is created, then given its class once the server says it exists', () =>
{
    const sent: object[] = [];
    const flow = new CreationFlow(message => sent.push(message));

    flow.submit(draft());
    assert.deepEqual(sent, [new RpgCharacterCreateMessage('Lyra', 'hd-180-1', 'F')]);

    assert.deepEqual(flow.result(result(ACTION_CREATE, 'ok', 42)), {kind: 'classing', playerId: 42});
    assert.deepEqual(sent[1], new RpgCharacterChooseClassMessage(42, 'class.mage'));

    assert.deepEqual(flow.result(result(ACTION_CHOOSE_CLASS, 'ok', 42)), {kind: 'done', playerId: 42, refusal: null});
});

test('a starter character only chooses its class', () =>
{
    const sent: object[] = [];
    const flow = new CreationFlow(message => sent.push(message));

    flow.submit(draft(7));
    assert.deepEqual(sent, [new RpgCharacterChooseClassMessage(7, 'class.mage')]);
    assert.deepEqual(flow.result(result(ACTION_CHOOSE_CLASS, 'class.unknown', 7)), {kind: 'done', playerId: 7, refusal: 'class.unknown'});
});

test('a refused creation goes back to the wizard; only a refusal it cannot show on the name step is an alert', () =>
{
    const flow = new CreationFlow(() => true);

    flow.submit(draft());
    assert.deepEqual(flow.result(result(ACTION_CREATE, 'character.name_taken')), {kind: 'refused', code: 'character.name_taken', alert: false});
    assert.deepEqual(flow.result(result(ACTION_CREATE, 'rate_limited')), {kind: 'refused', code: 'rate_limited', alert: true});
});

test('an entry into the world is not the flow\'s', () =>
{
    assert.deepEqual(new CreationFlow(() => true).result(result(ACTION_ENTER_WORLD, 'ok', 3)), {kind: 'ignored'});
});
