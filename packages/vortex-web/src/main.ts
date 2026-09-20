import {mount} from 'svelte';
import App from './App.svelte';
import {interceptLinks} from './lib/links.js';
import {initLocale} from './lib/i18n.js';
import './styles.css';

// `#app` is in index.html and is the only thing this file assumes. It is asserted rather than
// guarded because there is no recovery: a document without it is a broken build, and mounting into
// nothing would leave a blank page with no error.
const target = document.getElementById('app');

if(!target)
{
    throw new Error('#app is missing from index.html; the site has nowhere to mount.');
}

// Before the mount, so a click landing during the first paint is already ours.
interceptLinks();

// The language is resolved and loaded BEFORE the app exists, so the first paint is already in it —
// no flash of key names, and no reactivity needed in the fifty components that call `t()` straight
// from their markup. It is a dynamic import of a local chunk, not a network round trip, so nothing
// here depends on the API being up.
void initLocale().then(() => mount(App, {target}));
