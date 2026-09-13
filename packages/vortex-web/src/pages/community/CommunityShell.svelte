<script lang="ts">
    // `community/community.html` — the shell: header, the four tabs (Photos / Apparts / Sites
    // Officiels / News), and a `ui-view`. Its four tabs were already four pages here, but each one
    // declared the tab bar itself, so the bar existed in four places and could drift between two of
    // its own tabs.
    import Tabs from '../../components/Tabs.svelte';
    import {COMMUNITY_TABS} from '../../lib/tabs.js';

    let {children} = $props();
</script>

<Tabs tabs={COMMUNITY_TABS} />

{@render children()}
