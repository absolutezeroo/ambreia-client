#!/usr/bin/env node
// Rewrites `offerid` / `rentofferid` in furnidata from THIS hotel's catalogue.
//
// ## Why this exists
//
// `furnidata.offerid` is not a Habbo-wide identifier. It is the hotel's own
// `catalog_offers.id`, and the shipped furnidata carries habbo.com's numbering. Ours comes out
// of `tools/catalog_converter`, which writes Arcturus's row `id` into `catalog_offers.id` (the
// input's own `offer_id` column is read and never used). The two numberings agree for 39,395 of
// the 79,542 rows by coincidence and disagree for the other 40,147 - so half the catalogue's
// search results resolve to a stranger.
//
// It is only ever a stranger, never an error, because every id in the range is *valid*:
//
//   HabboCatalog.createSearchResultOffer()  looks the furni's `purchaseOfferId` up in
//   CatalogNavigator's `_offersToNodes`, which is built from each page's `offerIds` - and those
//   are `catalog_offers.id`. A furnidata offerid of 18 therefore opens whatever our offer 18
//   sells. Searching "Dining Chair" (`chair_polyfon`, furnidata id 18, offerid 18) lands on
//   Arcturus row 18, which sells `stand_polyfon_z` - the Z Shelf. Its real offer is row 12.
//
// So the mapping has to be rebuilt from the catalogue we actually ship, which is what a real
// hotel's CMS does. No schema change, no migration; re-run this whenever the catalogue changes.
//
// ## What it cannot know, and how it decides
//
// A furni sold on several pages has several offers (1,713 offer ids are shared by more than one
// Arcturus row). furnidata has room for exactly one, so one has to be chosen. The order is
// deliberate and every step is a tie-break, never a filter:
//
//   1. visible offers before hidden ones   - a hidden page is not somewhere search should land
//   2. fewest products in the offer        - the plain single item before the bundle that
//                                            happens to contain it
//   3. lowest offer id                     - stable across runs, so a re-run is a no-op
//
// A furni no offer sells gets `-1`, which is furnidata's own "not for sale": leaving habbo.com's
// number there is what makes search offer to buy something this hotel does not stock.
//
// `rentofferid` gets the same treatment against the same table. Our catalogue has no rent
// concept at all, so in practice every one of them is cleared - but the rule is written as
// "clear the ids that name no offer of ours", not "clear them all", so it stays correct the day
// rent offers exist.
//
// ## Usage
//
//   node tools/relink-furnidata-offers.mjs                 # report only, writes nothing
//   node tools/relink-furnidata-offers.mjs --write
//   node tools/relink-furnidata-offers.mjs --furnidata <path> --catalog <dir> --write
//
// `--catalog` is the catalog_converter output directory (catalog_offers.sql,
// catalog_products.sql, furniture_definitions.sql). Those files are the seed the emulator's
// database was loaded from; if the live catalogue has been edited since, dump the three tables
// over them first, or this rebuilds against a stale picture.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEFAULT_FURNIDATA = 'C:/Laragon/www/vortex-assets/gamedata/furnidata_json.json';
const DEFAULT_CATALOG = resolve(
  process.cwd(),
  '../../../vortex-emulator/tools/catalog_converter/output'
);

// furniture_definitions.type carries catalog_converter's PRODUCT_TYPE_MAP int, not Arcturus's
// letter: 0 = 's' (floor, roomitemtypes), 1 = 'i' (wall, wallitemtypes). The other three
// (effect, badge, robot) have no furnidata entry.
const TYPE_FLOOR = 0;
const TYPE_WALL = 1;

function parseArgs(argv) {
  const args = { furnidata: DEFAULT_FURNIDATA, catalog: DEFAULT_CATALOG, write: false, selftest: false };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--write') args.write = true;
    else if (argv[i] === '--selftest') args.selftest = true;
    else if (argv[i] === '--furnidata') args.furnidata = argv[++i];
    else if (argv[i] === '--catalog') args.catalog = argv[++i];
    else {
      console.error(`relink-furnidata-offers: option inconnue "${argv[i]}"`);
      process.exit(2);
    }
  }
  return args;
}

