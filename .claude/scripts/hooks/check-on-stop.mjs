#!/usr/bin/env node
// Stop: before Claude ends a turn, runs `pnpm check` if .ts files were changed during this session,
// and blocks the stop while it is red. "During this session" = changed in the working tree with an
// mtime after the session's transcript was created, so the owner's older uncommitted work does not
// trigger it. A set of files that already passed is not checked again.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { changedSources, fingerprint } from './lib.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const repo = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;

// Already blocked once in this stop sequence: let Claude stop rather than loop.
if(input.stop_hook_active)
{
    process.exit(0);
}

const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repo, encoding: 'utf8' });

if(status.status !== 0)
{
    process.exit(0);
}

const since = input.transcript_path && existsSync(input.transcript_path)
    ? statSync(input.transcript_path).birthtimeMs
    : 0;
const touched = changedSources(status.stdout)
    .map(path => [path, existsSync(join(repo, path)) ? statSync(join(repo, path)).mtimeMs : 0])
    .filter(([, mtime]) => mtime > since);

if(touched.length === 0)
{
    process.exit(0);
}

const cacheDir = join(tmpdir(), 'vortex-claude-check');
const cacheFile = join(cacheDir, `${input.session_id ?? 'unknown'}.green`);
const key = fingerprint(touched);

if(existsSync(cacheFile) && readFileSync(cacheFile, 'utf8') === key)
{
    process.exit(0);
}

// One command string: on Windows pnpm is a .cmd shim and needs a shell.
const check = spawnSync('pnpm run check', { cwd: repo, encoding: 'utf8', shell: true });

if(check.status === 0)
{
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cacheFile, key);
    process.exit(0);
}

const tail = `${check.stdout}${check.stderr}`.trim().split(/\r?\n/).slice(-40).join('\n');

process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: `\`pnpm check\` is red after this session's .ts changes (${touched.length} file(s)). Fix it before finishing, or tell the user plainly that it is red and why.\n\n${tail}`
}));
