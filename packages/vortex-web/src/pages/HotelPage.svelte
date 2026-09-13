<script lang="ts">
    // `/hotel` — and this page deliberately renders almost nothing.
    //
    // The client itself lives in App.svelte (components/Client.svelte), mounted once and parked at
    // `left:-9999px` when hidden, because that is how habbo.com keeps a hotel session alive across
    // navigation: `close()` clears `visible`, never `isOpen`, so the iframe is never destroyed.
    // Owning the iframe HERE would tear it down on every exit — which is exactly the "I have to
    // relaunch the hotel" this replaced.
    //
    // What is left is the hole the client covers: a viewport-tall block, so the page underneath is
    // not taller than the overlay and cannot be scrolled out from under it.
</script>

<div class="h-screen w-full bg-black"></div>
