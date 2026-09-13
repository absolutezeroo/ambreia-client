<script lang="ts">
    // `/playing-habbo/what-is-habbo` — `playing-habbo/what-is-habbo.html`. habbo.com redirects
    // `/playing-habbo` here (`t.when('/playing-habbo', '/playing-habbo/what-is-habbo')`).
    //
    // Three side boxes on this tab: how to play, the Habbo Attitude, the parents' guide.
    import PlayingShell from './PlayingShell.svelte';
</script>

<PlayingShell page="playing_habbo/what_is_habbo"
              boxes={['common/box_how_to_play', 'common/box_habbo_way', 'common/box_parents_guide']} />