// A character scanner rather than a regex per row. The rows carry quoted names with commas and
// apostrophes in them (`'Bar, Ltd.'`, `'Pete\'s'`) and unquoted `NOW()` calls whose parens would
// close a naive `\((.*?)\)` match early, so both quoting and nesting have to be tracked.
function parseInsertRows(sql, table) {
  const marker = new RegExp(`INSERT(?:\\s+IGNORE)?\\s+INTO\\s+\`${table}\`[^)]*\\)\\s*VALUES`, 'g');
  const rows = [];

  while (marker.exec(sql) !== null) {
    let i = marker.lastIndex;
    let row = null;
    let field = '';
    let depth = 0;
    let quoted = false;

    for (; i < sql.length; i++) {
      const c = sql[i];

      if (quoted) {
        // Both escape styles appear in the dumps: MySQL's backslash and SQL's doubled quote.
        if (c === '\\') {
          field += sql[++i];
        } else if (c === "'" && sql[i + 1] === "'") {
          field += "'";
          i++;
        } else if (c === "'") {
          quoted = false;
        } else {
          field += c;
        }
        continue;
      }

      if (c === "'") {
        quoted = true;
      } else if (c === '(') {
        if (depth++ === 0) {
          row = [];
          field = '';
          continue;
        }
        field += c;
      } else if (c === ')') {
        if (--depth === 0) {
          row.push(field.trim());
          rows.push(row);
          row = null;
          continue;
        }
        field += c;
      } else if (c === ',' && depth === 1) {
        row.push(field.trim());
        field = '';
      } else if (depth === 0) {
        // Between tuples: a `;` ends this INSERT, anything else is separator whitespace.
        if (c === ';') break;
        if (!/\s|,/.test(c)) break;
      } else {
        field += c;
      }
    }

    marker.lastIndex = i;
  }

  return rows;
}

const toInt = (v) => (v === 'NULL' || v === '' || v == null ? null : Number.parseInt(v, 10));

function readCatalog(dir) {
  const need = ['catalog_offers.sql', 'catalog_products.sql', 'furniture_definitions.sql'];

  for (const f of need) {
    if (!existsSync(join(dir, f))) {
      console.error(`relink-furnidata-offers: ${f} introuvable dans ${dir}`);
      console.error('Passer --catalog <dossier de sortie de catalog_converter>.');
      process.exit(2);
    }
  }

  // furniture_definitions: id, sprite_id, name, type, ...
  const definitions = new Map();
  for (const r of parseInsertRows(readFileSync(join(dir, 'furniture_definitions.sql'), 'utf8'), 'furniture_definitions')) {
    definitions.set(toInt(r[0]), { spriteId: toInt(r[1]), type: toInt(r[3]) });
  }

  // catalog_offers: id, page_id, localization_id, cost_credits, cost_currency,
  //                 currency_type_id, can_gift, can_bundle, club_level, discount_percent, visible
  const offerVisible = new Map();
  for (const r of parseInsertRows(readFileSync(join(dir, 'catalog_offers.sql'), 'utf8'), 'catalog_offers')) {
    offerVisible.set(toInt(r[0]), toInt(r[10]) === 1);
  }

  // catalog_products: id, offer_id, product_type, definition_id, ...
  const products = [];
  const productsPerOffer = new Map();
  for (const r of parseInsertRows(readFileSync(join(dir, 'catalog_products.sql'), 'utf8'), 'catalog_products')) {
    const offerId = toInt(r[1]);
    const definitionId = toInt(r[3]);

    productsPerOffer.set(offerId, (productsPerOffer.get(offerId) ?? 0) + 1);
    if (definitionId != null) products.push({ offerId, definitionId });
  }

  return { definitions, offerVisible, products, productsPerOffer };
}

// key = `${type}:${spriteId}`; floor and wall are separate sprite-id namespaces.
function buildOfferIndex({ definitions, offerVisible, products, productsPerOffer }) {
  const candidates = new Map();

  for (const { offerId, definitionId } of products) {
    const def = definitions.get(definitionId);
    if (!def || def.spriteId == null) continue;
    if (def.type !== TYPE_FLOOR && def.type !== TYPE_WALL) continue;

    const key = `${def.type}:${def.spriteId}`;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push(offerId);
  }

  const chosen = new Map();

  for (const [key, offers] of candidates) {
    const unique = [...new Set(offers)];

    unique.sort((a, b) => {
      const visA = offerVisible.get(a) === true;
      const visB = offerVisible.get(b) === true;
      if (visA !== visB) return visA ? -1 : 1;

      const sizeA = productsPerOffer.get(a) ?? 1;
      const sizeB = productsPerOffer.get(b) ?? 1;
      if (sizeA !== sizeB) return sizeA - sizeB;

      return a - b;
    });

    chosen.set(key, unique[0]);
  }

  return chosen;
}

