<script lang="ts">
    // `community/photos/photos.html`: the page-header band, then `<habbo-columns-channel>` over the
    // whole feed.
    //
    // Real since this commit. It rendered habbo.com's empty state before, on the grounds that "there
    // is no photo endpoint on the web API and no usercontent tree behind the asset host" — the first
    // half was true and the second was never the question. The photos have been in `camera_photos`
    // since the in-game camera shipped, and `WebApiEndpointsCamera` has been serving their pixels
    // all along; what was missing was a route that LISTS them, which is now
    // `GET /api/public/photos`.
    //
    // The empty state stays for the case it was always for: a hotel where nobody has published yet.
    import CommunityShell from './CommunityShell.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import PhotoColumns from '../../components/PhotoColumns.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import * as api from '../../lib/api.js';
    import type {IPhotoSummary} from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let photos = $state<IPhotoSummary[]>([]);
    let loading = $state(true);

    $effect(() =>
    {
        let cancelled = false;

        void api.getPhotos()
            .then((answer) => !cancelled && (photos = answer.items ?? []))
            .catch(() => !cancelled && (photos = []))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
</script>

<CommunityShell>
    <PageHeader title={t('PHOTOS_TITLE')} description={t('PHOTOS_DESCRIPTION')} illustration />

    <section class="mx-auto max-w-[1200px] px-3 pb-12">
        <!-- The channel shape: every card carries its owner's head, because the feed mixes owners.
             `pool="channel"` is habbo.com's own query parameter — it is what makes the photo page's
             arrows walk THIS feed rather than the owner's own photos. -->
        <PhotoColumns bind:photos creator pool="channel" />

        {#if !loading && !photos.length}
            <EmptyResults className="py-12" />
        {/if}
    </section>
</CommunityShell>
