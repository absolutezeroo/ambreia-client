#!/usr/bin/env node
// PreToolUse (Edit|Write|MultiEdit|NotebookEdit): refuses edits to read-only or generated files and
// says what to do instead. Rules live in ./lib.mjs.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { guardReason } from './lib.mjs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const repo = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;

if(!target)
{
    process.exit(0);
}

const reason = guardReason(resolve(input.cwd ?? repo, target), repo);

if(reason)
{
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason
        }
    }));
}
