import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

// Layer walls: docs/superpowers/specs/2026-10-07-client-architecture-design.md §3. Only the walls that
// already hold are listed (measured 2026-10-07); each extraction milestone J1-J6 adds its package's
// own with `wall()`. Flat config replaces a rule's options when a later block matches the same file,
// so `wall()` always carries the engine-wide wall instead of relying on the block above it.
const WALLS_SPEC = 'docs/superpowers/specs/2026-10-07-client-architecture-design.md §3';
const ENGINE_NEVER_IMPORTS_CLIENT = {
    regex: '^(@ui|@)/|(^|/)vortex-client(/|$)',
    message: `The engine never imports the client (${WALLS_SPEC}).`
};
const wall = (...patterns) => ['error', { patterns: [ENGINE_NEVER_IMPORTS_CLIENT, ...patterns] }];

export default tseslint.config(
    {
        ignores:
        [
            '**/dist/**',
            '**/node_modules/**',
            // Vendor reference dumps, never our code: the AS3 trees at the repo root.
            '**/sources/**',
            '**/*.d.ts',
            // Generated files: the fix for a generated file is never to edit it.
            '**/*.generated.ts',
            // The dev server's esbuild output of the engine (vite-plugin-engine-bundle.mjs), gitignored.
            // It held 1,821 of the 1,828 errors `eslint .` reported on 2026-10-07.
            '**/.vortex-dev/**'
        ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['packages/*/src/**/*.ts'],
        languageOptions:
        {
            globals: { ...globals.browser }
        },
        plugins: { '@stylistic': stylistic },
        rules:
        {
            '@stylistic/brace-style': ['error', 'allman', { allowSingleLine: true }],
            '@stylistic/indent': ['error', 4],
            '@stylistic/keyword-spacing': ['error', { overrides:
            {
                if: { after: false },
                for: { after: false },
                while: { after: false },
                switch: { after: false },
                catch: { after: false }
            } }],
            '@stylistic/space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
            '@stylistic/function-call-spacing': ['error', 'never'],
            '@stylistic/comma-spacing': ['error', { before: false, after: true }],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],

            'no-console': 'error',
            'no-restricted-syntax':
            [
                'error',
                { selector: 'ExportDefaultDeclaration', message: 'Named exports only — never use `export default` (docs/STYLEGUIDE.md).' },
                { selector: 'TSUnionType > TSUndefinedKeyword', message: 'Use `| null`, not `| undefined`, in type annotations (docs/STYLEGUIDE.md).' },
                // A logger name is a dotted path mirroring the module, because that is what makes
                // `__log.set('habbo.room', 'debug')` cover a subsystem rather than one class. Flat
                // names also collide silently - `Moderation` was three different files, `Navigator`
                // two. `Vortex`/`VortexMain` are the two engine entry points and *are* roots.
                {
                    selector: "CallExpression[callee.object.name='Logger'][callee.property.name='getLogger'] > Literal:not([value=/\\./]):not([value=/^(Vortex|VortexMain)$/])",
                    message: "Logger namespaces are dotted module paths - Logger.getLogger('habbo.room.RoomEngine'), not a bare class name (docs/STYLEGUIDE.md -> Logging)."
                }
            ],

            '@typescript-eslint/no-explicit-any': 'warn',
            // AS3 itself declares empty marker interfaces (e.g. `INotifyWindow extends
            // _SafeCls_1828 {}`, no members) purely for nominal identity - TS's structural typing
            // can't express that distinction, but the interface is still a faithful 1:1 port.
            '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
            // AS3-ported stub parameters (TODO(AS3) signatures kept for API-shape fidelity) and
            // caught-but-unhandled errors are conventionally prefixed `_` throughout this codebase
            // to mark them as intentionally unused - the default rule has no exception for that.
            '@typescript-eslint/no-unused-vars':
            [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
            ],
            '@typescript-eslint/naming-convention':
            [
                'error',
                { selector: 'class', format: ['PascalCase'] },
                // `declare global { interface Window { ... } }` augments the DOM's own global
                // interface - it must keep that exact name to merge, so it can't take an `I` prefix.
                { selector: 'interface', filter: { regex: '^Window$', match: true }, format: null },
                { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
                { selector: 'enumMember', format: ['PascalCase'] },
                // naming-convention resolves which selector applies by summed modifier bit-weight
                // (public=8/protected=16/private=32/static=4/readonly=2), not by array order or
                // modifier count - so the old unqualified `{static, readonly}` selector (weight 6)
                // never actually won against the single-modifier accessibility selectors below it
                // (TS treats an omitted accessibility keyword as implicit `public`, so EVERY class
                // property has one of public/protected/private set). Every AS3 constant declared
                // with an accessibility keyword (`public static readonly FOO = ...`, the norm for
                // ported AS3 constants) was silently being checked against the camelCase instance-
                // field rule instead of `UPPER_CASE`. Combining the accessibility modifier into the
                // constant selectors themselves gives each one a higher weight than its plain
                // accessibility counterpart (14/22/38 vs 8/16/32), so it's checked first. This
                // covers fixed enum-like arrays too (e.g. `DIRECTIONS`/`SCALES` value lists), which
                // this codebase already UPPER_CASEs like any other constant. The established
                // exception (458 conforming constants vs. these 15) is a `private static readonly`
                // field holding a genuine mutable runtime instance - an event-recycling object pool
                // (`_pool`/`_disposePool`/`_keyboardPool`/`_linkPool`/`_mousePool`/`_touchPool`), a
                // scratch/temp object reused to avoid per-call allocations (`_tempRect`,
                // `_helperVector`), or a lazily-populated cache (`_alphaHitCache`, `_toolEvents`,
                // `_propertySetters`, `_previewWindow`, `_encoder`/`_decoder`, `_startTime`) or a
                // runtime registry (Logger's `_loggers`/`_overrides`/`_onceKeys`) - not a fixed
                // value, so it keeps the ordinary private-field `_camelCase` convention.
                // Excluded by name rather than by type: type-aware filtering needs a
                // `parserOptions.project`, which isn't configured, and would be wrong here anyway -
                // pools/caches and fixed-value arrays share the same `T[]`/`Map<...>` shape.
                { selector: 'classProperty', modifiers: ['public', 'static', 'readonly'], format: ['UPPER_CASE'] },
                { selector: 'classProperty', modifiers: ['protected', 'static', 'readonly'], format: ['UPPER_CASE'] },
                {
                    selector: 'classProperty', modifiers: ['private', 'static', 'readonly'], format: ['UPPER_CASE'],
                    filter: {
                        regex: '^_(pool|disposePool|keyboardPool|linkPool|mousePool|touchPool|tempRect|helperVector|alphaHitCache|toolEvents|propertySetters|previewWindow|encoder|decoder|startTime|loggers|overrides|onceKeys)$',
                        match: false
                    }
                },
                // `_SafeStr_N`/`_SafeCls_N` are obfuscated AS3 identifiers the decompiler couldn't
                // recover a name for (see CLAUDE.md "AS3 sources") - inventing a camelCase name for
                // them would violate the traceability mandate, so they keep the placeholder verbatim.
                {
                    selector: 'classProperty', modifiers: ['private'], format: null,
                    filter: { regex: '^_(SafeStr|SafeCls)_\\d+$', match: true }
                },
                { selector: 'classProperty', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'require' },
                { selector: 'classProperty', modifiers: ['protected'], format: ['camelCase'], leadingUnderscore: 'require' },
                // `width_min`/`width_max`/`height_min`/`height_max` (DefaultAttStruct) are the AS3
                // source's own field names verbatim, not an invented snake_case slip.
                {
                    selector: 'classProperty', modifiers: ['public'], format: null,
                    filter: { regex: '^(width_min|width_max|height_min|height_max)$', match: true }
                },
                { selector: 'classProperty', modifiers: ['public'], format: ['camelCase'], leadingUnderscore: 'forbid' },
                // Bound event-handler methods are frequently written as arrow-function class fields
                // (`private _onClick = (e: Event): void => {...}`) and this codebase carries over
                // the AS3 handler's own leading underscore when the original Flash source had one -
                // it does not do so uniformly (259 private handlers without vs. 90 with), so
                // underscore is optional here, unlike the mandatory prefix on plain private fields.
                { selector: 'method', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'allow' },
                { selector: 'method', modifiers: ['protected'], format: ['camelCase'], leadingUnderscore: 'allow' },
                { selector: 'method', format: ['camelCase'] }
            ]
        }
    },
    {
        files: ['packages/vortex-engine/src/**/*.ts'],
        rules: { 'no-restricted-imports': wall() }
    },
    {
        files: ['packages/vortex-engine/src/core/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(habbo|room)(/|$)|(^|/)(habbo|room)/',
                    message: `core/ is the bottom layer: it never imports habbo/ or room/ (${WALLS_SPEC}).`
                },
                {
                    regex: '(^|/)I?Vortex(Main)?(\\.ts)?$',
                    message: `core/ never imports the Vortex entry points or their interfaces (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/vortex-engine/src/room/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@habbo(/|$)|(^|/)habbo/',
                    message: `room/ is the generic engine: it never imports habbo/ (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-common/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/common is the bottom package: it imports no other Ambreia package (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-net/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!common/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/net depends on @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-avatar/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!common/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/avatar depends on @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-ui/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!common/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/ui depends on @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        // The kernel (DI, config, features) sits under the game and over nothing but common: the
        // engines never import it, and it never imports them or the game (spec §3).
        files: ['packages/ambreia-kernel/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!common/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/kernel depends on @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-iso/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!(common|avatar)/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/iso depends on @ambreia/common and @ambreia/avatar only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        // The protocol: the server's messages, their parsers and composers. It carries the iso types
        // its messages hold (stuff data, vectors) and nothing of the kernel or the game (spec §3).
        files: ['packages/ambreia-protocol/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!(common|net|iso)/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/protocol depends on @ambreia/common, net and iso only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        // The game stands on every Ambreia package, and on nothing of the host that boots it.
        files: ['packages/ambreia-game/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '(^|/)vortex-(engine|client|glaze|imager)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/game never imports the host packages (${WALLS_SPEC}).`
                }
            )
        }
    },
    // game/src/core is the game's bottom layer: it never reaches out of core/. Its folders share
    // names with the game's (communication, localization), so the wall counts the climb per depth.
    ...[1, 2, 3].map(depth => ({
        files: [`packages/ambreia-game/src/core/${'*/'.repeat(depth - 1)}*.ts`],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '(^|/)vortex-(engine|client|glaze|imager)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `@ambreia/game never imports the host packages (${WALLS_SPEC}).`
                },
                {
                    regex: `^(\\.\\./){${depth}}`,
                    message: `game core/ never imports the rest of the game (${WALLS_SPEC}).`
                }
            )
        }
    })),
    {
        // Glaze is the window system's own editor: it stands on @ambreia/ui and @ambreia/common, so
        // what it can do is what any other host of the window system can (spec §11, J3).
        files: ['packages/vortex-glaze/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|client)(/|$)|^@ambreia/(?!(common|ui)/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z]+/src(/|$)',
                    message: `Glaze depends on @ambreia/ui and @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['packages/ambreia-map-editor-core/src/**/*.ts'],
        rules:
        {
            'no-restricted-imports': wall(
                {
                    regex: '^@(core|habbo|room|iid|ui)(/|$)|^@ambreia/(?!common/)|(^|/)vortex-(engine|client)(/|$)|(^|/)ambreia-[a-z-]+/src(/|$)',
                    message: `@ambreia/map-editor-core depends on @ambreia/common only (${WALLS_SPEC}).`
                }
            )
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: { globals: { ...globals.node } }
    },
    {
        files: ['packages/*/tools/dashboard/public/**/*.js'],
        languageOptions: { globals: { ...globals.browser } }
    }
);
