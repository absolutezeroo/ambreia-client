#!/usr/bin/env node
/**
 * Asks a running imager for one of everything and checks it got an image back.
 *
 * This is the check the room pipeline needs, and it is deliberately end-to-end rather than a
 * unit test of any one function. Every failure this package has actually had was a silent one —
 * a blank floor, a placeholder box, a boot that hung with six successful downloads behind it —
 * and none of them would have failed an assertion about a parser. What catches them is asking
 * for a picture and looking at whether one came back.
 *
 *   node tools/smoke.mjs [baseUrl] [roomId]
 *
 * Room cases are skipped, not failed, when the service reports no database, or when the room id
 * does not exist on this hotel: `?figure=` and the furniture routes are meant to work without a
 * database, and which rooms exist is fixture data, not behaviour. Pass a room id that has some
 * furniture in it to make the room cases mean something.
 */
const BASE = (process.argv[2] ?? 'http://localhost:8081').replace(/\/+$/, '');
const ROOM = process.argv[3] ?? '1';

/** A PNG always starts with these eight bytes. Anything else is an error page. */
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

const health = await (await fetch(`${BASE}/health`)).json();

console.log(`health: ${JSON.stringify(health)}`);

const cases = [
    ['avatar', '/habbo-imaging/avatarimage?figure=hd-180-1.ch-210-66.lg-270-82&direction=2'],
    ['furni by class', '/habbo-imaging/furniture?class=throne&direction=2'],
    ['furni path form', '/habbo-imaging/furniture/throne.png'],
    ['furni rotated', '/habbo-imaging/furniture?class=throne&direction=4&size=l'],
    ['wall item', '/habbo-imaging/furniture?class=window_double_default'],
    ['effect alone', '/habbo-imaging/effect/1.png'],
    ['hand item alone', '/habbo-imaging/handitem/2.png'],
    ['clothing alone', '/habbo-imaging/clothing/ch-255-73.png'],
    ['clothing, uncropped', '/habbo-imaging/clothing/ch-255-73.png?crop=0'],
    ['pet by name', '/habbo-imaging/pet/dog.png'],
    ['pet by type id', '/habbo-imaging/pet?type=0&direction=4'],
    ['pet head only', '/habbo-imaging/pet/dog.png?head=1'],
    ['pet posture', '/habbo-imaging/pet/dog.png?posture=lay'],
    ['room', `/habbo-imaging/room/${ROOM}.png`, 'needsDatabase'],
    ['room, no furniture', `/habbo-imaging/room/${ROOM}.png?furni=0`, 'needsDatabase'],
    ['room, repainted', `/habbo-imaging/room/${ROOM}.png?floor=301&wall=110`, 'needsDatabase']
];

let failures = 0;

for(const [name, path, requirement] of cases)
{
    if(requirement === 'needsDatabase' && health.database !== 'up')
    {
        console.log(`SKIP ${name} — no database`);

        continue;
    }

    const response = await fetch(BASE + path);
    const body = Buffer.from(await response.arrayBuffer());

    // A 404 on a room is a fixture problem (this hotel may have no room 1), not a code
    // problem — the route answered, and it answered in the shape it should.
    if(response.status === 404 && path.startsWith('/habbo-imaging/room/'))
    {
        console.log(`SKIP ${name} — ${body.toString('utf8')}`);

        continue;
    }

    if(response.status !== 200 || !body.subarray(0, 8).equals(PNG_MAGIC))
    {
        console.error(`FAIL ${name} — ${response.status} ${body.toString('utf8').slice(0, 200)}`);
        failures++;

        continue;
    }

    console.log(`ok   ${name} — ${body.length} bytes`);
}

// Errors have to be shaped too: a typo should 404, not answer 200 with a placeholder box.
const missing = await fetch(`${BASE}/habbo-imaging/furniture?class=not_a_real_furni_name`);

if(missing.status !== 404)
{
    console.error(`FAIL unknown furni answered ${missing.status}, expected 404`);
    failures++;
}
else
{
    console.log('ok   unknown furni 404s');
}

const missingPet = await fetch(`${BASE}/habbo-imaging/pet/not_a_real_pet.png`);

if(missingPet.status !== 404)
{
    console.error(`FAIL unknown pet answered ${missingPet.status}, expected 404`);
    failures++;
}
else
{
    console.log('ok   unknown pet 404s');
}

// A part that draws nothing must say so. `/avatarimage` answers 200 with a 1x1 transparent PNG
// here — `getCroppedImage()`'s own empty-bounds fallback — and a caller walking figuredata
// cannot tell that apart from a part that is simply invisible at this direction.
const missingPart = await fetch(`${BASE}/habbo-imaging/clothing/ch-99999-1.png`);

if(missingPart.status !== 400)
{
    console.error(`FAIL clothing with no art answered ${missingPart.status}, expected 400`);
    failures++;
}
else
{
    console.log('ok   clothing with no art 400s');
}

/**
 * The trap this route exists to close, asserted rather than described.
 *
 * `AvatarRenderManager.createAvatarImage()` runs `validateAvatarFigure()` only when it is given
 * a gender, and that fills in the default head, chest and legs for every missing mandatory set
 * type — so on `/avatarimage` the same figure is a bare shirt without `gender=` and a whole
 * dressed avatar with it. `/clothing/` drops the parameter; these two responses must be the same
 * bytes, and if this ever fails the drop has been lost.
 */
const [bare, gendered] = await Promise.all([
    fetch(`${BASE}/habbo-imaging/clothing/ch-255-73.png`).then((r) => r.arrayBuffer()),
    fetch(`${BASE}/habbo-imaging/clothing/ch-255-73.png?gender=M`).then((r) => r.arrayBuffer())
]);

if(!Buffer.from(bare).equals(Buffer.from(gendered)))
{
    console.error(`FAIL clothing changed with gender= (${bare.byteLength} vs ${gendered.byteLength} bytes)`);
    failures++;
}
else
{
    console.log('ok   clothing ignores gender=');
}

if(failures > 0)
{
    console.error(`\n${failures} failed`);
    process.exit(1);
}

console.log('\nall good');
