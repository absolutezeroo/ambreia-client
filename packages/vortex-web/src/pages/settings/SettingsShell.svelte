<script lang="ts">
    // `settings/settings.html` — and it is ONLY the shell:
    //
    //   <habbo-header-small active="settings">
    //   <habbo-tabs title-key="SETTINGS_TITLE"> … seven <habbo-tab> …
    //   <main class="wrapper wrapper--content">
    //     <section class="main" ui-view></section>          <- the tab's own page goes here
    //     <habbo-web-pages key="common/box_learn_how_to_stay_safe" class="aside aside--box aside--push-down">
    //     <habbo-web-pages key="common/box_need_help" class="aside aside--box">
    //
    // Each tab is a separate `$state` with its own template — `privacy-settings.html`,
    // `account-security/…`, `two-factor-auth.html`, `password-change/…`, `email-change/…`,
    // `avatar-selection.html` — so each is a page here too, and this component is what they share.
    // Folding all six into one file with a branch per section is not how the site is built.
    import Tabs from '../../components/Tabs.svelte';
    import WebPage from '../../components/WebPage.svelte';
    import {SETTINGS_TABS} from '../../lib/tabs.js';
    import {t} from '../../lib/i18n.js';

    let {children} = $props();

    const BOX = 'static-content--box overflow-hidden rounded-[3px] bg-card px-3 py-6 xs:px-6';
</script>

<Tabs title={t('SETTINGS_TITLE')} tabs={SETTINGS_TABS} />

<main class="mx-auto flex max-w-[1200px] flex-col gap-6 px-3 py-6 lg:flex-row lg:items-start">
    <!-- `.main`: 70% from 959px, with 24px of right padding. -->
    <section class="min-w-0 lg:w-[70%] lg:pr-6">
        {@render children()}
    </section>

    <!-- Both asides are habbo.com's own CMS boxes, named by key in settings.html. -->
    <aside class="w-full shrink-0 lg:w-[30%]">
        <WebPage key="common/box_learn_how_to_stay_safe" className="{BOX} mb-6" />
        <WebPage key="common/box_need_help" className={BOX} />
    </aside>
</main>
