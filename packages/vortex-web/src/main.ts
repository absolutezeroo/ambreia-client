import {mount} from 'svelte';
import App from './App.svelte';
import {interceptLinks} from './lib/links.js';
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

mount(App, {target});
