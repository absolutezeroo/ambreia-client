#!/usr/bin/env node
// PostToolUse (Edit|Write|MultiEdit): runs `eslint --fix` on the file just written. What --fix cannot
// repair (a layer-wall violation, a naming error) goes back to Claude on stderr with exit code 2, so
// it is fixed in the same turn instead of at commit time.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const repo = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
const target = input.tool_input?.file_path;

if(!target)
{
    process.exit(0);
}

const file = resolve(input.cwd ?? repo, target);
const rel = relative(repo, file).split(sep).join('/');
const eslint = join(repo, 'node_modules', 'eslint', 'bin', 'eslint.js');

// Package sources, tests, tools and sandboxes: what `pnpm lint` covers. Anything else (docs,
// configs) is not linted.
if(rel.startsWith('..') || !/^packages\/[^/]+\/(src|test|tools|sandbox)\/.+\.(ts|mjs)$/.test(rel) || !existsSync(eslint) || !existsSync(file))
{
    process.exit(0);
}

const result = spawnSync(process.execPath, [eslint, '--fix', '--format', 'stylish', file], { cwd: repo, encoding: 'utf8' });

if(result.status !== 0)
{
    process.stderr.write(`eslint still reports errors in ${rel} after --fix:\n${result.stdout}${result.stderr}`);
    process.exit(2);
}