// The two pieces that are not a straight copy: the tuple scanner (quotes, escapes, nested
// `NOW()`) and the tie-break order. `node tools/relink-furnidata-offers.mjs --selftest`.
function selftest() {
  const assert = (cond, what) => {
    if (!cond) {
      console.error(`selftest FAILED: ${what}`);
      process.exit(1);
    }
  };

  const sql = `INSERT INTO \`t\` (\`a\`, \`b\`, \`c\`) VALUES
  (1, 'Bar, Ltd.', NOW()),
  (2, 'Pete\\'s', NULL),
  (3, 'it''s', NOW());`;
  const rows = parseInsertRows(sql, 't');

  assert(rows.length === 3, `3 tuples, got ${rows.length}`);
  assert(rows[0][1] === 'Bar, Ltd.', 'a comma inside quotes does not split the tuple');
  assert(rows[0][2] === 'NOW()', 'the parens of NOW() do not close the tuple');
  assert(rows[1][1] === "Pete's", 'backslash escape');
  assert(rows[2][1] === "it's", 'doubled-quote escape');
  assert(rows[1][2] === 'NULL', 'NULL stays the literal');

  // Same sprite sold four ways: hidden, bundle, and two plain offers. Wanted: 12 - visible
  // beats hidden, single beats bundle, and the lower id breaks the last tie.
  const index = buildOfferIndex({
    definitions: new Map([[18, { spriteId: 18, type: TYPE_FLOOR }]]),
    offerVisible: new Map([[7, false], [12, true], [30, true], [40, true]]),
    products: [7, 12, 30, 40].map((offerId) => ({ offerId, definitionId: 18 })),
    productsPerOffer: new Map([[7, 1], [12, 1], [30, 3], [40, 1]]),
  });

  assert(index.get(`${TYPE_FLOOR}:18`) === 12, `tie-break picks 12, got ${index.get(`${TYPE_FLOOR}:18`)}`);
  assert(index.get(`${TYPE_WALL}:18`) === undefined, 'floor and wall sprite ids do not collide');

  console.log('selftest OK');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.selftest) {
    selftest();
    return;
  }

  if (!existsSync(args.furnidata)) {
    console.error(`relink-furnidata-offers: furnidata introuvable (${args.furnidata}).`);
    process.exit(2);
  }

  const catalog = readCatalog(args.catalog);
  const chosen = buildOfferIndex(catalog);
  const known = catalog.offerVisible;

  const furnidata = JSON.parse(readFileSync(args.furnidata, 'utf8'));

  // The shipped file nests (`{roomitemtypes: {furnitype: [...]}}`); catalog_converter's own
  // furnidata.json is flat (`{roomitemtypes: [...]}`). Accept either.
  const sectionOf = (name) => {
    const s = furnidata[name];
    if (Array.isArray(s)) return s;
    if (s && Array.isArray(s.furnitype)) return s.furnitype;
    return null;
  };

  const sections = [
    ['roomitemtypes', TYPE_FLOOR, sectionOf('roomitemtypes')],
    ['wallitemtypes', TYPE_WALL, sectionOf('wallitemtypes')],
  ];

  const stats = {
    total: 0, alreadyRight: 0, repointed: 0, clearedOffer: 0, clearedRent: 0, noSpriteId: 0,
  };

  for (const [label, type, items] of sections) {
    if (!items) {
      console.error(`relink-furnidata-offers: section "${label}" absente ou de forme inattendue.`);
      process.exit(2);
    }

    for (const item of items) {
      stats.total++;

      const spriteId = typeof item.id === 'number' ? item.id : Number.parseInt(item.id, 10);
      if (!Number.isInteger(spriteId)) {
        stats.noSpriteId++;
        continue;
      }

      const offerId = chosen.get(`${type}:${spriteId}`) ?? -1;

      if (item.offerid === offerId) stats.alreadyRight++;
      else if (offerId === -1) stats.clearedOffer++;
      else stats.repointed++;

      item.offerid = offerId;

      // A rent id that names no offer of ours resolves to a stranger exactly the way offerid did.
      if (typeof item.rentofferid === 'number' && item.rentofferid !== -1 && !known.has(item.rentofferid)) {
        item.rentofferid = -1;
        stats.clearedRent++;
      }
    }
  }

  console.log(`catalogue        : ${args.catalog}`);
  console.log(`furnidata        : ${args.furnidata}`);
  console.log(`offres connues   : ${known.size}`);
  console.log(`furni vendables  : ${chosen.size} (sprite id distincts couverts par une offre)`);
  console.log('');
  console.log(`furnitypes       : ${stats.total}`);
  console.log(`  deja correct   : ${stats.alreadyRight}`);
  console.log(`  repointe       : ${stats.repointed}`);
  console.log(`  mis a -1       : ${stats.clearedOffer}  (aucune offre ne les vend)`);
  console.log(`  sans id sprite : ${stats.noSpriteId}`);
  console.log(`rentofferid nettoyes : ${stats.clearedRent}`);

  if (!args.write) {
    console.log('\n(lecture seule - relancer avec --write pour appliquer)');
    return;
  }

  const backup = `${args.furnidata}.bak`;
  if (!existsSync(backup)) copyFileSync(args.furnidata, backup);

  writeFileSync(args.furnidata, JSON.stringify(furnidata), 'utf8');
  console.log(`\necrit. Sauvegarde : ${backup}`);
}

main();
