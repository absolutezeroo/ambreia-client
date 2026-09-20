<script lang="ts">
    // `.static-content`: habbo.com's editorial pages — safety, help, terms, privacy, staff — are one
    // template fed by the route. They differ only in their text, so they are one component here;
    // five near-identical files would drift apart the first time one was edited.
    import {location, link} from 'svelte-spa-router';
    import {t} from '../lib/i18n.js';

    /** A heading and its paragraphs: `[title, ...body]` per block. */
    interface IStaticPage
    {
        title: string;
        blocks: string[][];
    }

    const PAGES = {
        '/safety': {
            title: 'Securite',
            blocks: [
                ['Ton mot de passe', 'Personne de l\'equipe ne te demandera jamais ton mot de passe. Ni en chambre, ni par message, ni sur un autre site.'],
                ['Les echanges', 'Un echange se fait dans l\'hotel, avec la fenetre de troc. Tout ce qui se passe ailleurs n\'est pas protege.'],
                ['Signaler', 'Le bouton de signalement est dans le client, sur chaque avatar et chaque chambre. Un moderateur lit chaque rapport.'],
            ],
        },
        '/help': {
            title: 'Aide',
            blocks: [
                ['Je ne peux pas me connecter', 'Verifie ton adresse e-mail et ton mot de passe. Si la double authentification est active, le site te demandera un code apres le mot de passe.'],
                ['J\'ai perdu mon mot de passe', 'La reinitialisation par e-mail n\'est pas encore branchee sur cet hotel. Contacte l\'equipe.'],
                ['Le client ne s\'ouvre pas', 'Le site demande un ticket a l\'emulateur puis charge le client. Si la porte reste fermee, c\'est que l\'emulateur ne repond pas.'],
            ],
        },
        '/terms': {
            title: 'Conditions',
            blocks: [
                ['Un hotel prive', 'Vortex est un hotel prive, sans lien avec Sulake. Aucun paiement reel n\'y est traite.'],
                ['Ton compte', 'Un compte par personne. Le partage de compte est la premiere cause de compte perdu.'],
            ],
        },
        '/privacy': {
            title: 'Confidentialite',
            blocks: [
                ['Ce qui est stocke', 'Une adresse e-mail, un mot de passe hache, et les donnees de jeu de tes avatars.'],
                ['Ce qui ne l\'est pas', 'Aucun traceur publicitaire, aucune revente. Le site ne parle qu\'a son propre emulateur.'],
            ],
        },
        '/staff': {
            title: 'Equipe',
            blocks: [
                ['Moderation', 'L\'equipe repond aux signalements envoyes depuis le client.'],
                ['Recrutement', 'Les candidatures se font en jeu, aupres d\'un administrateur.'],
            ],
        },
        // /community/fansites is NOT here: it is a real tabbed community page on habbo.com
        // (pages/community/Fansites.svelte), not an editorial one. Neither is /habbo-nft, for the
        // same reason plus a worse one: its entry here said the hotel had no wallet, which was true
        // when it was written and became the site's most visible wrong sentence the day the chain
        // was deployed. It is pages/HabboNft.svelte now.
        '/forgot': {
            title: 'Mot de passe oublie',
            blocks: [
                ['Pas encore disponible', 'L\'emulateur n\'expose pas de route de reinitialisation : le web API sert la connexion, l\'inscription, les avatars et le ticket SSO, rien de plus. Contacte l\'equipe pour un changement manuel.'],
            ],
        },
    };

    // `$location` is any route the router lands on, so the lookup is a miss by default — `/help` is
    // the fallback and always exists. Indexing a literal object with an arbitrary string needs the
    // record type to say so; without it TypeScript is right that the answer could be undefined.
    const page = $derived((PAGES as Record<string, IStaticPage>)[$location] ?? PAGES['/help']);
</script>

<div class="mx-auto max-w-[720px] px-3 py-6">
    <h1>{page.title}</h1>

    {#each page.blocks as block}
        <section class="mt-6">
            <h3>{block[0]}</h3>
            <p class="mt-1.5 leading-relaxed">{block[1]}</p>
        </section>
    {/each}

    <!-- `NAVIGATION_HOME` — the navigation's own word for this destination, in every language. It
         was "Retour a l'accueil" typed in French, accents missing.

         `/`, not `/me`: habbo.com has no such route and neither does this port — see the note at
         the top of lib/routes.ts. The link fell through to the 404. -->
    <p class="mt-12"><a href="/" use:link class="hover:underline">{t('NAVIGATION_HOME')}</a></p>
</div>
