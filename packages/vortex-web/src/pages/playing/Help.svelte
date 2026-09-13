<script lang="ts">
    // `/playing-habbo/help` — `playing-habbo/help.html`: the ONE tab whose box is not a `common/`
    // one. It carries `playing_habbo/box_helplines`, the list of phone numbers and sites, with
    // `.aside--push-down` on it.
    import PlayingShell from './PlayingShell.svelte';
</script>

<PlayingShell page="playing_habbo/help" boxes={['playing_habbo/box_helplines']} />
