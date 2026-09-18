// The site's own bitmaps, fetched from habbo.com. `*.png` is gitignored repo-wide like every other
// dump-derived asset, but .gitignore un-ignores THIS directory
// (`!packages/vortex-web/src/assets/*.png`) — so what this tool writes is committed, and a fetched
// asset that is left untracked is a blank box for everybody else. Vite leaves an unresolvable
// `new URL('../assets/x.png', import.meta.url)` as a literal string rather than failing, so the
// miss builds green and is reported nowhere.
//
//   node tools/fetch-assets.mjs
//
// The sprite sheet is the important one: `src/lib/sprite.js` is nothing but coordinates INTO it, and
// those coordinates are read off `sources/app.5ac3d2f8.css`. If habbo.com ever ships a new sheet the
// hash below changes, the coordinates move with it, and both have to be updated together — which is
// why the hash is pinned here rather than resolved at fetch time.
//
// tools/fetch-web-pages.mjs handles a different set: the images the CMS pages reference, which land
// in public/webpages/.
import {writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const BASE = 'https://images.habbo.com/habbo-web/america/fr/assets/images';
const OUT = join(ROOT, 'src', 'assets');

// local name -> remote path. The hashes are this build's; see the note above.
const ASSETS = {
    // The one everything else depends on — logo, navigation icons, purse, user menu, socials,
    // status marks, the appart placeholder, the eye, the tick. Indexed by src/lib/sprite.js.
    'sprite.png': 'sprite.275ed2fd.png',

    // The shop's price ribbon (104x146), which the credit tiles hang off their top-left corner.
    'price_tag.png': 'shop/price_tag.12f17d20.png',

    // The signed-out front page's artwork (849x512), `.register-banner__hotel::after`.
    'hotel.png': 'backgrounds/hotel.c5bc8f85.png',

    // Section illustrations: the appart/photo galleries' header band, the avatar-create modal, the
    // registration page's right column.
    'teaser_channels.png': 'teaser_stories_channels.36d165fe.png',
    'teaser_baghead.png': 'teaser_baghead.6244c397.png',
    'teaser_registration.png': 'teaser_registration.171e1aec.png',

    // Frank, three times: shrugging beside every empty result (`habbo-empty-results::after`, 64px),
    // asleep on the hotel-closed box (`.hotel-closed::before`, 118x88), and holding a magnifying
    // glass on the 404 (`.not-found__content::before`, 132x115).
    'teaser_frank_unsure.png': 'teaser_frank_unsure.1bb317b2.png',
    'teaser_frank_closed.png': 'teaser_frank_closed.88816de8.png',
    'teaser_frank_looking.png': 'teaser_frank_looking.374ad9d0.png',

    // The band behind a profile's name and motto (`.profile__header`, drawn `left bottom/100%` and
    // `image-rendering: pixelated` — it is a room shot, so smoothing it turns the pixels to mush).
    'profile_header.png': 'backgrounds/profile.69262798.png',

    // The key over "L'accès à l'appart est restreint." (`.room-restricted__content::before`,
    // 264x212, centred with 12px under it).
    'room_key.png': 'room_key.6e69d1d8.png',

    // The two illustrations of the /habbo-nft section, one per tab. ABSOLUTE, because they are not
    // part of the web app's asset bundle: habbo.com's own NFT pages pull them from the c_images host
    // inside their CMS fragments (`habbo_nft/nft_furni_and_clothing`, `habbo_nft/habbo_avatars`).
    // They carry no hash there, so there is nothing to pin and nothing that moves under us.
    //
    // The pictures are all this port takes from those pages. Their TEXT describes Immutable,
    // OpenSea, TokenTrove and an avatar collection, none of which this hotel has — see pages/nft/.
    'nft_furni.png': 'https://images.habbo.com/c_images/nft/nft_furni.png',
    'nft_avatars.png': 'https://images.habbo.com/c_images/nft/nft_avatars.png',

    // The four profile-card illustrations.
    'teaser_profile_badges.png': 'teaser_profile_badges.b20597b3.png',
    'teaser_profile_friends.png': 'teaser_profile_friends.45ec1e42.png',
    'teaser_profile_groups.png': 'teaser_profile_groups.35d707e7.png',
    'teaser_profile_rooms.png': 'teaser_profile_rooms.115df3aa.png',
};

mkdirSync(OUT, {recursive: true});

let bytes = 0;

for(const [name, remote] of Object.entries(ASSETS))
{
    // An absolute value is taken as-is: a couple of these live on the c_images host rather than in
    // the web app's hashed asset bundle.
    const response = await fetch(remote.startsWith('https://') ? remote : `${BASE}/${remote}`);

    if(!response.ok)
    {
        throw new Error(`${response.status} ${remote}`);
    }

    const body = Buffer.from(await response.arrayBuffer());

    writeFileSync(join(OUT, name), body);
    bytes += body.length;
}

process.stdout.write(`${Object.keys(ASSETS).length} assets, ${Math.round(bytes / 1024)} KB -> src/assets/\n`);
