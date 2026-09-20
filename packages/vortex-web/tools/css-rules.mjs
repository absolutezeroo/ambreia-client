// Prints habbo.com's own rules for a selector, out of sources/app.5ac3d2f8.css.
//
//   node tools/css-rules.mjs report-form            # every rule whose selector contains it
//   node tools/css-rules.mjs .modal__title --exact  # only selectors equal to one of the arguments
//
// Why this exists: the site is written in Tailwind utilities against the tokens in src/styles.css,
// not in habbo.com's BEM classes — so nothing in src/ can be diffed against the stylesheet, and
// "identical to Habbo" has been eyeballed instead of read. The stylesheet is minified into one
// 252 KB line, which is why grep alone gives back a screenful of unrelated rules. This gives back
// the declarations for one component, @media blocks included, in the order the cascade applies
// them.
//
// The scan is brace-aware rather than a split on '}', because a selector's own declarations and
// the ones an @media block overrides them with both matter and only the second kind is nested.

import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SOURCE = join(dirname(fileURLToPath(import.meta.url)), '..', 'sources', 'app.5ac3d2f8.css');

// One entry per rule, in source order. `at` is the @media/@supports condition it sits under, or ''.
function parse(css)
{
    const rules = [];
    const stack = [];
    let start = 0;

    for(let i = 0; i < css.length; i++)
    {
        const c = css[i];

        // A string or url() can hold a brace — the sheet's own SVG data URIs do. Skip to its end.
        if(c === '"' || c === "'")
        {
            const quote = c;
            while(++i < css.length && css[i] !== quote) if(css[i] === '\\') i++;
            continue;
        }

        if(c === '{')
        {
            const head = css.slice(start, i).trim();
            if(head.startsWith('@'))
            {
                stack.push(head);
            }
            else
            {
                const end = bodyEnd(css, i);
                rules.push({at: stack.join(' / '), selector: head, body: css.slice(i + 1, end).trim()});
                i = end;
            }
            start = i + 1;
        }
        else if(c === '}')
        {
            stack.pop();
            start = i + 1;
        }
        else if(c === ';' && stack.length === 0)
        {
            start = i + 1;   // a top-level at-rule with no block: @charset, @import.
        }
    }

    return rules;
}

function bodyEnd(css, open)
{
    let depth = 1;
    for(let i = open + 1; i < css.length; i++)
    {
        if(css[i] === '"' || css[i] === "'")
        {
            const quote = css[i];
            while(++i < css.length && css[i] !== quote) if(css[i] === '\\') i++;
        }
        else if(css[i] === '{') depth++;
        else if(css[i] === '}' && --depth === 0) return i;
    }
    return css.length;
}

const args = process.argv.slice(2);
const exact = args.includes('--exact');
const needles = args.filter(a => !a.startsWith('--'));

if(!needles.length)
{
    console.error('usage: node tools/css-rules.mjs <selector-fragment> [...] [--exact]');
    process.exit(1);
}

const rules = parse(readFileSync(SOURCE, 'utf8'));
let found = 0;

for(const rule of rules)
{
    // A rule's selector list is comma-separated and habbo.com's are long: `.a,.b,.c{...}`. Match a
    // single selector out of the list, and print back only the ones that matched — printing the
    // whole list makes a two-line component look like a forty-selector reset.
    const selectors = rule.selector.split(',').map(s => s.trim());
    const hit = selectors.filter(s => needles.some(n => exact ? s === n : s.includes(n)));

    if(!hit.length) continue;

    found++;
    if(rule.at) console.log(`@ ${rule.at}`);
    console.log(`${hit.join(',\n')}\n{`);
    for(const decl of rule.body.split(';').filter(d => d.trim())) console.log(`    ${decl.trim()};`);
    console.log('}\n');
}

if(!found) console.error(`no rule matches ${needles.join(' ')}`);
