<script lang="ts">
    // `/playing-habbo/how-to-play` — `playing-habbo/how-to-play.html`, which declares three boxes:
    // the Habbo Attitude, the safety box and the help box.
    import PlayingShell from './PlayingShell.svelte';
</script>

<PlayingShell page="playing_habbo/how_to_play"
              boxes={['common/box_habbo_way', 'common/box_learn_how_to_stay_safe', 'common/box_need_help']} />
