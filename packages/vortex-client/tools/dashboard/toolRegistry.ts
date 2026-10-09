// Registry of every script under tools/, for the local dashboard (server.ts).
// Each entry maps directly onto a pnpm script in package.json - see that file's
// "scripts" block for the canonical CLI invocations this mirrors. Every directory a
// script reads from or writes to is exposed here as a `path` option, pre-filled with
// that script's own real default (see its DEFAULT_*/parseArgs()) - never a value invented
// for this dashboard - so the wizard always shows what will actually run, and nothing is
// hardcoded past what the user can see and override.
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOOLS_DIR = path.resolve(__dirname, '..');
const CLIENT_DIR = path.resolve(TOOLS_DIR, '..');
const REPO_ROOT = path.resolve(CLIENT_DIR, '..', '..');

const SRC_ASSETS = path.join(CLIENT_DIR, 'src', 'assets');
const WIN63_2026_CRYPTED_ROOT = path.join(REPO_ROOT, 'sources', 'WIN63-202607011411-782849652');

export interface FlagOption {
    readonly key: string;
    readonly type: 'flag';
    readonly label: string;
    readonly flag: string;
    readonly default: boolean;
}

export interface TextOption {
    readonly key: string;
    readonly type: 'text';
    readonly label: string;
    readonly flag: string;
    readonly placeholder?: string;
}

export interface PathOption {
    readonly key: string;
    readonly type: 'path';
    readonly label: string;
    readonly flag: string;
    readonly default: string;
    // 'input': must already exist and contain real files - nobody's fork of this repo ships
    // sources/ (gitignored), so this is never guaranteed to exist and the wizard must say
    // so plainly instead of letting the script crash. 'output': fine if missing, the script
    // creates it.
    readonly kind: 'input' | 'output';
}

export interface SelectChoice {
    readonly label: string;
    readonly flag: string | null;
}

export interface SelectOption {
    readonly key: string;
    readonly type: 'select';
    readonly label: string;
    readonly choices: readonly SelectChoice[];
}

export type ToolOption = FlagOption | TextOption | PathOption | SelectOption;

export interface ToolDefinition {
    readonly id: string;
    readonly label: string;
    readonly description: string;
    readonly script: string;
    readonly options: readonly ToolOption[];
}

export interface InstallStep {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly kind: 'source-folder' | 'run-tool';
    readonly toolId?: string;
    readonly sourceFolderOptionKey?: string;
    readonly sourceFolderSubpath?: readonly string[];
    readonly overrides?: Readonly<Record<string, string | boolean>>;
}

const writeFlag = (): FlagOption => (
    {
        key: 'write',
        type: 'flag',
        label: '--write (sinon dry-run)',
        flag: '--write',
        default: false
    });

const inputPath = (key: string, label: string, flag: string, defaultValue: string): PathOption => (
    {
        key,
        type: 'path',
        label,
        flag,
        default: defaultValue,
        kind: 'input'
    });

const outputPath = (key: string, label: string, flag: string, defaultValue: string): PathOption => (
    {
        key,
        type: 'path',
        label,
        flag,
        default: defaultValue,
        kind: 'output'
    });

export const TOOLS: readonly ToolDefinition[] = [
    {
        id: 'bundle-assets',
        label: 'Bundle assets',
        description: 'Empaquette les assets en .ambreia (assets-images, assets-xml). Tourne aussi automatiquement avant dev/build.',
        script: 'bundle-assets.mjs',
        options: [
            inputPath('input', 'Dossier assets source (--input)', '--input', SRC_ASSETS),
            outputPath('output', 'Dossier de sortie (--output)', '--output', path.join(CLIENT_DIR, 'public'))
        ]
    },
    {
        id: 'build-window-assets',
        label: 'Build window assets',
        description: 'Extrait layouts et skins du dump, nommes d\'apres les manifests *Com.as (les vrais noms AS3), et les copie en XML dans les dossiers du client.',
        script: 'build-window-assets.mjs',
        options: [
            inputPath('source', 'Dump source (--source)', '--source', WIN63_2026_CRYPTED_ROOT),
            outputPath('layouts-out', 'Sortie layouts (--layouts-out)', '--layouts-out', path.join(SRC_ASSETS, 'window-layouts')),
            outputPath('skins-out', 'Sortie skins (--skins-out)', '--skins-out', path.join(SRC_ASSETS, 'window-skins')),
            {key: 'dryRun', type: 'flag', label: '--dry-run (previsualiser)', flag: '--dry-run', default: false}
        ]
    },
    {
        id: 'import-crypted-images',
        label: 'Import crypted images',
        description: 'Stage 2 - complete le dossier d\'images depuis le dump crypted win63_2026 (additif, jamais d\'ecrasement).',
        script: 'import-crypted-images.mjs',
        options: [
            inputPath('crypted-root', 'Dump crypted win63_2026 (--crypted-root)', '--crypted-root', WIN63_2026_CRYPTED_ROOT),
            inputPath('layouts-dir', 'Layouts compiles, pour les refs asset_uri (--layouts-dir)', '--layouts-dir', path.join(SRC_ASSETS, 'window-layouts')),
            inputPath('skins-dir', 'Skins compiles, pour les refs asset_uri (--skins-dir)', '--skins-dir', path.join(SRC_ASSETS, 'window-skins')),
            outputPath('images-dir', 'Dossier images de sortie (--images-dir)', '--images-dir', path.join(SRC_ASSETS, 'images')),
            writeFlag()
        ]
    },
];

export const INSTALL_STEPS: readonly InstallStep[] = [
    {
        id: 'source',
        kind: 'source-folder',
        title: 'Dossier source Habbo',
        description: 'Ce depot ne contient aucun fichier Habbo (sources/ est ignore par git). Recupere toi-meme un dump XML/images d\'un client Habbo (type WIN63-202607011411-782849652) et choisis ici le dossier racine ou tu l\'as place.'
    },
    {
        id: 'window-data',
        kind: 'run-tool',
        toolId: 'build-window-assets',
        sourceFolderOptionKey: 'source',
        overrides: {dryRun: false},
        title: 'Extraire layouts et skins',
        description: 'Lit les manifests *Com.as du dump pour nommer chaque layout/skin comme AS3 le nomme, et les copie en XML dans les dossiers du client.'
    },
    {
        id: 'images',
        kind: 'run-tool',
        toolId: 'import-crypted-images',
        sourceFolderOptionKey: 'crypted-root',
        overrides: {write: true},
        title: 'Completer les images',
        description: 'Ajoute les images encore manquantes referencees par les layouts/skins extraits.'
    }
];

export function findTool(id: string): ToolDefinition | undefined {
    return TOOLS.find((tool) => tool.id === id);
}
