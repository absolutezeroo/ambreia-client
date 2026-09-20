# Social Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A social feed on the hotel's website where players post statuses, their own Habbo photos and polls, and comment, repost, favourite and tag each other's posts.

**Architecture:** One self-referencing table — a comment *is* a post with a parent — so photos, polls and tags attach to comments and roots through the same rows. Seven EF entities in `Vortex.Database`, one read/write service and six routes in `Vortex.WebApi` (anonymous reads, session writes), and one new tab in `vortex-web`'s community section built from components that already exist.

**Tech Stack:** C# / .NET, EF Core (MySQL in production, `UseInMemoryDatabase` in tests), xUnit + FluentAssertions, ASP.NET Core minimal APIs; Svelte 5 runes, Vite, Tailwind 4, `svelte-spa-router`.

**Spec:** `docs/superpowers/specs/2026-09-21-web-social-feed-design.md`

## Global Constraints

- **Two repositories.** The front is `packages/vortex-web` in *this* checkout; everything C# is in the sibling checkout `../vortex-emulator`. Paths below say which.
- **The tree is shared with other sessions.** `git status` at the time of writing showed edits in `packages/vortex-engine/src/habbo/catalog/viewer/` belonging to someone else. **Every commit in this plan names its paths explicitly** (`git commit -- <paths>`); never `git commit -a`, never a bare `git commit` after a broad `git add`.
- **C# formatting:** `dotnet csharpier check .` must pass. The repo's `PostToolUse` hook runs csharpier on a touched `.cs` and **reformats the file**, so re-read a file before editing it again.
- **`[FromServices]` is mandatory** on every service parameter of every endpoint. A service the container does not know is otherwise inferred as a request *body*; a GET may not have one, and the whole route table then fails to build — one missing registration takes down every endpoint in the host. This is written out at `Vortex.WebApi/Hosting/WebApiEndpoints.Camera.cs`.
- **Migrations:** `scripts/ef.ps1 migrations add <Name>` from the emulator root. Never hand-write a migration file.
- **Tests:** `dotnet test Vortex.WebApi.Tests` and `dotnet test Vortex.Database.Tests` from the emulator root.
- **`openapi.json` is generated, not edited.** `Vortex.WebApi.Tests/OpenApiDocumentTests.cs` writes it and fails when the API's shape has moved and the file has not. After it passes, run `pnpm --filter vortex-web api:types` from this checkout's root to regenerate `src/lib/api.generated.ts`.
- **`vortex-web` has no test runner** — its `package.json` has `dev`, `build`, `preview`, `check`, `api:types` and nothing else. Do **not** add one; it is not in scope. The front gate is `pnpm --filter vortex-web check` (svelte-check, which is a real gate because the page types come from `api.generated.ts`) plus a browser check against `pnpm web` on :5174.
- **Naming:** `_`-prefixed private fields, Allman braces, `if(condition)` with no space — in the TypeScript. The C# follows the emulator's own conventions, which csharpier enforces.
- **Copy:** every user-visible string on the front is a translation KEY resolved through `t()`, never a sentence. New keys go in `packages/vortex-web/src/locales/site/fr.json` **and** `en.json`. A key added to one and not the other falls back silently.
- **Entity conventions:** inherit `Vortex.Database.Entities.VortexEntity` (it supplies `Id`, `CreatedAt`, `UpdatedAt`, `DeletedAt`), `[Table("snake_case")]`, `[Column("snake_case")]`, `[Index(...)]`, `<X>EntityId` foreign keys with a `[ForeignKey]` navigation property.
- **EF InMemory does not enforce unique indexes.** Where the spec says an index makes something idempotent, the service must *also* guard in code, and the test asserts the service's guard. The index is the production backstop, not the only line.

---

### Task 1: The seven entities and the migration

**Files:**
- Create: `../vortex-emulator/Vortex.Primitives/Feed/FeedPostKind.cs`
- Create: `../vortex-emulator/Vortex.Primitives/Feed/FeedReactionKind.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedPostEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedPostPhotoEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedPollChoiceEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedPollVoteEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedReactionEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedTagEntity.cs`
- Create: `../vortex-emulator/Vortex.Database/Entities/Feed/WebFeedPostTagEntity.cs`
- Modify: `../vortex-emulator/Vortex.Database/Context/VortexDbContext.cs` (seven `DbSet`s, beside `CameraPhotos` at line ~146)
- Test: `../vortex-emulator/Vortex.Database.Tests/Feed/WebFeedModelTests.cs`

**Interfaces:**
- Consumes: nothing.
- Produces: `FeedPostKind { Status = 0, Photo = 1, Poll = 2 }`; `FeedReactionKind { Repost = 0, Favorite = 1 }`; the seven entity types above; `VortexDbContext.WebFeedPosts`, `.WebFeedPostPhotos`, `.WebFeedPollChoices`, `.WebFeedPollVotes`, `.WebFeedReactions`, `.WebFeedTags`, `.WebFeedPostTags`.

- [ ] **Step 1: Write the failing test**

Create `../vortex-emulator/Vortex.Database.Tests/Feed/WebFeedModelTests.cs`:

```csharp
using System.Linq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Vortex.Database.Context;
using Vortex.Database.Entities.Feed;
using Vortex.Primitives.Feed;
using Xunit;

namespace Vortex.Database.Tests.Feed;

/// <summary>
/// The shape of the feed's tables, asserted rather than assumed.
/// </summary>
/// <remarks>
/// The unique indexes here are the whole correctness story for voting and reacting — one vote per
/// player per poll, one reaction per player per post per kind — and EF's in-memory provider does
/// not enforce a unique index, so nothing else in the suite would notice one being dropped in a
/// later edit. Reading them off the model is how they stay asserted without a MySQL in CI.
/// </remarks>
public sealed class WebFeedModelTests
{
    private static VortexDbContext Context() =>
        new(
            new DbContextOptionsBuilder<VortexDbContext>()
                .UseInMemoryDatabase($"feed-model-{System.Guid.NewGuid():N}")
                .Options
        );

    [Fact]
    public void Posts_AreSelfReferencing()
    {
        using VortexDbContext db = Context();

        IEntityType post = db.Model.FindEntityType(typeof(WebFeedPostEntity))!;

        post.GetTableName().Should().Be("web_feed_posts");
        post.FindProperty(nameof(WebFeedPostEntity.ParentEntityId))!
            .IsNullable.Should()
            .BeTrue("a root post has no parent, and that is what makes a comment a post");
    }

    [Fact]
    public void OneVotePerPlayerPerPoll()
    {
        using VortexDbContext db = Context();

        db.Model.FindEntityType(typeof(WebFeedPollVoteEntity))!
            .GetIndexes()
            .Should()
            .ContainSingle(i =>
                i.IsUnique
                && i.Properties.Select(p => p.Name).SequenceEqual(new[] { "WebFeedPostEntityId", "PlayerEntityId" })
            );
    }

    [Fact]
    public void OneReactionPerPlayerPerPostPerKind()
    {
        using VortexDbContext db = Context();

        db.Model.FindEntityType(typeof(WebFeedReactionEntity))!
            .GetIndexes()
            .Should()
            .ContainSingle(i =>
                i.IsUnique
                && i.Properties.Select(p => p.Name).SequenceEqual(new[] { "WebFeedPostEntityId", "PlayerEntityId", "Kind" })
            );
    }

    [Fact]
    public async System.Threading.Tasks.Task AWholePostRoundTrips()
    {
        await using VortexDbContext db = Context();

        WebFeedPostEntity root = new() { PlayerEntityId = 1, Kind = FeedPostKind.Poll, Body = "Pizza ou burger ?" };
        db.WebFeedPosts.Add(root);
        await db.SaveChangesAsync();

        db.WebFeedPollChoices.Add(new WebFeedPollChoiceEntity { WebFeedPostEntityId = root.Id, Ordinal = 0, Label = "Pizza" });
        db.WebFeedPosts.Add(new WebFeedPostEntity { PlayerEntityId = 2, Kind = FeedPostKind.Status, Body = "les deux", ParentEntityId = root.Id });
        await db.SaveChangesAsync();

        (await db.WebFeedPosts.CountAsync(p => p.ParentEntityId == root.Id)).Should().Be(1);
        (await db.WebFeedPollChoices.CountAsync(c => c.WebFeedPostEntityId == root.Id)).Should().Be(1);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `dotnet test Vortex.Database.Tests --filter WebFeedModelTests`
Expected: FAIL — the build cannot resolve `WebFeedPostEntity`, `FeedPostKind` and the `DbSet`s.

- [ ] **Step 3: Write the enums**

`Vortex.Primitives/Feed/FeedPostKind.cs`:

```csharp
namespace Vortex.Primitives.Feed;

/// <summary>What a feed post carries under its text.</summary>
public enum FeedPostKind
{
    /// <summary>Text alone.</summary>
    Status = 0,

    /// <summary>One to four of the author's own published camera photos.</summary>
    Photo = 1,

    /// <summary>One question and two to five choices.</summary>
    Poll = 2,
}
```

`Vortex.Primitives/Feed/FeedReactionKind.cs`:

```csharp
namespace Vortex.Primitives.Feed;

/// <summary>The two things a reader can do to a post that is not commenting on it.</summary>
public enum FeedReactionKind
{
    Repost = 0,
    Favorite = 1,
}
```

- [ ] **Step 4: Write the seven entities**

`Vortex.Database/Entities/Feed/WebFeedPostEntity.cs`:

```csharp
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Entities.Groups;
using Vortex.Database.Entities.Players;
using Vortex.Primitives.Feed;

namespace Vortex.Database.Entities.Feed;

/// <summary>
/// One entry in the website's social feed — and one comment on one, because they are the same row.
/// </summary>
/// <remarks>
/// <para>
/// <see cref="ParentEntityId"/> null is a post; set makes the row a comment on the post it names.
/// That is the load-bearing decision in this whole feature: the screenshot it was built from shows
/// a comment form carrying the same three tabs as the post form — text, photos, poll — so a comment
/// has to be able to hold everything a post holds. With one table it already does, and photos,
/// poll choices, votes, reactions and tags all attach to a comment through the rows they attach to
/// a post with. With two tables every one of those needs either a second table or a polymorphic
/// owner column.
/// </para>
/// <para>
/// <see cref="PlayerEntityId"/> is the real author and stays the real author even when
/// <see cref="GroupEntityId"/> makes the post display as a group. A post published under a group
/// is still something a person did, and the row is the only place that survives them leaving the
/// group.
/// </para>
/// <para>
/// The thread is one level deep by construction: the service refuses a parent that itself has a
/// parent. The screenshot has no nested replies, and a flat thread is one query rather than a
/// walk.
/// </para>
/// </remarks>
[Table("web_feed_posts")]
[Index(nameof(ParentEntityId), nameof(CreatedAt))]
[Index(nameof(PlayerEntityId), nameof(CreatedAt))]
[Index(nameof(DeletedAt), nameof(CreatedAt))]
public class WebFeedPostEntity : VortexEntity
{
    /// <summary>The author, always the person — never the group they published as.</summary>
    [Column("player_id")]
    public required int PlayerEntityId { get; set; }

    /// <summary>The identity shown on the card, when the author chose one of their groups.</summary>
    [Column("group_id")]
    public int? GroupEntityId { get; set; }

    /// <summary>Null on a post; the post being commented on otherwise.</summary>
    [Column("parent_id")]
    public int? ParentEntityId { get; set; }

    [Column("kind")]
    public required FeedPostKind Kind { get; set; }

    [Column("body")]
    [MaxLength(BodyLength)]
    public required string Body { get; set; }

    /// <summary>
    /// What the composer accepts. Long enough for the status the screenshot shows and short enough
    /// that the column stays comfortably inside an index-bearing row.
    /// </summary>
    public const int BodyLength = 500;

    [ForeignKey(nameof(PlayerEntityId))]
    public PlayerEntity? PlayerEntity { get; set; }

    [ForeignKey(nameof(GroupEntityId))]
    public GroupEntity? GroupEntity { get; set; }

    [ForeignKey(nameof(ParentEntityId))]
    public WebFeedPostEntity? ParentEntity { get; set; }

    public ICollection<WebFeedPostEntity> Children { get; set; } = [];

    public ICollection<WebFeedPostPhotoEntity> Photos { get; set; } = [];

    public ICollection<WebFeedPollChoiceEntity> PollChoices { get; set; } = [];

    public ICollection<WebFeedReactionEntity> Reactions { get; set; } = [];

    public ICollection<WebFeedPostTagEntity> Tags { get; set; } = [];
}
```

`Vortex.Database/Entities/Feed/WebFeedPostPhotoEntity.cs`:

```csharp
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Entities.Camera;

namespace Vortex.Database.Entities.Feed;

/// <summary>
/// One of the author's photos, attached to one of their posts, in the order they chose.
/// </summary>
/// <remarks>
/// A foreign key to <c>camera_photos</c> and not the photo's key as a string. The key would be
/// enough to build the url, and that is exactly the trap: the projection has to re-apply the photo
/// service's own conditions — published, not deleted, owner not hiding — so a photo the owner
/// later unpublishes disappears from the post instead of staying in it as a broken image. That
/// re-check needs the row, so the row is what is stored.
/// </remarks>
[Table("web_feed_post_photos")]
[Index(nameof(WebFeedPostEntityId), nameof(Ordinal), IsUnique = true)]
public class WebFeedPostPhotoEntity : VortexEntity
{
    [Column("post_id")]
    public required int WebFeedPostEntityId { get; set; }

    [Column("photo_id")]
    public required int CameraPhotoEntityId { get; set; }

    [Column("ordinal")]
    public required int Ordinal { get; set; }

    [ForeignKey(nameof(WebFeedPostEntityId))]
    public WebFeedPostEntity? WebFeedPostEntity { get; set; }

    [ForeignKey(nameof(CameraPhotoEntityId))]
    public CameraPhotoEntity? CameraPhotoEntity { get; set; }
}
```

`Vortex.Database/Entities/Feed/WebFeedPollChoiceEntity.cs`:

```csharp
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Vortex.Database.Entities.Feed;

/// <summary>One answer a poll offers.</summary>
[Table("web_feed_poll_choices")]
[Index(nameof(WebFeedPostEntityId), nameof(Ordinal), IsUnique = true)]
public class WebFeedPollChoiceEntity : VortexEntity
{
    [Column("post_id")]
    public required int WebFeedPostEntityId { get; set; }

    [Column("ordinal")]
    public required int Ordinal { get; set; }

    [Column("label")]
    [MaxLength(LabelLength)]
    public required string Label { get; set; }

    public const int LabelLength = 80;

    [ForeignKey(nameof(WebFeedPostEntityId))]
    public WebFeedPostEntity? WebFeedPostEntity { get; set; }

    public ICollection<WebFeedPollVoteEntity> Votes { get; set; } = [];
}
```

`Vortex.Database/Entities/Feed/WebFeedPollVoteEntity.cs`:

```csharp
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Entities.Players;

namespace Vortex.Database.Entities.Feed;

/// <summary>One player's answer to one poll.</summary>
/// <remarks>
/// The post is carried alongside the choice, and it is redundant only in the sense that it could be
/// reached through the choice. Carrying it is what makes the unique index expressible at all:
/// "one vote per player per poll" is an index over (post, player), and without the post column it
/// would be a subquery in a constraint, which is to say a rule enforced by whichever handler
/// happens to run rather than by the database.
/// </remarks>
[Table("web_feed_poll_votes")]
[Index(nameof(WebFeedPostEntityId), nameof(PlayerEntityId), IsUnique = true)]
public class WebFeedPollVoteEntity : VortexEntity
{
    [Column("post_id")]
    public required int WebFeedPostEntityId { get; set; }

    [Column("choice_id")]
    public required int WebFeedPollChoiceEntityId { get; set; }

    [Column("player_id")]
    public required int PlayerEntityId { get; set; }

    [ForeignKey(nameof(WebFeedPostEntityId))]
    public WebFeedPostEntity? WebFeedPostEntity { get; set; }

    [ForeignKey(nameof(WebFeedPollChoiceEntityId))]
    public WebFeedPollChoiceEntity? WebFeedPollChoiceEntity { get; set; }

    [ForeignKey(nameof(PlayerEntityId))]
    public PlayerEntity? PlayerEntity { get; set; }
}
```

`Vortex.Database/Entities/Feed/WebFeedReactionEntity.cs`:

```csharp
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Entities.Players;
using Vortex.Primitives.Feed;

namespace Vortex.Database.Entities.Feed;

/// <summary>One player reposting or favouriting one post.</summary>
/// <remarks>
/// <para>
/// A row per reaction rather than a counter on the post, for the reason
/// <see cref="Camera.CameraPhotoLikeEntity"/> already spells out in full and which applies here
/// word for word: a number cannot be un-reacted correctly, because it does not remember who. Two
/// taps, a retry after a timeout, a double click — each increments a counter and none of them can
/// be taken back.
/// </para>
/// <para>
/// Withdrawing a reaction DELETES the row. A soft delete would keep the pair and make the unique
/// index refuse the next one — the case where <see cref="VortexEntity.DeletedAt"/> is the wrong
/// tool.
/// </para>
/// </remarks>
[Table("web_feed_reactions")]
[Index(nameof(WebFeedPostEntityId), nameof(PlayerEntityId), nameof(Kind), IsUnique = true)]
public class WebFeedReactionEntity : VortexEntity
{
    [Column("post_id")]
    public required int WebFeedPostEntityId { get; set; }

    [Column("player_id")]
    public required int PlayerEntityId { get; set; }

    [Column("kind")]
    public required FeedReactionKind Kind { get; set; }

    [ForeignKey(nameof(WebFeedPostEntityId))]
    public WebFeedPostEntity? WebFeedPostEntity { get; set; }

    [ForeignKey(nameof(PlayerEntityId))]
    public PlayerEntity? PlayerEntity { get; set; }
}
```

`Vortex.Database/Entities/Feed/WebFeedTagEntity.cs`:

```csharp
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Vortex.Database.Entities.Feed;

/// <summary>One hashtag, once for the whole hotel.</summary>
/// <remarks>
/// Stored lowercased, because that is the search key. The casing the author typed stays in the
/// post's body, which is what the page renders — so <c>#McBurgerFC</c> reads as they wrote it and
/// still finds <c>#mcburgerfc</c>.
/// </remarks>
[Table("web_feed_tags")]
[Index(nameof(Tag), IsUnique = true)]
public class WebFeedTagEntity : VortexEntity
{
    [Column("tag")]
    [MaxLength(TagLength)]
    public required string Tag { get; set; }

    public const int TagLength = 64;

    public ICollection<WebFeedPostTagEntity> Posts { get; set; } = [];
}
```

`Vortex.Database/Entities/Feed/WebFeedPostTagEntity.cs`:

```csharp
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Vortex.Database.Entities.Feed;

/// <summary>A post carrying a tag.</summary>
[Table("web_feed_post_tags")]
[Index(nameof(WebFeedPostEntityId), nameof(WebFeedTagEntityId), IsUnique = true)]
[Index(nameof(WebFeedTagEntityId))]
public class WebFeedPostTagEntity : VortexEntity
{
    [Column("post_id")]
    public required int WebFeedPostEntityId { get; set; }

    [Column("tag_id")]
    public required int WebFeedTagEntityId { get; set; }

    [ForeignKey(nameof(WebFeedPostEntityId))]
    public WebFeedPostEntity? WebFeedPostEntity { get; set; }

    [ForeignKey(nameof(WebFeedTagEntityId))]
    public WebFeedTagEntity? WebFeedTagEntity { get; set; }
}
```

- [ ] **Step 5: Register the seven `DbSet`s**

In `Vortex.Database/Context/VortexDbContext.cs`, beside the camera sets at line ~146, adding `using Vortex.Database.Entities.Feed;` at the top:

```csharp
    public DbSet<WebFeedPostEntity> WebFeedPosts { get; init; } = null!;

    public DbSet<WebFeedPostPhotoEntity> WebFeedPostPhotos { get; init; } = null!;

    public DbSet<WebFeedPollChoiceEntity> WebFeedPollChoices { get; init; } = null!;

    public DbSet<WebFeedPollVoteEntity> WebFeedPollVotes { get; init; } = null!;

    public DbSet<WebFeedReactionEntity> WebFeedReactions { get; init; } = null!;

    public DbSet<WebFeedTagEntity> WebFeedTags { get; init; } = null!;

    public DbSet<WebFeedPostTagEntity> WebFeedPostTags { get; init; } = null!;
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `dotnet test Vortex.Database.Tests --filter WebFeedModelTests`
Expected: PASS, 4 tests.

If `Posts_AreSelfReferencing` fails on a cascade cycle at model build, add to `VortexDbContext.OnModelCreating`:

```csharp
        modelBuilder
            .Entity<WebFeedPostEntity>()
            .HasOne(p => p.ParentEntity)
            .WithMany(p => p.Children)
            .HasForeignKey(p => p.ParentEntityId)
            .OnDelete(DeleteBehavior.Restrict);
```

A comment is soft-deleted with its parent by the service, never cascaded away by the database — the row has to survive for the audit trail the rest of this hotel keeps.

- [ ] **Step 7: Generate the migration**

Run from the emulator root: `scripts/ef.ps1 migrations add AddWebSocialFeed`
Expected: a new pair of files under `Vortex.Database/Migrations/`. Read the generated `Up()` and confirm it creates seven tables and the four unique indexes. **Do not edit it.**

- [ ] **Step 8: Format and commit**

```bash
cd ../vortex-emulator
dotnet csharpier .
git commit -- Vortex.Primitives/Feed Vortex.Database/Entities/Feed Vortex.Database/Context/VortexDbContext.cs Vortex.Database/Migrations Vortex.Database.Tests/Feed -m "fil : les sept tables du fil social"
```

---

### Task 2: Reading the feed

**Files:**
- Create: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs`
- Create: `../vortex-emulator/Vortex.WebApi/Services/WebApiFeedService.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/WebApiModule.cs` (register beside `IWebApiPhotoService`)
- Modify: `../vortex-emulator/Vortex.WebApi.Tests/WebApiTestFactory.cs` (register the real service, beside `WebApiPhotoService` at line ~161)
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedReadTests.cs`

**Interfaces:**
- Consumes: Task 1's entities and `DbSet`s; `Vortex.WebApi.Services.PhotoSummary` (existing, from `IWebApiPhotoService.cs`).
- Produces:
  - `record FeedPollChoice(int Id, string Label, int Votes)`
  - `record FeedPoll(int TotalVotes, int? MyChoiceId, IReadOnlyList<FeedPollChoice> Choices)`
  - `record FeedPost(int Id, string AuthorUniqueId, string AuthorName, string AuthorFigureString, int? GroupId, string? GroupName, string? GroupBadgeCode, FeedPostKind Kind, string Body, DateTime CreatedAt, IReadOnlyList<PhotoSummary> Photos, FeedPoll? Poll, IReadOnlyList<string> Tags, int CommentCount, int RepostCount, int FavoriteCount, bool RepostedByMe, bool FavoritedByMe, bool Mine, IReadOnlyList<FeedPost> Comments)`
  - `record FeedPage(int Page, int PageSize, int Total, IReadOnlyList<FeedPost> Items)`
  - `IWebApiFeedService.GetFeedAsync(int page, int pageSize, string? tag, int? viewerId, CancellationToken ct) → Task<FeedPage>`
  - `IWebApiFeedService.GetPostAsync(int id, int? viewerId, CancellationToken ct) → Task<FeedPost?>`

- [ ] **Step 1: Write the failing test**

Create `../vortex-emulator/Vortex.WebApi.Tests/FeedReadTests.cs`:

```csharp
using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Database.Context;
using Vortex.Database.Entities.Camera;
using Vortex.Database.Entities.Feed;
using Vortex.Database.Entities.Players;
using Vortex.Primitives.Feed;
using Vortex.Primitives.Players.Enums;
using Vortex.WebApi.Services;
using Xunit;

namespace Vortex.WebApi.Tests;

/// <summary>
/// What leaves the feed's read side.
/// </summary>
/// <remarks>
/// Two rules carry every test here and neither is obvious from the route. A comment is a post with
/// a parent, so the feed has to return roots ONLY or every thread appears twice; and a post by a
/// player who has hidden their profile must not appear at all, which is the same disclosure rule
/// the photo gallery enforces and the one most likely to be dropped in a later edit, because it
/// lives on a different table from the post.
/// </remarks>
public sealed class FeedReadTests
{
    [Fact]
    public async Task Feed_ReturnsRootsOnly()
    {
        await using WebApiTestFactory factory = new();
        int root = await SeedPostAsync(factory, playerId: 1, name: "Prodiigy", visible: true, body: "coucou");
        await SeedCommentAsync(factory, playerId: 1, parentId: root, body: "et hop");

        FeedPage page = await Service(factory).GetFeedAsync(1, 0, null, null, default);

        page.Items.Should().ContainSingle();
        page.Items[0].Id.Should().Be(root);
        page.Items[0].CommentCount.Should().Be(1);
        page.Total.Should().Be(1);
    }

    [Fact]
    public async Task Feed_CarriesTheThreeMostRecentComments()
    {
        await using WebApiTestFactory factory = new();
        int root = await SeedPostAsync(factory, 1, "Prodiigy", true, "coucou");

        for(int i = 0; i < 5; i++)
        {
            await SeedCommentAsync(factory, 1, root, $"c{i}");
        }

        FeedPost post = (await Service(factory).GetFeedAsync(1, 0, null, null, default)).Items[0];

        post.CommentCount.Should().Be(5);
        post.Comments.Should().HaveCount(3);
        post.Comments.Select(c => c.Body).Should().Equal("c2", "c3", "c4");
    }

    [Fact]
    public async Task Feed_LeavesOutAPostByAHiddenPlayer()
    {
        await using WebApiTestFactory factory = new();
        await SeedPostAsync(factory, 1, "Cache", visible: false, body: "invisible");

        (await Service(factory).GetFeedAsync(1, 0, null, null, default)).Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Feed_LeavesOutADeletedPost()
    {
        await using WebApiTestFactory factory = new();
        int id = await SeedPostAsync(factory, 1, "Prodiigy", true, "parti");

        await using(VortexDbContext db = await factory.DbContexts.CreateDbContextAsync())
        {
            (await db.WebFeedPosts.FindAsync(id))!.DeletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
        }

        (await Service(factory).GetFeedAsync(1, 0, null, null, default)).Items.Should().BeEmpty();
    }

    [Fact]
    public async Task Post_DropsAPhotoTheOwnerUnpublished()
    {
        await using WebApiTestFactory factory = new();
        int id = await SeedPhotoPostAsync(factory, playerId: 1, name: "Prodiigy", key: "abc", published: false);

        FeedPost? post = await Service(factory).GetPostAsync(id, null, default);

        post.Should().NotBeNull();
        post!.Photos.Should().BeEmpty("a photo taken back must leave the post, not stay in it as a hole");
    }

    [Fact]
    public async Task Post_ReportsMyOwnVote()
    {
        await using WebApiTestFactory factory = new();
        (int postId, int choiceId) = await SeedPollAsync(factory, playerId: 1, name: "Synes");

        await using(VortexDbContext db = await factory.DbContexts.CreateDbContextAsync())
        {
            db.WebFeedPollVotes.Add(new WebFeedPollVoteEntity
            {
                WebFeedPostEntityId = postId,
                WebFeedPollChoiceEntityId = choiceId,
                PlayerEntityId = 1,
            });
            await db.SaveChangesAsync();
        }

        FeedPost post = (await Service(factory).GetPostAsync(postId, viewerId: 1, default))!;

        post.Poll!.TotalVotes.Should().Be(1);
        post.Poll.MyChoiceId.Should().Be(choiceId);
        post.Poll.Choices.Single(c => c.Id == choiceId).Votes.Should().Be(1);
    }

    private static IWebApiFeedService Service(WebApiTestFactory factory) =>
        new WebApiFeedService(factory.DbContexts);

    private static async Task<PlayerEntity> EnsurePlayerAsync(
        WebApiTestFactory factory,
        int playerId,
        string name,
        bool visible
    )
    {
        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        PlayerEntity? existing = await db.Players.FindAsync(playerId);

        if(existing is not null)
        {
            return existing;
        }

        PlayerEntity player = new()
        {
            Id = playerId,
            Name = name,
            Figure = "hr-115",
            Gender = AvatarGenderType.Male,
            PlayerStatus = PlayerStatusType.Offline,
            PlayerPerks = PlayerPerkFlags.None,
            ProfileVisible = visible,
        };

        db.Players.Add(player);
        await db.SaveChangesAsync();

        return player;
    }

    private static async Task<int> SeedPostAsync(
        WebApiTestFactory factory,
        int playerId,
        string name,
        bool visible,
        string body
    )
    {
        await EnsurePlayerAsync(factory, playerId, name, visible);

        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        WebFeedPostEntity post = new() { PlayerEntityId = playerId, Kind = FeedPostKind.Status, Body = body };
        db.WebFeedPosts.Add(post);
        await db.SaveChangesAsync();

        return post.Id;
    }

    private static async Task SeedCommentAsync(
        WebApiTestFactory factory,
        int playerId,
        int parentId,
        string body
    )
    {
        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        db.WebFeedPosts.Add(new WebFeedPostEntity
        {
            PlayerEntityId = playerId,
            Kind = FeedPostKind.Status,
            Body = body,
            ParentEntityId = parentId,
        });

        await db.SaveChangesAsync();
    }

    private static async Task<int> SeedPhotoPostAsync(
        WebApiTestFactory factory,
        int playerId,
        string name,
        string key,
        bool published
    )
    {
        await EnsurePlayerAsync(factory, playerId, name, visible: true);

        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        CameraPhotoEntity photo = new()
        {
            PhotoKey = key,
            PlayerEntityId = playerId,
            SceneBytes = 1024,
            RejectedExternalSprites = 0,
            PublishedAt = published ? DateTime.UtcNow : null,
        };

        WebFeedPostEntity post = new() { PlayerEntityId = playerId, Kind = FeedPostKind.Photo, Body = "" };

        db.CameraPhotos.Add(photo);
        db.WebFeedPosts.Add(post);
        await db.SaveChangesAsync();

        db.WebFeedPostPhotos.Add(new WebFeedPostPhotoEntity
        {
            WebFeedPostEntityId = post.Id,
            CameraPhotoEntityId = photo.Id,
            Ordinal = 0,
        });

        await db.SaveChangesAsync();

        return post.Id;
    }

    private static async Task<(int PostId, int ChoiceId)> SeedPollAsync(
        WebApiTestFactory factory,
        int playerId,
        string name
    )
    {
        await EnsurePlayerAsync(factory, playerId, name, visible: true);

        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        WebFeedPostEntity post = new() { PlayerEntityId = playerId, Kind = FeedPostKind.Poll, Body = "Pizza ou burger ?" };
        db.WebFeedPosts.Add(post);
        await db.SaveChangesAsync();

        WebFeedPollChoiceEntity choice = new() { WebFeedPostEntityId = post.Id, Ordinal = 0, Label = "Pizza" };
        db.WebFeedPollChoices.Add(choice);
        db.WebFeedPollChoices.Add(new WebFeedPollChoiceEntity { WebFeedPostEntityId = post.Id, Ordinal = 1, Label = "Burger" });
        await db.SaveChangesAsync();

        return (post.Id, choice.Id);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedReadTests`
Expected: FAIL — `IWebApiFeedService` and `WebApiFeedService` do not exist.

- [ ] **Step 3: Write the contract**

`Vortex.WebApi/Services/IWebApiFeedService.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Vortex.Primitives.Feed;

namespace Vortex.WebApi.Services;

/// <summary>One answer a poll offers, with how many took it.</summary>
public sealed record FeedPollChoice(int Id, string Label, int Votes);

/// <summary>
/// A post's poll. The percentages the page draws are computed there from
/// <paramref name="Votes"/> over <paramref name="TotalVotes"/>; the server sends counts, because a
/// percentage is a rendering decision and a count is a fact.
/// </summary>
public sealed record FeedPoll(int TotalVotes, int? MyChoiceId, IReadOnlyList<FeedPollChoice> Choices);

/// <summary>
/// One entry in the feed — or one comment, which is the same shape by construction.
/// </summary>
/// <remarks>
/// Flat, the way <see cref="PhotoSummary"/> is flat, rather than nesting an author object: the two
/// travel together on the same page and a reader should not have to hold two conventions.
/// <paramref name="Comments"/> holds the three most recent on a root and is empty on a comment —
/// the thread is one level deep, so a comment has none by definition.
/// </remarks>
public sealed record FeedPost(
    int Id,
    string AuthorUniqueId,
    string AuthorName,
    string AuthorFigureString,
    int? GroupId,
    string? GroupName,
    string? GroupBadgeCode,
    FeedPostKind Kind,
    string Body,
    DateTime CreatedAt,
    IReadOnlyList<PhotoSummary> Photos,
    FeedPoll? Poll,
    IReadOnlyList<string> Tags,
    int CommentCount,
    int RepostCount,
    int FavoriteCount,
    bool RepostedByMe,
    bool FavoritedByMe,
    bool Mine,
    IReadOnlyList<FeedPost> Comments
);

/// <summary>One page of the feed.</summary>
public sealed record FeedPage(int Page, int PageSize, int Total, IReadOnlyList<FeedPost> Items);

/// <summary>
/// The website's social feed.
/// </summary>
/// <remarks>
/// <para>
/// Every read here carries the same two conditions and they live in one place on purpose: the post
/// is not deleted, and its author is not hiding their profile. The second is the one worth keeping
/// in mind — a player who has hidden their profile has said they do not want to be browsed, and a
/// feed that still lists their posts under their name is the same disclosure by another door. It is
/// the rule <c>IWebApiPhotoService</c> states for the gallery, for the same reason.
/// </para>
/// <para>
/// Anonymous, like the gallery and the profile beside it. <c>viewerId</c> is the signed-in player
/// or null, and it decides only the "…ByMe" fields and <c>Mine</c>.
/// </para>
/// </remarks>
public interface IWebApiFeedService
{
    /// <summary>Root posts, newest first. <paramref name="tag"/> filters to one hashtag.</summary>
    Task<FeedPage> GetFeedAsync(int page, int pageSize, string? tag, int? viewerId, CancellationToken ct);

    /// <summary>One post with all of its comments, or null when it is not readable.</summary>
    Task<FeedPost?> GetPostAsync(int id, int? viewerId, CancellationToken ct);
}
```

- [ ] **Step 4: Write the implementation**

`Vortex.WebApi/Services/WebApiFeedService.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Vortex.Database.Context;
using Vortex.Database.Entities.Feed;
using Vortex.Primitives.Feed;

namespace Vortex.WebApi.Services;

/// <summary>
/// The feed's reads, out of <c>web_feed_posts</c> and the six tables that hang off it.
/// </summary>
/// <remarks>
/// <para>
/// The counters are correlated counts rather than columns. That is a deliberate ceiling: stored
/// counters would buy nothing at this hotel's size and cost three invalidation paths, one of which
/// is a soft delete that has to walk back over reactions. Revisit it if the feed grows past the
/// point where these measure badly — nothing above this class would change.
/// </para>
/// <para>
/// Photos are re-filtered here rather than trusted from <c>web_feed_post_photos</c>: the row says
/// which photo, and this says whether it is still public. A photo the owner unpublished after
/// posting it leaves the post.
/// </para>
/// </remarks>
public sealed class WebApiFeedService(IDbContextFactory<VortexDbContext> dbCtxFactory)
    : IWebApiFeedService
{
    private const int DefaultPageSize = 20;
    private const int MaximumPageSize = 50;

    /// <summary>What a card shows before "see all N comments" takes over — the screenshot's own count.</summary>
    private const int PreviewComments = 3;

    private readonly IDbContextFactory<VortexDbContext> _db = dbCtxFactory;

    public async Task<FeedPage> GetFeedAsync(
        int page,
        int pageSize,
        string? tag,
        int? viewerId,
        CancellationToken ct
    )
    {
        int wantedPage = page < 1 ? 1 : page;
        int wantedSize = pageSize switch
        {
            < 1 => DefaultPageSize,
            > MaximumPageSize => MaximumPageSize,
            _ => pageSize,
        };

        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        IQueryable<WebFeedPostEntity> roots = Readable(db).Where(p => p.ParentEntityId == null);

        if(!string.IsNullOrWhiteSpace(tag))
        {
            string wanted = Normalise(tag);

            roots = roots.Where(p => p.Tags.Any(t => t.WebFeedTagEntity!.Tag == wanted));
        }

        int total = await roots.CountAsync(ct).ConfigureAwait(false);

        List<WebFeedPostEntity> rows = await roots
            .OrderByDescending(p => p.CreatedAt)
            .ThenByDescending(p => p.Id)
            .Skip((wantedPage - 1) * wantedSize)
            .Take(wantedSize)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        List<FeedPost> items = [];

        foreach(WebFeedPostEntity row in rows)
        {
            items.Add(await ProjectAsync(db, row, viewerId, PreviewComments, ct).ConfigureAwait(false));
        }

        return new FeedPage(wantedPage, wantedSize, total, items);
    }

    public async Task<FeedPost?> GetPostAsync(int id, int? viewerId, CancellationToken ct)
    {
        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        WebFeedPostEntity? row = await Readable(db)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            .ConfigureAwait(false);

        return row is null ? null : await ProjectAsync(db, row, viewerId, int.MaxValue, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// The two conditions every read carries. Changing this changes who can be seen, so it exists
    /// once and every query starts from it.
    /// </summary>
    private static IQueryable<WebFeedPostEntity> Readable(VortexDbContext db) =>
        db.WebFeedPosts.Where(p => p.DeletedAt == null && p.PlayerEntity!.ProfileVisible);

    /// <summary>The search key a tag is stored and matched under.</summary>
    internal static string Normalise(string tag) => tag.Trim().TrimStart('#').ToLowerInvariant();

    private static async Task<FeedPost> ProjectAsync(
        VortexDbContext db,
        WebFeedPostEntity row,
        int? viewerId,
        int commentLimit,
        CancellationToken ct
    )
    {
        // Only a root has comments: the thread is one level deep, so a comment's own children are
        // an empty list rather than a query nobody answers.
        bool root = row.ParentEntityId is null;

        int commentCount = root
            ? await Readable(db).CountAsync(p => p.ParentEntityId == row.Id, ct).ConfigureAwait(false)
            : 0;

        List<FeedPost> comments = [];

        if(root && commentCount > 0 && commentLimit > 0)
        {
            // Newest last, the way a conversation reads, but the PREVIEW has to be the most recent
            // few — so the take is off the end and the order is restored afterwards.
            List<WebFeedPostEntity> rows = await Readable(db)
                .Where(p => p.ParentEntityId == row.Id)
                .OrderByDescending(p => p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .Take(commentLimit == int.MaxValue ? commentCount : commentLimit)
                .ToListAsync(ct)
                .ConfigureAwait(false);

            rows.Reverse();

            foreach(WebFeedPostEntity child in rows)
            {
                comments.Add(await ProjectAsync(db, child, viewerId, 0, ct).ConfigureAwait(false));
            }
        }

        List<PhotoSummary> photos = row.Kind != FeedPostKind.Photo
            ? []
            : await db
                .WebFeedPostPhotos.Where(link =>
                    link.WebFeedPostEntityId == row.Id
                    && link.CameraPhotoEntity!.PublishedAt != null
                    && link.CameraPhotoEntity.DeletedAt == null
                    && link.CameraPhotoEntity.PlayerEntity!.ProfileVisible
                )
                .OrderBy(link => link.Ordinal)
                .Select(link => new PhotoSummary(
                    link.CameraPhotoEntity!.PhotoKey,
                    link.CameraPhotoEntity.PlayerEntity!.UniqueId,
                    link.CameraPhotoEntity.PlayerEntity.Name,
                    link.CameraPhotoEntity.PlayerEntity.Figure,
                    link.CameraPhotoEntity.RoomEntityId,
                    null,
                    link.CameraPhotoEntity.CreatedAt,
                    0,
                    false,
                    new List<string>()
                ))
                .ToListAsync(ct)
                .ConfigureAwait(false);

        FeedPoll? poll = row.Kind != FeedPostKind.Poll
            ? null
            : await ProjectPollAsync(db, row.Id, viewerId, ct).ConfigureAwait(false);

        List<string> tags = await db
            .WebFeedPostTags.Where(t => t.WebFeedPostEntityId == row.Id)
            .Select(t => t.WebFeedTagEntity!.Tag)
            .ToListAsync(ct)
            .ConfigureAwait(false);

        int reposts = await db
            .WebFeedReactions.CountAsync(r => r.WebFeedPostEntityId == row.Id && r.Kind == FeedReactionKind.Repost, ct)
            .ConfigureAwait(false);

        int favorites = await db
            .WebFeedReactions.CountAsync(r => r.WebFeedPostEntityId == row.Id && r.Kind == FeedReactionKind.Favorite, ct)
            .ConfigureAwait(false);

        bool repostedByMe = viewerId is not null
            && await db
                .WebFeedReactions.AnyAsync(
                    r => r.WebFeedPostEntityId == row.Id && r.PlayerEntityId == viewerId && r.Kind == FeedReactionKind.Repost,
                    ct
                )
                .ConfigureAwait(false);

        bool favoritedByMe = viewerId is not null
            && await db
                .WebFeedReactions.AnyAsync(
                    r => r.WebFeedPostEntityId == row.Id && r.PlayerEntityId == viewerId && r.Kind == FeedReactionKind.Favorite,
                    ct
                )
                .ConfigureAwait(false);

        await db.Entry(row).Reference(p => p.PlayerEntity).LoadAsync(ct).ConfigureAwait(false);

        if(row.GroupEntityId is not null)
        {
            await db.Entry(row).Reference(p => p.GroupEntity).LoadAsync(ct).ConfigureAwait(false);
        }

        return new FeedPost(
            row.Id,
            row.PlayerEntity!.UniqueId,
            row.PlayerEntity.Name,
            row.PlayerEntity.Figure,
            row.GroupEntityId,
            row.GroupEntity?.Name,
            row.GroupEntity?.Badge,
            row.Kind,
            row.Body,
            row.CreatedAt,
            photos,
            poll,
            tags,
            commentCount,
            reposts,
            favorites,
            repostedByMe,
            favoritedByMe,
            viewerId is not null && row.PlayerEntityId == viewerId,
            comments
        );
    }

    private static async Task<FeedPoll> ProjectPollAsync(
        VortexDbContext db,
        int postId,
        int? viewerId,
        CancellationToken ct
    )
    {
        List<FeedPollChoice> choices = await db
            .WebFeedPollChoices.Where(c => c.WebFeedPostEntityId == postId)
            .OrderBy(c => c.Ordinal)
            .Select(c => new FeedPollChoice(
                c.Id,
                c.Label,
                db.WebFeedPollVotes.Count(v => v.WebFeedPollChoiceEntityId == c.Id)
            ))
            .ToListAsync(ct)
            .ConfigureAwait(false);

        int total = await db
            .WebFeedPollVotes.CountAsync(v => v.WebFeedPostEntityId == postId, ct)
            .ConfigureAwait(false);

        int? mine = viewerId is null
            ? null
            : await db
                .WebFeedPollVotes.Where(v => v.WebFeedPostEntityId == postId && v.PlayerEntityId == viewerId)
                .Select(v => (int?)v.WebFeedPollChoiceEntityId)
                .FirstOrDefaultAsync(ct)
                .ConfigureAwait(false);

        return new FeedPoll(total, mine, choices);
    }
}
```

**Before writing this file, open `Vortex.Database/Entities/Players/PlayerEntity.cs` and `Vortex.Database/Entities/Groups/GroupEntity.cs` and confirm the three member names used above** — `UniqueId`, `Figure`, and the group's badge property (spelled `Badge` here). `WebApiProfileService.cs` already reads all three; copy the spelling from there rather than from this plan, which was written from a reading of `PhotoSummary`'s construction and not from those two files.

- [ ] **Step 5: Register the service in both containers**

In `Vortex.WebApi/WebApiModule.cs`, beside `IWebApiPhotoService`:

```csharp
        services.TryAddSingleton<IWebApiFeedService, WebApiFeedService>();
```

In `Vortex.WebApi.Tests/WebApiTestFactory.cs`, beside the `WebApiPhotoService` registration at line ~161:

```csharp
        builder.Services.AddSingleton<IWebApiFeedService>(new WebApiFeedService(DbContexts));
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedReadTests`
Expected: PASS, 6 tests.

- [ ] **Step 7: Format and commit**

```bash
cd ../vortex-emulator
dotnet csharpier .
git commit -- Vortex.WebApi/Services/IWebApiFeedService.cs Vortex.WebApi/Services/WebApiFeedService.cs Vortex.WebApi/WebApiModule.cs Vortex.WebApi.Tests/WebApiTestFactory.cs Vortex.WebApi.Tests/FeedReadTests.cs -m "fil : la lecture du fil, racines seules et auteur non masque"
```

---

### Task 3: The two read routes

**Files:**
- Create: `../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.cs` (one `MapFeed` call beside `WebApiEndpointsCamera.MapCamera(app);` at line ~80)
- Modify: `../vortex-emulator/Vortex.WebApi/openapi.json` (regenerated, never edited)
- Modify: `packages/vortex-web/src/lib/api.generated.ts` (regenerated)
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedEndpointTests.cs`

**Interfaces:**
- Consumes: Task 2's `IWebApiFeedService`, `FeedPage`, `FeedPost`.
- Produces: `GET /api/public/feed`, `GET /api/public/feed/{id}`; OpenAPI operation names `Feed` and `FeedPost`; the generated TS schemas `FeedPage`, `FeedPost`, `FeedPoll`, `FeedPollChoice`.

- [ ] **Step 1: Write the failing test**

Create `../vortex-emulator/Vortex.WebApi.Tests/FeedEndpointTests.cs`:

```csharp
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Xunit;

namespace Vortex.WebApi.Tests;

/// <summary>The feed's routes, through the real routing pipeline.</summary>
public sealed class FeedEndpointTests
{
    [Fact]
    public async Task Feed_IsAnonymous()
    {
        await using WebApiTestFactory factory = new();

        using HttpResponseMessage response = await factory.Client.GetAsync("/api/public/feed");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        JsonElement page = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;

        page.GetProperty("total").GetInt32().Should().Be(0);
        page.GetProperty("items").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Post_AnswersNotFoundWithACode()
    {
        await using WebApiTestFactory factory = new();

        using HttpResponseMessage response = await factory.Client.GetAsync("/api/public/feed/404");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);

        JsonDocument.Parse(await response.Content.ReadAsStringAsync())
            .RootElement.GetProperty("error")
            .GetString()
            .Should()
            .Be("feed_post_not_found");
    }
}
```

**Confirm the client property's name first.** Open `Vortex.WebApi.Tests/PhotoEndpointTests.cs` and read its `GetJsonAsync` helper: it names whatever `WebApiTestFactory` exposes as its `HttpClient`. Use that name here instead of `factory.Client` if it differs.

- [ ] **Step 2: Run the test to verify it fails**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedEndpointTests`
Expected: FAIL — both routes 404 with no body.

- [ ] **Step 3: Write the endpoints**

`Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs`:

```csharp
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Vortex.WebApi.Services;
using Vortex.WebApi.Session;

namespace Vortex.WebApi.Hosting;

/// <summary>
/// The website's social feed.
/// </summary>
/// <remarks>
/// The reads are anonymous, like the photo gallery and the profile: a feed is a page a signed-out
/// visitor opens. The session is still read, because it decides the "…ByMe" fields and nothing
/// else.
/// </remarks>
internal static partial class WebApiEndpointsFeed
{
    public static void MapFeed(WebApplication app, string tagPublic)
    {
        app.MapGet(
                "/api/public/feed",
                async Task<Ok<FeedPage>> (
                    HttpContext ctx,
                    int? page,
                    int? pageSize,
                    string? tag,
                    // [FromServices] rather than left to inference: an unknown service is inferred
                    // as a request body, a GET may not have one, and the whole route table then
                    // fails to build.
                    [FromServices] IWebApiFeedService feed,
                    [FromServices] WebApiSessionStore sessions,
                    [FromServices] IWebApiPlayerService players,
                    CancellationToken ct
                ) =>
                    TypedResults.Ok(
                        await feed
                            .GetFeedAsync(
                                page ?? 1,
                                pageSize ?? 0,
                                tag,
                                (
                                    await WebApiEndpoints
                                        .SelectedPlayerAsync(ctx, sessions, players, ct)
                                        .ConfigureAwait(false)
                                ).PlayerId,
                                ct
                            )
                            .ConfigureAwait(false)
                    )
            )
            .WithName("Feed")
            .WithSummary("The social feed: every post, newest first.")
            .WithTags(tagPublic);

        app.MapGet(
                "/api/public/feed/{id:int}",
                async Task<Results<Ok<FeedPost>, NotFound<ApiErrorResponse>>> (
                    HttpContext ctx,
                    int id,
                    [FromServices] IWebApiFeedService feed,
                    [FromServices] WebApiSessionStore sessions,
                    [FromServices] IWebApiPlayerService players,
                    CancellationToken ct
                ) =>
                {
                    (int? viewerId, _) = await WebApiEndpoints
                        .SelectedPlayerAsync(ctx, sessions, players, ct)
                        .ConfigureAwait(false);

                    FeedPost? post = await feed.GetPostAsync(id, viewerId, ct).ConfigureAwait(false);

                    return post is null
                        ? TypedResults.NotFound(new ApiErrorResponse("feed_post_not_found"))
                        : TypedResults.Ok(post);
                }
            )
            .WithName("FeedPost")
            .WithSummary("One post and its comments.")
            .WithTags(tagPublic);
    }
}
```

`SelectedPlayerAsync` and `ApiErrorResponse` are `private`/internal members of `WebApiEndpoints` today. **Read `WebApiEndpoints.cs` around the helper's declaration and widen it to `internal static` if it is `private static`** — that is the only change to that file besides the map call, and it is the same widening `WebApiEndpointsCollectibles` would have needed. If widening is awkward, pass the viewer id in: change `MapFeed`'s signature to take a `Func<HttpContext, CancellationToken, Task<int?>>` and keep the helper private. Prefer the widening; the indirection is not worth it for two routes.

- [ ] **Step 4: Register the map**

In `Vortex.WebApi/Hosting/WebApiEndpoints.cs`, beside `WebApiEndpointsCamera.MapCamera(app);` at line ~80:

```csharp
        WebApiEndpointsFeed.MapFeed(app, TagPublic);
```

- [ ] **Step 5: Run the endpoint tests to verify they pass**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedEndpointTests`
Expected: PASS, 2 tests.

- [ ] **Step 6: Regenerate `openapi.json`**

Run: `dotnet test Vortex.WebApi.Tests --filter OpenApiDocumentTests`
Expected: FAIL the first time, with "the API's shape changed and openapi.json did not". Read the failure message — it says how to rerun the test so it writes the file — do that, then run it again.
Expected: PASS, and `git status` shows `Vortex.WebApi/openapi.json` modified.

- [ ] **Step 7: Regenerate the front's types**

Run from this checkout's root: `pnpm --filter vortex-web api:types`
Then: `grep -c "FeedPage\|FeedPost" packages/vortex-web/src/lib/api.generated.ts`
Expected: a non-zero count.

- [ ] **Step 8: Full suite, format, commit**

```bash
cd ../vortex-emulator
dotnet test Vortex.WebApi.Tests
dotnet csharpier .
git commit -- Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs Vortex.WebApi/Hosting/WebApiEndpoints.cs Vortex.WebApi/openapi.json Vortex.WebApi.Tests/FeedEndpointTests.cs -m "fil : les deux routes de lecture"
cd -
git commit -- packages/vortex-web/src/lib/api.generated.ts -m "web : les types du fil"
```

---

### Task 4: The page, rendering a real feed

**Files:**
- Create: `packages/vortex-web/src/lib/feed.ts`
- Create: `packages/vortex-web/src/components/feed/FeedBody.svelte`
- Create: `packages/vortex-web/src/components/feed/FeedPost.svelte`
- Create: `packages/vortex-web/src/pages/community/Chats.svelte`
- Modify: `packages/vortex-web/src/lib/tabs.ts` (one entry in `COMMUNITY_TABS`)
- Modify: `packages/vortex-web/src/lib/routes.ts` (one route)
- Modify: `packages/vortex-web/src/locales/site/fr.json`, `packages/vortex-web/src/locales/site/en.json`

**Interfaces:**
- Consumes: Task 3's `GET /api/public/feed` and the generated `FeedPage` / `FeedPost` schemas.
- Produces: `getFeed(options)` and `getPost(id)` in `lib/feed.ts`; `<FeedPost post={…} />`; `<FeedBody body={…} />`; the route `/community/chats`.

- [ ] **Step 1: Write `lib/feed.ts`**

```ts
// The social feed's half of the API — see
// ../../../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs, which is the contract
// this file mirrors. Split out of `api.ts` rather than added to it because that file is already
// 788 lines and every screen imports it; nothing outside the feed needs these six calls.
//
// The payload types are not written here either: they come from `api.generated.ts`, produced from
// the API's own OpenAPI document by `pnpm api:types`.
import type {components} from './api.generated';
import {request} from './api.js';

type Schemas = components['schemas'];

export type IFeedPost = Schemas['FeedPost'];
export type IFeedPage = Schemas['FeedPage'];
export type IFeedPoll = Schemas['FeedPoll'];
export type IFeedPollChoice = Schemas['FeedPollChoice'];

// The kinds come across as their numbers, which is what the wire carries — see
// Vortex.Primitives/Feed/FeedPostKind.cs, where they are decided. Naming them here keeps
// `kind === 1` out of the components.
export const FEED_KIND = {
    STATUS: 0,
    PHOTO: 1,
    POLL: 2,
} as const;

export const FEED_REACTION = {
    REPOST: 0,
    FAVORITE: 1,
} as const;

/** The feed, newest first. `tag` filters to one hashtag; it may be written with or without its `#`. */
export function getFeed(options: {page?: number; pageSize?: number; tag?: string} = {}): Promise<IFeedPage>
{
    const query = new URLSearchParams();

    if(options.page)
    {
        query.set('page', String(options.page));
    }

    if(options.pageSize)
    {
        query.set('pageSize', String(options.pageSize));
    }

    if(options.tag)
    {
        query.set('tag', options.tag);
    }

    return request(`/api/public/feed${query.size ? `?${query}` : ''}`);
}

/** One post and all of its comments. Throws `feed_post_not_found` for an id that is not readable. */
export function getPost(id: number): Promise<IFeedPost>
{
    return request(`/api/public/feed/${id}`);
}
```

`request` is `async function request<T>(path, options)` in `api.ts` and is **not exported today**. Add `export` to its declaration (`src/lib/api.ts:179`) — it is the same helper, and a second copy here would be a second place for the credentials mode and the `ApiError` mapping to drift.

- [ ] **Step 2: Write `FeedBody.svelte`**

```svelte
<script lang="ts">
    // A post's text, with its hashtags turned into links onto the feed filtered by that tag.
    //
    // Split on the tag pattern and render the pieces, never `{@html}`: the body is a player's own
    // text and this is the one place on the site where a player's text reaches the page. An
    // interpolated `<script>` would be theirs, not ours.
    import {link} from 'svelte-spa-router';

    let {body = ''} = $props();

    // The same shape the server extracts with — a `#` then letters, digits or underscore. Kept in
    // sync by hand with FeedTags.Pattern in the emulator; a mismatch shows as a tag that renders
    // plain or a link that finds nothing.
    const TAG = /(#[\p{L}\p{N}_]+)/gu;

    let pieces = $derived(body.split(TAG));
</script>

{#each pieces as piece, index (index)}{#if index % 2}<a
            href="/community/chats?tag={encodeURIComponent(piece.slice(1))}"
            use:link
            class="text-ink hover:underline">{piece}</a>{:else}{piece}{/if}{/each}
```

- [ ] **Step 3: Write `FeedPost.svelte`**

```svelte
<script lang="ts">
    // One card in the feed. It renders a comment too — a comment IS a post with a parent, so the
    // component recurses rather than existing twice.
    //
    // The screenshot's card is a `.aside--box` with its title bled into a darker band across the
    // top, which is exactly what `Panel` does, so the header is Panel's own title band and not a
    // second implementation of it.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import FeedBody from './FeedBody.svelte';
    import {FEED_KIND, type IFeedPost} from '../../lib/feed.js';
    import {photoUrl} from '../../lib/api.js';
    import {t} from '../../lib/i18n.js';

    let {post, comment = false}: {post: IFeedPost; comment?: boolean} = $props();

    // "PRODIIGY published 2 new pictures" / "posted a new poll" / "updated his/her status" — the
    // screenshot's three headings, one per kind.
    let heading = $derived(
        post.kind === FEED_KIND.PHOTO
            ? t('SITE_FEED_PUBLISHED_PICTURES', {count: String(post.photos?.length ?? 0)})
            : post.kind === FEED_KIND.POLL
              ? t('SITE_FEED_POSTED_POLL')
              : t('SITE_FEED_UPDATED_STATUS'),
    );
</script>

<article class="flex gap-3">
    <Avatar user={post.groupName ? '' : post.authorName} figure={post.authorFigureString} headOnly className="hidden shrink-0 xs:block" />

    <div class="min-w-0 flex-1">
        <Panel title="{post.groupName ?? post.authorName}  {heading}" className={comment ? 'bg-panel-head' : ''}>
            <p class="mb-3"><FeedBody body={post.body} /></p>

            {#if post.kind === FEED_KIND.PHOTO && post.photos?.length}
                <div class="mb-3 grid grid-cols-2 gap-1">
                    {#each post.photos as photo (photo.key)}
                        <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                    {/each}
                </div>
            {/if}

            <!-- The counters bar. Its two reaction controls arrive in Task 8; until then it states
                 the numbers, which is what a signed-out visitor sees in any case. -->
            <div class="flex items-baseline gap-6 border-t border-rule pt-3 text-sm">
                <span><b>{post.commentCount}</b> {t('SITE_FEED_COMMENTS')}</span>
                <span class="ml-auto"><b>{post.repostCount}</b> {t('SITE_FEED_REPOSTS')}</span>
                <span><b>{post.favoriteCount}</b> {t('SITE_FEED_FAVORITES')}</span>
            </div>
        </Panel>

        {#if !comment && post.comments?.length}
            <div class="mt-3 flex flex-col gap-3 pl-6">
                {#each post.comments as child (child.id)}
                    <svelte:self post={child} comment />
                {/each}
            </div>
        {/if}
    </div>
</article>
```

`<svelte:self>` is removed in Svelte 5 — a component can import itself by name. If `svelte-check` rejects it, replace the `<svelte:self post={child} comment />` with `<FeedPost post={child} comment />` and add `import FeedPost from './FeedPost.svelte';` to the script. Check which one this version accepts rather than assuming; the package pins `svelte ^5.56.3`.

`photoUrl` is already exported from `api.ts` (`src/lib/api.ts:360`).

- [ ] **Step 4: Write `Chats.svelte`**

```svelte
<script lang="ts">
    // The social feed. Ours, not habbo.com's — see the note on COMMUNITY_TABS in lib/tabs.ts.
    //
    // Built from a single screenshot of a 2015-era Habbo dashboard, which is in no dump in this
    // repository; the layout below is `ContentAside`, the site's own main+304px split, because that
    // is the proportion the screenshot has and the one every other content page here already uses.
    import CommunityShell from './CommunityShell.svelte';
    import PageHeader from '../../components/PageHeader.svelte';
    import ContentAside from '../../components/ContentAside.svelte';
    import EmptyResults from '../../components/EmptyResults.svelte';
    import FeedPost from '../../components/feed/FeedPost.svelte';
    import {getFeed, type IFeedPost} from '../../lib/feed.js';
    import {t} from '../../lib/i18n.js';

    let posts = $state<IFeedPost[]>([]);
    let loading = $state(true);

    $effect(() =>
    {
        let cancelled = false;

        void getFeed()
            .then((answer) => !cancelled && (posts = answer.items ?? []))
            .catch(() => !cancelled && (posts = []))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
</script>

<CommunityShell>
    <PageHeader title={t('SITE_FEED_TITLE')} description={t('SITE_FEED_DESCRIPTION')} />

    <ContentAside>
        <div class="flex flex-col gap-6">
            {#each posts as post (post.id)}
                <FeedPost {post} />
            {/each}

            {#if !loading && !posts.length}
                <EmptyResults className="py-12" />
            {/if}
        </div>
    </ContentAside>
</CommunityShell>
```

Open `PageHeader.svelte` and `EmptyResults.svelte` before writing this and match their actual prop names; `Photos.svelte` uses `title`, `description`, `illustration` and `className`, which is where those above come from.

- [ ] **Step 5: Register the tab and the route**

In `src/lib/tabs.ts`, in `COMMUNITY_TABS`, immediately before the news entry (the news tab is last in habbo.com's own order and stays last):

```ts
    // DEVIATION: habbo.com has no such tab. The feed is this hotel's, built from a screenshot of a
    // 2015-era dashboard; habbo.com's own community section has no social feed at all. Its label
    // and every string on its page are ours, in src/locales/site/.
    {path: '/community/chats', translationKey: 'SITE_FEED_TAB'},
```

In `src/lib/routes.ts`, beside the other `/community/*` routes:

```ts
    '/community/chats': open(() => import('../pages/community/Chats.svelte')),
```

- [ ] **Step 6: Add the keys**

In `src/locales/site/fr.json`:

```json
    "SITE_FEED_TAB": "Discussions",
    "SITE_FEED_TITLE": "Discussions",
    "SITE_FEED_DESCRIPTION": "Ce que l'hôtel raconte, en direct.",
    "SITE_FEED_COMMENTS": "Commentaires",
    "SITE_FEED_REPOSTS": "Partages",
    "SITE_FEED_FAVORITES": "Favoris",
    "SITE_FEED_PUBLISHED_PICTURES": "a publié {{count}} nouvelles images",
    "SITE_FEED_POSTED_POLL": "a lancé un sondage",
    "SITE_FEED_UPDATED_STATUS": "a mis à jour son statut",
```

In `src/locales/site/en.json`:

```json
    "SITE_FEED_TAB": "Chats",
    "SITE_FEED_TITLE": "Chats",
    "SITE_FEED_DESCRIPTION": "What the hotel is talking about, live.",
    "SITE_FEED_COMMENTS": "Comments",
    "SITE_FEED_REPOSTS": "Reposts",
    "SITE_FEED_FAVORITES": "Favorites",
    "SITE_FEED_PUBLISHED_PICTURES": "published {{count}} new pictures",
    "SITE_FEED_POSTED_POLL": "posted a new poll",
    "SITE_FEED_UPDATED_STATUS": "updated his/her status",
```

**Check `t()`'s interpolation syntax before writing `{{count}}`.** Open `src/lib/i18n.ts` and read how it substitutes values — habbo.com's own keys are the reference, and if it uses a different delimiter, use that one.

- [ ] **Step 7: Type-check**

Run: `pnpm --filter vortex-web check`
Expected: no error in the four new files.

- [ ] **Step 8: See it in a browser**

Run `pnpm web`, open `http://localhost:5174/community/chats`.
Expected with no rows in `web_feed_posts`: the tab is in the bar and lit, the page header renders, and the empty state shows. Insert two rows by hand (a root and a comment, `player_id` an existing player with `profile_visible = 1`) and reload: a card with the comment nested under it.

- [ ] **Step 9: Commit**

```bash
git commit -- packages/vortex-web/src/lib/feed.ts packages/vortex-web/src/lib/api.ts packages/vortex-web/src/lib/tabs.ts packages/vortex-web/src/lib/routes.ts packages/vortex-web/src/components/feed packages/vortex-web/src/pages/community/Chats.svelte packages/vortex-web/src/locales/site -m "web : l onglet discussions affiche un vrai fil"
```

---

### Task 5: Publishing a status

**Files:**
- Modify: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs` (add `PublishAsync`, `FeedPublishRequest`, `FeedRefusal`)
- Modify: `../vortex-emulator/Vortex.WebApi/Services/WebApiFeedService.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs`
- Create: `packages/vortex-web/src/components/feed/FeedComposer.svelte`
- Modify: `packages/vortex-web/src/pages/community/Chats.svelte`
- Modify: `packages/vortex-web/src/lib/feed.ts`
- Modify: `packages/vortex-web/src/locales/site/{fr,en}.json`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedPublishTests.cs`

**Interfaces:**
- Consumes: Task 2's service and records; Task 4's page.
- Produces:
  - `record FeedPublishRequest(FeedPostKind Kind, string Body, IReadOnlyList<string>? PhotoKeys, IReadOnlyList<string>? PollChoices, int? ParentId, int? GroupId)`
  - `enum FeedRefusal { None, BodyTooLong, BodyEmpty, TooManyPhotos, PhotoNotYours, PollInvalid, ParentNotFound, ParentNotRoot, GroupNotMember, KindMismatch }`
  - `IWebApiFeedService.PublishAsync(int playerId, FeedPublishRequest body, CancellationToken ct) → Task<(FeedRefusal Refusal, FeedPost? Post)>`
  - `POST /api/user/feed`
  - `publish(body)` in `lib/feed.ts`

- [ ] **Step 1: Write the failing test**

Create `../vortex-emulator/Vortex.WebApi.Tests/FeedPublishTests.cs`. Reuse the seeding helpers from `FeedReadTests` by copying them in — they are private statics there, and a shared helper class is not worth introducing for two files.

```csharp
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Database.Context;
using Vortex.Database.Entities.Players;
using Vortex.Primitives.Feed;
using Vortex.Primitives.Players.Enums;
using Vortex.WebApi.Services;
using Xunit;

namespace Vortex.WebApi.Tests;

/// <summary>
/// What the feed refuses to be told.
/// </summary>
/// <remarks>
/// This is the trust boundary of the whole feature: everything here arrives from a browser and
/// nothing about it is believed. The rule most easily lost in a later edit is the photo ownership
/// check — without it a player attaches somebody else's published photo and it appears under their
/// own name, which looks like a feature until it is used.
/// </remarks>
public sealed class FeedPublishTests
{
    [Fact]
    public async Task AStatusPublishes()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        (FeedRefusal refusal, FeedPost? post) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default);

        refusal.Should().Be(FeedRefusal.None);
        post!.Body.Should().Be("coucou");
        post.Mine.Should().BeTrue();
    }

    [Fact]
    public async Task AnEmptyStatusIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "   ", null, null, null, null), default);

        refusal.Should().Be(FeedRefusal.BodyEmpty);
    }

    [Fact]
    public async Task ABodyOverTheCapIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, new string('a', 501), null, null, null, null), default);

        refusal.Should().Be(FeedRefusal.BodyTooLong);
    }

    [Fact]
    public async Task APollWithOneChoiceIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Synes");

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "Pizza ?", null, ["Oui"], null, null), default);

        refusal.Should().Be(FeedRefusal.PollInvalid);
    }

    [Fact]
    public async Task APollPublishesItsChoicesInOrder()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Synes");

        (FeedRefusal refusal, FeedPost? post) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "Pizza ou burger ?", null, ["Pizza", "Burger", "Les deux"], null, null), default);

        refusal.Should().Be(FeedRefusal.None);
        post!.Poll!.Choices.Select(c => c.Label).Should().Equal("Pizza", "Burger", "Les deux");
        post.Poll.TotalVotes.Should().Be(0);
    }

    [Fact]
    public async Task AGroupTheAuthorIsNotInIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "au nom du groupe", null, null, null, 99), default);

        refusal.Should().Be(FeedRefusal.GroupNotMember);
    }

    private static IWebApiFeedService Service(WebApiTestFactory factory) =>
        new WebApiFeedService(factory.DbContexts);

    private static async Task PlayerAsync(WebApiTestFactory factory, int id, string name)
    {
        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        db.Players.Add(new PlayerEntity
        {
            Id = id,
            Name = name,
            Figure = "hr-115",
            Gender = AvatarGenderType.Male,
            PlayerStatus = PlayerStatusType.Offline,
            PlayerPerks = PlayerPerkFlags.None,
            ProfileVisible = true,
        });

        await db.SaveChangesAsync();
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedPublishTests`
Expected: FAIL — `PublishAsync`, `FeedPublishRequest` and `FeedRefusal` do not exist.

- [ ] **Step 3: Add the contract**

Append to `Vortex.WebApi/Services/IWebApiFeedService.cs`:

```csharp
/// <summary>What the composer sends.</summary>
/// <remarks>
/// Photos arrive as KEYS because that is what the browser knows — the gallery hands it keys and
/// <c>photoUrl</c> builds a url out of one. The service resolves each to a row and stores the row's
/// id; a key that resolves to nothing is a refusal, never a quietly skipped photo.
/// </remarks>
public sealed record FeedPublishRequest(
    FeedPostKind Kind,
    string Body,
    IReadOnlyList<string>? PhotoKeys,
    IReadOnlyList<string>? PollChoices,
    int? ParentId,
    int? GroupId
);

/// <summary>Why a publish was refused, or <see cref="None"/>.</summary>
public enum FeedRefusal
{
    None = 0,
    BodyEmpty,
    BodyTooLong,
    TooManyPhotos,
    PhotoNotYours,
    PollInvalid,
    ParentNotFound,
    ParentNotRoot,
    GroupNotMember,
    KindMismatch,
}
```

And on the interface:

```csharp
    /// <summary>
    /// Publishes a post, or a comment when <see cref="FeedPublishRequest.ParentId"/> is set.
    /// </summary>
    /// <remarks>
    /// Every field is validated here and nowhere else, so the endpoint stays a translation from a
    /// refusal to a status code and the rules cannot be bypassed by a second caller.
    /// </remarks>
    Task<(FeedRefusal Refusal, FeedPost? Post)> PublishAsync(
        int playerId,
        FeedPublishRequest body,
        CancellationToken ct
    );
```

- [ ] **Step 4: Implement `PublishAsync`**

Add to `WebApiFeedService`, with `using Vortex.Database.Entities.Groups;`:

```csharp
    /// <summary>The screenshot's card shows two; four is the most a two-column grid draws well.</summary>
    private const int MaximumPhotos = 4;

    private const int MinimumChoices = 2;
    private const int MaximumChoices = 5;

    public async Task<(FeedRefusal Refusal, FeedPost? Post)> PublishAsync(
        int playerId,
        FeedPublishRequest body,
        CancellationToken ct
    )
    {
        string text = (body.Body ?? string.Empty).Trim();

        if(text.Length > WebFeedPostEntity.BodyLength)
        {
            return (FeedRefusal.BodyTooLong, null);
        }

        IReadOnlyList<string> keys = body.PhotoKeys ?? [];
        IReadOnlyList<string> choices =
            (body.PollChoices ?? []).Select(c => (c ?? string.Empty).Trim()).Where(c => c.Length > 0).ToList();

        // The kind has to agree with what came with it, in both directions: a Photo post with no
        // photos renders as an empty card, and a Status post carrying poll choices would silently
        // drop them.
        bool agrees = body.Kind switch
        {
            FeedPostKind.Status => keys.Count == 0 && choices.Count == 0,
            FeedPostKind.Photo => keys.Count > 0 && choices.Count == 0,
            FeedPostKind.Poll => keys.Count == 0 && choices.Count > 0,
            _ => false,
        };

        if(!agrees)
        {
            return (FeedRefusal.KindMismatch, null);
        }

        // Text is required except on a photo post, where the pictures are the content.
        if(text.Length == 0 && body.Kind != FeedPostKind.Photo)
        {
            return (FeedRefusal.BodyEmpty, null);
        }

        if(keys.Count > MaximumPhotos)
        {
            return (FeedRefusal.TooManyPhotos, null);
        }

        if(body.Kind == FeedPostKind.Poll
            && (choices.Count < MinimumChoices
                || choices.Count > MaximumChoices
                || choices.Any(c => c.Length > WebFeedPollChoiceEntity.LabelLength)))
        {
            return (FeedRefusal.PollInvalid, null);
        }

        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        if(body.ParentId is int parentId)
        {
            WebFeedPostEntity? parent = await db
                .WebFeedPosts.FirstOrDefaultAsync(p => p.Id == parentId && p.DeletedAt == null, ct)
                .ConfigureAwait(false);

            if(parent is null)
            {
                return (FeedRefusal.ParentNotFound, null);
            }

            // One level deep. A reply to a reply would make the thread a tree, which the page this
            // serves does not draw and the read path does not walk.
            if(parent.ParentEntityId is not null)
            {
                return (FeedRefusal.ParentNotRoot, null);
            }
        }

        if(body.GroupId is int groupId)
        {
            bool member = await db
                .GroupMembers.AnyAsync(m => m.GroupEntityId == groupId && m.PlayerEntityId == playerId, ct)
                .ConfigureAwait(false);

            if(!member)
            {
                return (FeedRefusal.GroupNotMember, null);
            }
        }

        // The photos, resolved from keys to rows, each one checked to be this player's and public.
        List<int> photoIds = [];

        foreach(string key in keys)
        {
            int id = await db
                .CameraPhotos.Where(p =>
                    p.PhotoKey == key
                    && p.PlayerEntityId == playerId
                    && p.PublishedAt != null
                    && p.DeletedAt == null
                )
                .Select(p => p.Id)
                .FirstOrDefaultAsync(ct)
                .ConfigureAwait(false);

            if(id == 0)
            {
                return (FeedRefusal.PhotoNotYours, null);
            }

            photoIds.Add(id);
        }

        WebFeedPostEntity post = new()
        {
            PlayerEntityId = playerId,
            GroupEntityId = body.GroupId,
            ParentEntityId = body.ParentId,
            Kind = body.Kind,
            Body = text,
        };

        db.WebFeedPosts.Add(post);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        for(int i = 0; i < photoIds.Count; i++)
        {
            db.WebFeedPostPhotos.Add(new WebFeedPostPhotoEntity
            {
                WebFeedPostEntityId = post.Id,
                CameraPhotoEntityId = photoIds[i],
                Ordinal = i,
            });
        }

        for(int i = 0; i < choices.Count; i++)
        {
            db.WebFeedPollChoices.Add(new WebFeedPollChoiceEntity
            {
                WebFeedPostEntityId = post.Id,
                Ordinal = i,
                Label = choices[i],
            });
        }

        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return (FeedRefusal.None, await GetPostAsync(post.Id, playerId, ct).ConfigureAwait(false));
    }
```

**Confirm `db.GroupMembers` and `GroupMemberEntity`'s two foreign-key property names** against `Vortex.Database/Entities/Groups/GroupMemberEntity.cs` before writing this — `WebApiProfileService.cs:160` already queries that table and is the shorter read.

- [ ] **Step 5: Run the test to verify it passes**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedPublishTests`
Expected: PASS, 6 tests.

- [ ] **Step 6: Add the endpoint**

In `WebApiEndpoints.Feed.cs`, in `MapFeed`, adding a `string tagUser` parameter to the method and passing `TagUser` at the call site in `WebApiEndpoints.cs`:

```csharp
        app.MapPost(
                "/api/user/feed",
                async Task<Results<Ok<FeedPost>, BadRequest<ApiErrorResponse>, NotFound<ApiErrorResponse>, UnauthorizedError>> (
                    HttpContext ctx,
                    FeedPublishRequest body,
                    [FromServices] IWebApiFeedService feed,
                    [FromServices] WebApiSessionStore sessions,
                    [FromServices] IWebApiPlayerService players,
                    CancellationToken ct
                ) =>
                {
                    (int? playerId, IResult? refused) = await WebApiEndpoints
                        .SelectedPlayerAsync(ctx, sessions, players, ct)
                        .ConfigureAwait(false);

                    if(playerId is null)
                    {
                        // No session, or a session with no avatar: a post belongs to a PLAYER, and
                        // an account without one has nobody to attribute it to.
                        return refused is UnauthorizedError unauthorized
                            ? unauthorized
                            : TypedResults.NotFound(new ApiErrorResponse("pocket.auth.no_avatars"));
                    }

                    (FeedRefusal refusal, FeedPost? post) = await feed
                        .PublishAsync(playerId.Value, body, ct)
                        .ConfigureAwait(false);

                    return refusal switch
                    {
                        FeedRefusal.None => TypedResults.Ok(post!),
                        FeedRefusal.ParentNotFound => TypedResults.NotFound(new ApiErrorResponse("feed_post_not_found")),
                        _ => TypedResults.BadRequest(new ApiErrorResponse(Code(refusal))),
                    };
                }
            )
            .WithName("FeedPublish")
            .WithSummary("Publish a post, or a comment on one.")
            .WithTags(tagUser);
```

And, in the same file:

```csharp
    /// <summary>
    /// A refusal to the code the website words. One code per reason rather than a single
    /// "invalid": the composer has three tabs and a reader has to be told which one is wrong.
    /// </summary>
    private static string Code(FeedRefusal refusal) =>
        refusal switch
        {
            FeedRefusal.BodyEmpty => "feed_body_empty",
            FeedRefusal.BodyTooLong => "feed_body_too_long",
            FeedRefusal.TooManyPhotos => "feed_too_many_photos",
            FeedRefusal.PhotoNotYours => "feed_photo_not_yours",
            FeedRefusal.PollInvalid => "feed_poll_invalid",
            FeedRefusal.ParentNotRoot => "feed_parent_not_root",
            FeedRefusal.GroupNotMember => "feed_group_not_member",
            _ => "feed_invalid",
        };
```

- [ ] **Step 7: Regenerate and run everything**

```bash
cd ../vortex-emulator
dotnet test Vortex.WebApi.Tests --filter OpenApiDocumentTests   # writes openapi.json, rerun until green
dotnet test Vortex.WebApi.Tests
dotnet csharpier .
cd -
pnpm --filter vortex-web api:types
```

- [ ] **Step 8: Add `publish` to `lib/feed.ts`**

```ts
/** Publish a post, or a comment when `parentId` is set. */
export function publish(body: {
    kind: number;
    body: string;
    photoKeys?: string[];
    pollChoices?: string[];
    parentId?: number;
    groupId?: number;
}): Promise<IFeedPost>
{
    return request('/api/user/feed', {method: 'POST', body});
}
```

- [ ] **Step 9: Word the refusals**

In `src/lib/api.ts`, in the `ERRORS` map, add:

```ts
    feed_body_empty: 'SITE_ERROR_FEED_BODY_EMPTY',
    feed_body_too_long: 'SITE_ERROR_FEED_BODY_TOO_LONG',
    feed_too_many_photos: 'SITE_ERROR_FEED_TOO_MANY_PHOTOS',
    feed_photo_not_yours: 'SITE_ERROR_FEED_PHOTO_NOT_YOURS',
    feed_poll_invalid: 'SITE_ERROR_FEED_POLL_INVALID',
    feed_parent_not_root: 'SITE_ERROR_FEED_PARENT_NOT_ROOT',
    feed_group_not_member: 'SITE_ERROR_FEED_GROUP_NOT_MEMBER',
    feed_post_not_found: 'SITE_ERROR_FEED_POST_NOT_FOUND',
```

with a French and an English sentence for each of the eight keys in `src/locales/site/{fr,en}.json`.

- [ ] **Step 10: Write the composer, status tab only**

`packages/vortex-web/src/components/feed/FeedComposer.svelte`:

```svelte
<script lang="ts">
    // The composer, and the comment form: the screenshot shows the same control in both places,
    // with the same three tabs, so it is one component with a `parentId`.
    //
    // The photo and poll tabs arrive in Tasks 6 and 7; the tab strip is here from the start
    // because it is what tells a reader the other two are coming, and because moving a working
    // form into a tab later is how a working form stops working.
    import Panel from '../Panel.svelte';
    import Avatar from '../Avatar.svelte';
    import Button from '../Button.svelte';
    import {publish, FEED_KIND, type IFeedPost} from '../../lib/feed.js';
    import {notifier} from '../../lib/notifier.js';
    import {t} from '../../lib/i18n.js';

    let {parentId = undefined, onpublished}: {parentId?: number; onpublished: (post: IFeedPost) => void} =
        $props();

    let body = $state('');
    let busy = $state(false);

    async function submit()
    {
        if(busy || !body.trim())
        {
            return;
        }

        busy = true;

        try
        {
            onpublished(await publish({kind: FEED_KIND.STATUS, body, parentId}));
            body = '';
        }
        catch(error)
        {
            notifier.error((error as {key?: string}).key ?? 'SITE_ERROR_UNKNOWN');
        }
        finally
        {
            busy = false;
        }
    }
</script>

<Panel title={t(parentId ? 'SITE_FEED_WRITE_AS' : 'SITE_FEED_POST_AS')}>
    <div class="flex gap-3">
        <Avatar headOnly className="hidden shrink-0 xs:block" />

        <div class="min-w-0 flex-1">
            <textarea
                bind:value={body}
                maxlength="500"
                rows="3"
                placeholder={t(parentId ? 'SITE_FEED_COMMENT_PLACEHOLDER' : 'SITE_FEED_POST_PLACEHOLDER')}
                class="w-full rounded-[3px] bg-field px-2 py-1 text-field-ink shadow-field"
            ></textarea>

            <div class="mt-2 flex justify-end">
                <Button onclick={submit} disabled={busy || !body.trim()}>
                    {t(parentId ? 'SITE_FEED_PUBLISH_COMMENT' : 'SITE_FEED_PUBLISH')}
                </Button>
            </div>
        </div>
    </div>
</Panel>
```

**Read `Button.svelte` and `notifier.ts` for their real prop and export names before writing this** — `Button` may take `onclick` or a snippet child, and `notifier` exports a store plus helpers whose exact shape is in the file. Read `ApiError` in `api.ts` too: the property that carries the resolved key may not be called `key`.

- [ ] **Step 11: Mount it on the page**

In `Chats.svelte`, above the feed, with `import {signedIn} from '../../lib/session.js';`:

```svelte
    {#if $signedIn}
        <FeedComposer onpublished={(post) => (posts = [post, ...posts])} />
    {/if}
```

- [ ] **Step 12: Type-check, browse, commit**

Run: `pnpm --filter vortex-web check`, then `pnpm web` and publish a status while signed in. It should appear at the top without a reload.

```bash
cd ../vortex-emulator
git commit -- Vortex.WebApi Vortex.WebApi.Tests -m "fil : publier un statut, et tout ce que le serveur refuse"
cd -
git commit -- packages/vortex-web/src -m "web : le composer publie un statut"
```

---

### Task 6: Photo posts, and the `POST AS ▾` menu

**Files:**
- Modify: `packages/vortex-web/src/components/feed/FeedComposer.svelte` (the photos tab, and the identity menu)
- Modify: `packages/vortex-web/src/locales/site/{fr,en}.json`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedPublishTests.cs` (two more facts)

Both halves are already written and already validated on the server — Task 5's `PublishAsync` resolves and checks `PhotoKeys`, and refuses a `GroupId` the author is not a member of. This task proves both and builds the two controls that send them.

**Interfaces:**
- Consumes: `getPlayerPhotos(uniqueId, limit)`, `photoUrl(key)` and `getProfile(uniqueId)`, all already exported from `api.ts`; Task 5's `publish`.
- Produces: nothing new on the wire.

- [ ] **Step 1: Write the two failing facts**

Add to `FeedPublishTests`:

```csharp
    [Fact]
    public async Task APhotoBelongingToSomebodyElseIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        await PlayerAsync(factory, 2, "Autre");

        await using(VortexDbContext db = await factory.DbContexts.CreateDbContextAsync())
        {
            db.CameraPhotos.Add(new Vortex.Database.Entities.Camera.CameraPhotoEntity
            {
                PhotoKey = "lapienne",
                PlayerEntityId = 2,
                SceneBytes = 1,
                RejectedExternalSprites = 0,
                PublishedAt = System.DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
        }

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Photo, "", ["lapienne"], null, null, null), default);

        refusal.Should().Be(FeedRefusal.PhotoNotYours);
    }

    [Fact]
    public async Task AnUnpublishedPhotoOfMyOwnIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        await using(VortexDbContext db = await factory.DbContexts.CreateDbContextAsync())
        {
            db.CameraPhotos.Add(new Vortex.Database.Entities.Camera.CameraPhotoEntity
            {
                PhotoKey = "privee",
                PlayerEntityId = 1,
                SceneBytes = 1,
                RejectedExternalSprites = 0,
                PublishedAt = null,
            });

            await db.SaveChangesAsync();
        }

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Photo, "", ["privee"], null, null, null), default);

        refusal.Should().Be(FeedRefusal.PhotoNotYours);
    }
```

- [ ] **Step 2: Run them**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedPublishTests`
Expected: PASS, 8 tests — Task 5's implementation already covers both. If either fails, the bug is in `PublishAsync`'s photo loop, not in the test.

- [ ] **Step 3: Add the tab strip and the picker to the composer**

Replace the composer's single textarea block with a tab strip and a per-tab body. The photos tab loads the signed-in player's own published photos once, on first open:

```svelte
    import {getPlayerPhotos, photoUrl, type IPhotoSummary} from '../../lib/api.js';
    import {me} from '../../lib/session.js';

    let kind = $state(FEED_KIND.STATUS);
    let mine = $state<IPhotoSummary[]>([]);
    let chosen = $state<string[]>([]);

    // Loaded when the tab is first opened rather than on mount: most posts are statuses, and a
    // player with three hundred photos should not pay for them to write one line.
    $effect(() =>
    {
        if(kind !== FEED_KIND.PHOTO || mine.length || !$me?.uniqueId)
        {
            return;
        }

        let cancelled = false;

        void getPlayerPhotos($me.uniqueId)
            .then((answer) => !cancelled && (mine = answer))
            .catch(() => undefined);

        return () => (cancelled = true);
    });

    function toggle(key: string)
    {
        chosen = chosen.includes(key)
            ? chosen.filter((k) => k !== key)
            // Four is the server's cap; refusing the fifth here rather than letting the request
            // fail is the difference between a disabled thumbnail and a red toast.
            : chosen.length < 4
              ? [...chosen, key]
              : chosen;
    }
```

with the markup, under the textarea:

```svelte
            {#if kind === FEED_KIND.PHOTO}
                <div class="mt-2 grid grid-cols-4 gap-1">
                    {#each mine as photo (photo.key)}
                        <button
                            type="button"
                            onclick={() => toggle(photo.key)}
                            class="border-2 {chosen.includes(photo.key) ? 'border-ink' : 'border-transparent'}"
                        >
                            <img src={photoUrl(photo.key)} alt="" class="w-full" loading="lazy" />
                        </button>
                    {/each}

                    {#if !mine.length}
                        <p class="col-span-4 text-sm">{t('SITE_FEED_NO_PHOTOS')}</p>
                    {/if}
                </div>
            {/if}
```

and the tab strip above the textarea:

```svelte
            <div class="mb-2 flex gap-4 text-sm">
                <button type="button" class:font-bold={kind === FEED_KIND.STATUS} onclick={() => (kind = FEED_KIND.STATUS)}>{t('SITE_FEED_TAB_STATUS')}</button>
                <button type="button" class:font-bold={kind === FEED_KIND.PHOTO} onclick={() => (kind = FEED_KIND.PHOTO)}>{t('SITE_FEED_TAB_PHOTOS')}</button>
            </div>
```

and `submit` passing the kind and the keys:

```ts
            onpublished(await publish({
                kind,
                body,
                parentId,
                photoKeys: kind === FEED_KIND.PHOTO ? chosen : undefined,
            }));
            body = '';
            chosen = [];
```

The Publish button's `disabled` becomes `busy || (kind === FEED_KIND.PHOTO ? !chosen.length : !body.trim())`.

**`$me` may not exist.** Open `src/lib/session.ts` and read what it exports — the README says the identity probe is `GET /api/user/avatars` and `session.js` is built on it, so the store's name and the shape carrying `uniqueId` must be read there, not assumed.

- [ ] **Step 4: Write the failing fact for the identity menu**

Add to `FeedPublishTests`, alongside `AGroupTheAuthorIsNotInIsRefused` which already exists from Task 5:

```csharp
    [Fact]
    public async Task AGroupTheAuthorIsInPublishesUnderIt()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        int groupId;

        await using(VortexDbContext db = await factory.DbContexts.CreateDbContextAsync())
        {
            Vortex.Database.Entities.Groups.GroupEntity group = new()
            {
                Name = "Interpol",
                Description = "Standard ID",
                Badge = "b0501Xs09114s06017",
                OwnerPlayerEntityId = 1,
            };

            db.Groups.Add(group);
            await db.SaveChangesAsync();

            db.GroupMembers.Add(new Vortex.Database.Entities.Groups.GroupMemberEntity
            {
                GroupEntityId = group.Id,
                PlayerEntityId = 1,
            });

            await db.SaveChangesAsync();

            groupId = group.Id;
        }

        (FeedRefusal refusal, FeedPost? post) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "au nom du groupe", null, null, null, groupId), default);

        refusal.Should().Be(FeedRefusal.None);
        post!.GroupId.Should().Be(groupId);
        post.GroupName.Should().Be("Interpol");
        post.AuthorName.Should().Be("Prodiigy", "the row keeps the person even when the card shows the group");
    }
```

`GroupEntity` and `GroupMemberEntity` have required members this snippet may not name — **open both files and add whatever the compiler demands**, and prefer `GroupFactory` (it is in that same folder) if it exists to build a valid group in one call.

- [ ] **Step 5: Run it**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedPublishTests`
Expected: PASS, 9 facts — Task 5's implementation already covers it. A failure here is a bug in `PublishAsync`'s membership check or in the projection's group load, not in the test.

- [ ] **Step 6: Build the identity menu**

In `FeedComposer.svelte`, a `<select>` in the panel's title row — the screenshot's `POST AS PRODIIGY ▾` is a dropdown, and a native `<select>` is one that already works with a keyboard:

```svelte
    import {getProfile} from '../../lib/api.js';

    let groups = $state<{id: number; name: string}[]>([]);
    let groupId = $state<number | undefined>(undefined);

    // The groups come off my own profile rather than a route of their own: the profile read
    // already returns them, and the server re-checks membership on publish anyway — this list is
    // display, not authorisation.
    $effect(() =>
    {
        if(!$me?.uniqueId)
        {
            return;
        }

        let cancelled = false;

        void getProfile($me.uniqueId)
            .then((profile) => !cancelled && (groups = (profile.groups ?? []).map((g) => ({id: g.id, name: g.name}))))
            .catch(() => undefined);

        return () => (cancelled = true);
    });
```

```svelte
        <select bind:value={groupId} class="bg-transparent text-sm">
            <option value={undefined}>{t('SITE_FEED_POST_AS_ME', {name: $me?.name ?? ''})}</option>
            {#each groups as group (group.id)}
                <option value={group.id}>{group.name}</option>
            {/each}
        </select>
```

and `submit` passing `groupId`. Hide the `<select>` entirely when `groups.length === 0` — a menu with one entry is a menu that says nothing.

**Check `getProfile`'s real name and its return shape in `api.ts`** before writing this; the README calls the route `GET /api/public/users/{uniqueId}/profile` and `IPlayerProfile` is the aliased type, so the function may be named differently and `groups` may sit one level down.

- [ ] **Step 7: Add the keys**

`SITE_FEED_TAB_STATUS` / `SITE_FEED_TAB_PHOTOS` / `SITE_FEED_NO_PHOTOS` / `SITE_FEED_POST_AS_ME`, French and English. `SITE_FEED_POST_AS_ME` interpolates the player's name — `"Publier en tant que {{name}}"` / `"Post as {{name}}"`, in whatever delimiter `i18n.ts` actually uses.

- [ ] **Step 8: Type-check, browse, commit**

`pnpm --filter vortex-web check`, then publish a two-photo post and confirm the card shows the grid. If the signed-in player is in a group, publish under it and confirm the card's heading is the group's name while the post still deletes as yours.

```bash
cd ../vortex-emulator && git commit -- Vortex.WebApi.Tests/FeedPublishTests.cs -m "fil : la photo d un autre est refusee, le groupe dont je suis membre passe" && cd -
git commit -- packages/vortex-web/src -m "web : mes photos publiees et le menu publier-en-tant-que"
```

---

### Task 7: Polls and voting

**Files:**
- Modify: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs` (`VoteAsync`)
- Modify: `../vortex-emulator/Vortex.WebApi/Services/WebApiFeedService.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs`
- Create: `packages/vortex-web/src/components/feed/FeedPoll.svelte`
- Modify: `packages/vortex-web/src/components/feed/FeedPost.svelte`, `FeedComposer.svelte`, `lib/feed.ts`, `locales/site/{fr,en}.json`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedVoteTests.cs`

**Interfaces:**
- Consumes: Task 2's `FeedPost`/`FeedPoll`, Task 5's refusal enum.
- Produces: `IWebApiFeedService.VoteAsync(int playerId, int postId, int choiceId, CancellationToken ct) → Task<FeedPost?>`; `POST /api/user/feed/{id}/vote`; `vote(postId, choiceId)` in `lib/feed.ts`; `<FeedPoll post={…} onvoted={…} />`.

- [ ] **Step 1: Write the failing test**

Create `FeedVoteTests.cs` with three facts, reusing `FeedPublishTests`' `PlayerAsync` and `Service` helpers (copy them in):

```csharp
    [Fact]
    public async Task AVoteCounts()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Synes");
        FeedPost poll = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "Pizza ?", null, ["Oui", "Non"], null, null), default)).Post!;

        FeedPost? after = await Service(factory).VoteAsync(1, poll.Id, poll.Poll!.Choices[0].Id, default);

        after!.Poll!.TotalVotes.Should().Be(1);
        after.Poll.MyChoiceId.Should().Be(poll.Poll.Choices[0].Id);
    }

    [Fact]
    public async Task VotingTwiceMovesTheVoteRatherThanAddingOne()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Synes");
        FeedPost poll = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "Pizza ?", null, ["Oui", "Non"], null, null), default)).Post!;

        await Service(factory).VoteAsync(1, poll.Id, poll.Poll!.Choices[0].Id, default);
        FeedPost? after = await Service(factory).VoteAsync(1, poll.Id, poll.Poll.Choices[1].Id, default);

        after!.Poll!.TotalVotes.Should().Be(1, "one player is one voice, however many times they press");
        after.Poll.MyChoiceId.Should().Be(poll.Poll.Choices[1].Id);
    }

    [Fact]
    public async Task AChoiceFromAnotherPollIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Synes");
        FeedPost a = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "A ?", null, ["1", "2"], null, null), default)).Post!;
        FeedPost b = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Poll, "B ?", null, ["3", "4"], null, null), default)).Post!;

        (await Service(factory).VoteAsync(1, a.Id, b.Poll!.Choices[0].Id, default)).Should().BeNull();
    }
```

- [ ] **Step 2: Run it**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedVoteTests`
Expected: FAIL — `VoteAsync` does not exist.

- [ ] **Step 3: Implement `VoteAsync`**

On the interface:

```csharp
    /// <summary>
    /// Records or moves one player's vote, and answers the poll as it now stands. Null when the
    /// post is not a readable poll, or when the choice belongs to a different one.
    /// </summary>
    Task<FeedPost?> VoteAsync(int playerId, int postId, int choiceId, CancellationToken ct);
```

In `WebApiFeedService`:

```csharp
    public async Task<FeedPost?> VoteAsync(int playerId, int postId, int choiceId, CancellationToken ct)
    {
        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        // The choice has to belong to the poll named in the route. Without this a vote can be aimed
        // at any choice in the hotel by id, and it would land silently.
        bool valid = await db
            .WebFeedPollChoices.AnyAsync(c => c.Id == choiceId && c.WebFeedPostEntityId == postId, ct)
            .ConfigureAwait(false);

        if(!valid || !await Readable(db).AnyAsync(p => p.Id == postId && p.Kind == FeedPostKind.Poll, ct).ConfigureAwait(false))
        {
            return null;
        }

        WebFeedPollVoteEntity? existing = await db
            .WebFeedPollVotes.FirstOrDefaultAsync(v => v.WebFeedPostEntityId == postId && v.PlayerEntityId == playerId, ct)
            .ConfigureAwait(false);

        // Moved, not added. The unique index says the same thing, but EF's in-memory provider does
        // not enforce one, so the rule has to hold here as well as there.
        if(existing is null)
        {
            db.WebFeedPollVotes.Add(new WebFeedPollVoteEntity
            {
                WebFeedPostEntityId = postId,
                WebFeedPollChoiceEntityId = choiceId,
                PlayerEntityId = playerId,
            });
        }
        else
        {
            existing.WebFeedPollChoiceEntityId = choiceId;
        }

        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return await GetPostAsync(postId, playerId, ct).ConfigureAwait(false);
    }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `dotnet test Vortex.WebApi.Tests --filter FeedVoteTests`
Expected: PASS, 3 tests.

- [ ] **Step 5: Add the endpoint**

In `MapFeed`, following Task 5's `POST` shape exactly, with `PostVoteRequest`:

```csharp
    /// <summary>The body of a vote.</summary>
    internal sealed record FeedVoteRequest(int ChoiceId);
```

```csharp
        app.MapPost(
                "/api/user/feed/{id:int}/vote",
                async Task<Results<Ok<FeedPost>, NotFound<ApiErrorResponse>, UnauthorizedError>> (
                    HttpContext ctx,
                    int id,
                    FeedVoteRequest body,
                    [FromServices] IWebApiFeedService feed,
                    [FromServices] WebApiSessionStore sessions,
                    [FromServices] IWebApiPlayerService players,
                    CancellationToken ct
                ) =>
                {
                    (int? playerId, IResult? refused) = await WebApiEndpoints
                        .SelectedPlayerAsync(ctx, sessions, players, ct)
                        .ConfigureAwait(false);

                    if(playerId is null)
                    {
                        return refused is UnauthorizedError unauthorized
                            ? unauthorized
                            : TypedResults.NotFound(new ApiErrorResponse("pocket.auth.no_avatars"));
                    }

                    FeedPost? post = await feed.VoteAsync(playerId.Value, id, body.ChoiceId, ct).ConfigureAwait(false);

                    return post is null
                        ? TypedResults.NotFound(new ApiErrorResponse("feed_post_not_found"))
                        : TypedResults.Ok(post);
                }
            )
            .WithName("FeedVote")
            .WithSummary("Vote in a poll, or move an existing vote.")
            .WithTags(tagUser);
```

- [ ] **Step 6: Regenerate**

```bash
cd ../vortex-emulator
dotnet test Vortex.WebApi.Tests --filter OpenApiDocumentTests   # rerun until green
dotnet test Vortex.WebApi.Tests
dotnet csharpier .
cd -
pnpm --filter vortex-web api:types
```

- [ ] **Step 7: Write `FeedPoll.svelte`**

```svelte
<script lang="ts">
    // The screenshot's poll: a radio per choice, a filled bar, and the percentage to its right.
    // The server sends counts; the percentage is computed here, because a percentage is a
    // rendering decision and a count is a fact.
    import {vote, type IFeedPost} from '../../lib/feed.js';
    import {signedIn} from '../../lib/session.js';

    let {post, onvoted}: {post: IFeedPost; onvoted: (post: IFeedPost) => void} = $props();

    let busy = $state(false);

    function share(votes: number): number
    {
        // Zero total, not zero votes: dividing by it is how every one of these bars ends up NaN
        // wide on a poll nobody has answered yet.
        return post.poll?.totalVotes ? Math.round((votes / post.poll.totalVotes) * 100) : 0;
    }

    async function choose(choiceId: number)
    {
        if(busy || !$signedIn)
        {
            return;
        }

        busy = true;

        try
        {
            onvoted(await vote(post.id, choiceId));
        }
        finally
        {
            busy = false;
        }
    }
</script>

{#if post.poll}
    <ul class="mb-3 flex flex-col gap-1 rounded-[3px] bg-box p-3">
        {#each post.poll.choices as choice (choice.id)}
            <li class="flex items-center gap-2">
                <button
                    type="button"
                    onclick={() => choose(choice.id)}
                    disabled={busy || !$signedIn}
                    class="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                    <span class="size-3 shrink-0 rounded-full border-2 border-white {post.poll.myChoiceId === choice.id ? 'bg-white' : ''}"></span>
                    <span class="truncate">{choice.label}</span>
                </button>

                <span class="h-4 w-40 shrink-0 bg-field/30"><span class="block h-full bg-field" style="width: {share(choice.votes)}%"></span></span>
                <span class="w-10 shrink-0 text-right text-sm">{share(choice.votes)}%</span>
            </li>
        {/each}
    </ul>
{/if}
```

- [ ] **Step 8: Render it, and add the composer's poll tab**

In `FeedPost.svelte`, under the photo grid:

```svelte
            {#if post.kind === FEED_KIND.POLL}
                <FeedPoll {post} onvoted={(updated) => (post = updated)} />
            {/if}
```

`post` is a prop; reassigning it needs `$bindable`. Declare it `let {post = $bindable(), comment = false} = $props();` and pass `bind:post` from `Chats.svelte`'s `{#each}` — or, if that fights the keyed each, lift the update to the page by giving `FeedPost` an `onupdated` callback that replaces the item in `posts`. Take whichever `svelte-check` accepts without a cast.

In `FeedComposer.svelte`, a third tab with two to five text inputs:

```svelte
            {#if kind === FEED_KIND.POLL}
                <div class="mt-2 flex flex-col gap-1">
                    {#each choices as _, i (i)}
                        <input
                            bind:value={choices[i]}
                            maxlength="80"
                            placeholder={t('SITE_FEED_POLL_CHOICE')}
                            class="w-full rounded-[3px] bg-field px-2 py-1 text-field-ink shadow-field"
                        />
                    {/each}

                    {#if choices.length < 5}
                        <button type="button" onclick={() => (choices = [...choices, ''])} class="self-start text-sm underline">
                            {t('SITE_FEED_POLL_ADD_CHOICE')}
                        </button>
                    {/if}
                </div>
            {/if}
```

with `let choices = $state(['', '']);`, the submit passing `pollChoices: kind === FEED_KIND.POLL ? choices.filter((c) => c.trim()) : undefined`, and the disabled rule extended with `kind === FEED_KIND.POLL ? choices.filter((c) => c.trim()).length < 2 || !body.trim() : …`.

- [ ] **Step 9: Add `vote` to `lib/feed.ts`**

```ts
/** Vote in a poll, or move an existing vote. Answers the post as it now stands. */
export function vote(postId: number, choiceId: number): Promise<IFeedPost>
{
    return request(`/api/user/feed/${postId}/vote`, {method: 'POST', body: {choiceId}});
}
```

- [ ] **Step 10: Keys, type-check, browse, commit**

`SITE_FEED_TAB_POLL`, `SITE_FEED_POLL_CHOICE`, `SITE_FEED_POLL_ADD_CHOICE`, French and English.

```bash
cd ../vortex-emulator && git commit -- Vortex.WebApi Vortex.WebApi.Tests -m "fil : voter, une voix par joueur et par sondage" && cd -
git commit -- packages/vortex-web/src -m "web : les sondages, du composer aux barres"
```

---

### Task 8: Reposts and favourites

**Files:**
- Modify: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs`, `WebApiFeedService.cs`, `Hosting/WebApiEndpoints.Feed.cs`
- Modify: `packages/vortex-web/src/components/feed/FeedPost.svelte`, `lib/feed.ts`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedReactionTests.cs`

**Interfaces:**
- Produces: `IWebApiFeedService.SetReactionAsync(int playerId, int postId, FeedReactionKind kind, bool on, CancellationToken ct) → Task<FeedPost?>`; `PUT /api/user/feed/{id}/reaction`; `setReaction(postId, kind, on)` in `lib/feed.ts`.

- [ ] **Step 1: Write the failing test**

`FeedReactionTests.cs`, with `PlayerAsync`/`Service` copied in:

```csharp
    [Fact]
    public async Task ReactingTwiceLeavesOneReaction()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost post = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Favorite, true, default);
        FeedPost? after = await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Favorite, true, default);

        after!.FavoriteCount.Should().Be(1);
        after.FavoritedByMe.Should().BeTrue();
    }

    [Fact]
    public async Task WithdrawingRemovesIt()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost post = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Repost, true, default);
        FeedPost? after = await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Repost, false, default);

        after!.RepostCount.Should().Be(0);
        after.RepostedByMe.Should().BeFalse();
    }

    [Fact]
    public async Task TheTwoKindsAreIndependent()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost post = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Repost, true, default);
        FeedPost? after = await Service(factory).SetReactionAsync(1, post.Id, FeedReactionKind.Favorite, true, default);

        after!.RepostCount.Should().Be(1);
        after.FavoriteCount.Should().Be(1);
    }
```

- [ ] **Step 2: Run it** — Run: `dotnet test Vortex.WebApi.Tests --filter FeedReactionTests`. Expected: FAIL, no `SetReactionAsync`.

- [ ] **Step 3: Implement**

On the interface:

```csharp
    /// <summary>
    /// Leaves or withdraws one reaction, and answers the post as it now stands. Takes the WANTED
    /// state rather than toggling, because a toggle sent twice by a flaky connection lands on the
    /// opposite of what the reader pressed — the reasoning the photo like already follows.
    /// </summary>
    Task<FeedPost?> SetReactionAsync(int playerId, int postId, FeedReactionKind kind, bool on, CancellationToken ct);
```

In `WebApiFeedService`:

```csharp
    public async Task<FeedPost?> SetReactionAsync(
        int playerId,
        int postId,
        FeedReactionKind kind,
        bool on,
        CancellationToken ct
    )
    {
        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        if(!await Readable(db).AnyAsync(p => p.Id == postId, ct).ConfigureAwait(false))
        {
            return null;
        }

        WebFeedReactionEntity? existing = await db
            .WebFeedReactions.FirstOrDefaultAsync(
                r => r.WebFeedPostEntityId == postId && r.PlayerEntityId == playerId && r.Kind == kind,
                ct
            )
            .ConfigureAwait(false);

        if(on && existing is null)
        {
            db.WebFeedReactions.Add(new WebFeedReactionEntity
            {
                WebFeedPostEntityId = postId,
                PlayerEntityId = playerId,
                Kind = kind,
            });
        }
        else if(!on && existing is not null)
        {
            // Removed outright, not soft-deleted: a soft delete keeps the pair and the unique index
            // then refuses the next reaction. See WebFeedReactionEntity.
            db.WebFeedReactions.Remove(existing);
        }

        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return await GetPostAsync(postId, playerId, ct).ConfigureAwait(false);
    }
```

- [ ] **Step 4: Run the test to verify it passes** — Expected: PASS, 3 tests.

- [ ] **Step 5: Add the endpoint**

`PUT /api/user/feed/{id:int}/reaction` with `internal sealed record FeedReactionRequest(FeedReactionKind Kind, bool On);`, following Task 7's `POST …/vote` shape exactly (same auth block, same `Results<>` union, `.WithName("FeedReaction")`, `.WithTags(tagUser)`).

- [ ] **Step 6: Regenerate** — the same four commands as Task 7 step 6.

- [ ] **Step 7: Wire the bar**

In `FeedPost.svelte`, replace the two static counter spans with buttons calling `setReaction(post.id, FEED_REACTION.REPOST | .FAVORITE, !post.repostedByMe | !post.favoritedByMe)` and applying the answer, disabled when `!$signedIn`. Mark the active state with the same `text-ink` the tag links use.

Add to `lib/feed.ts`:

```ts
/** Leave or withdraw a repost or a favourite. Answers the post as it now stands. */
export function setReaction(postId: number, kind: number, on: boolean): Promise<IFeedPost>
{
    return request(`/api/user/feed/${postId}/reaction`, {method: 'PUT', body: {kind, on}});
}
```

- [ ] **Step 8: Type-check, browse, commit**

```bash
cd ../vortex-emulator && git commit -- Vortex.WebApi Vortex.WebApi.Tests -m "fil : partages et favoris, idempotents" && cd -
git commit -- packages/vortex-web/src -m "web : la barre partage et favori"
```

---

### Task 9: Hashtags

**Files:**
- Create: `../vortex-emulator/Vortex.WebApi/Services/FeedTags.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Services/WebApiFeedService.cs` (extract on publish)
- Modify: `packages/vortex-web/src/pages/community/Chats.svelte` (the `?tag=` filter and the header search)
- Modify: `packages/vortex-web/src/locales/site/{fr,en}.json`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedTagTests.cs`

**Interfaces:**
- Produces: `static class FeedTags` with `Pattern` (a `Regex`) and `Extract(string body) → IReadOnlyList<string>`.

- [ ] **Step 1: Write the failing test**

```csharp
    [Theory]
    [InlineData("rien ici", 0)]
    [InlineData("regarde #coolHashtag", 1)]
    [InlineData("#a #b #a", 2)]
    [InlineData("#Pizza et #pizza", 1)]
    public void ExtractFindsEachTagOnce(string body, int expected)
    {
        FeedTags.Extract(body).Should().HaveCount(expected);
    }

    [Fact]
    public void ExtractLowercases()
    {
        FeedTags.Extract("#McBurgerFC").Should().Equal("mcburgerfc");
    }

    [Fact]
    public async Task PublishingStoresTheTagsAndTheFeedFiltersOnThem()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "photos #coolHashtag", null, null, null, null), default);
        await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "rien", null, null, null, null), default);

        FeedPage filtered = await Service(factory).GetFeedAsync(1, 0, "coolhashtag", null, default);

        filtered.Items.Should().ContainSingle();
        filtered.Items[0].Tags.Should().Equal("coolhashtag");
    }

    [Fact]
    public async Task ATagIsSharedBetweenPostsRatherThanDuplicated()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");

        await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "un #tag", null, null, null, null), default);
        await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "deux #tag", null, null, null, null), default);

        await using VortexDbContext db = await factory.DbContexts.CreateDbContextAsync();

        (await db.WebFeedTags.CountAsync()).Should().Be(1);
        (await db.WebFeedPostTags.CountAsync()).Should().Be(2);
    }
```

- [ ] **Step 2: Run it** — Expected: FAIL, no `FeedTags`.

- [ ] **Step 3: Write `FeedTags.cs`**

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Vortex.WebApi.Services;

/// <summary>
/// Pulling the hashtags out of a post's body.
/// </summary>
/// <remarks>
/// The pattern is duplicated on the front, in <c>components/feed/FeedBody.svelte</c>, because the
/// page has to know where to break the text to make the links. They are kept in step by hand and a
/// mismatch is visible rather than silent: a tag that renders plain, or a link that finds nothing.
/// </remarks>
internal static partial class FeedTags
{
    /// <summary>A <c>#</c> then letters, digits or underscore, in any script.</summary>
    [GeneratedRegex(@"#([\p{L}\p{N}_]+)", RegexOptions.CultureInvariant)]
    public static partial Regex Pattern();

    /// <summary>Each distinct tag in the body, lowercased, in the order it first appears.</summary>
    public static IReadOnlyList<string> Extract(string body) =>
        Pattern()
            .Matches(body ?? string.Empty)
            .Select(m => m.Groups[1].Value.ToLowerInvariant())
            .Where(t => t.Length <= Database.Entities.Feed.WebFeedTagEntity.TagLength)
            .Distinct(StringComparer.Ordinal)
            .ToList();
}
```

- [ ] **Step 4: Store them on publish**

In `PublishAsync`, after the choices loop and before the final `SaveChangesAsync`:

```csharp
        foreach(string tag in FeedTags.Extract(text))
        {
            // Get-or-create, one row per tag for the whole hotel. Not a race worth locking: the
            // unique index is what settles a simultaneous first use of the same tag, and the loser
            // retries on its next post.
            int tagId = await db.WebFeedTags.Where(t => t.Tag == tag).Select(t => t.Id).FirstOrDefaultAsync(ct).ConfigureAwait(false);

            if(tagId == 0)
            {
                WebFeedTagEntity row = new() { Tag = tag };
                db.WebFeedTags.Add(row);
                await db.SaveChangesAsync(ct).ConfigureAwait(false);
                tagId = row.Id;
            }

            db.WebFeedPostTags.Add(new WebFeedPostTagEntity { WebFeedPostEntityId = post.Id, WebFeedTagEntityId = tagId });
        }
```

`GetFeedAsync` already filters on `tag` — it was written in Task 2 and `Normalise` is already there.

- [ ] **Step 5: Run the test** — Expected: PASS, 7 facts.

- [ ] **Step 6: The page's filter and search**

In `Chats.svelte`, read the tag off the query string and pass it to `getFeed`, and put a search field in the `PageHeader`:

```svelte
    import {querystring, push} from 'svelte-spa-router';

    let tag = $derived(new URLSearchParams($querystring ?? '').get('tag') ?? '');
    let term = $state('');

    $effect(() =>
    {
        let cancelled = false;
        loading = true;

        void getFeed({tag: tag || undefined})
            .then((answer) => !cancelled && (posts = answer.items ?? []))
            .catch(() => !cancelled && (posts = []))
            .finally(() => !cancelled && (loading = false));

        return () => (cancelled = true);
    });
```

```svelte
    <form onsubmit={(e) => {e.preventDefault(); push(term.trim() ? `/community/chats?tag=${encodeURIComponent(term.trim().replace(/^#/, ''))}` : '/community/chats');}}>
        <input bind:value={term} placeholder={t('SITE_FEED_SEARCH_TAGS')} class="rounded-[3px] bg-field px-2 py-1 text-field-ink shadow-field" />
    </form>
```

`$effect` re-runs when `tag` changes because it reads it — that is what makes clicking a tag in `FeedBody` refetch. Confirm `querystring` is exported by the patched `svelte-spa-router` in this repo; if it is not, read `window.location.search` and subscribe to the router's own location store instead.

- [ ] **Step 7: Keys, type-check, browse, commit**

`SITE_FEED_SEARCH_TAGS`, French and English. Browse: publish `essai #vortex`, click the tag, and confirm the feed narrows to one card and the URL carries `?tag=vortex`.

```bash
cd ../vortex-emulator && git commit -- Vortex.WebApi Vortex.WebApi.Tests -m "fil : extraire et filtrer les hashtags" && cd -
git commit -- packages/vortex-web/src -m "web : les tags cliquables et la recherche"
```

---

### Task 10: Comments

**Files:**
- Modify: `packages/vortex-web/src/components/feed/FeedPost.svelte` (the comment form and "see all")
- Modify: `packages/vortex-web/src/locales/site/{fr,en}.json`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedPublishTests.cs` (two more facts)

The server already accepts `parentId` and already refuses a nested reply — Task 5 wrote both. This task proves them and builds the thread.

- [ ] **Step 1: Write the two failing facts**

```csharp
    [Fact]
    public async Task ACommentAttachesToItsRoot()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost root = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        (FeedRefusal refusal, FeedPost? comment) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "et hop", null, null, null, root.Id), default);

        refusal.Should().Be(FeedRefusal.None);
        comment!.Comments.Should().BeEmpty();
        (await Service(factory).GetPostAsync(root.Id, null, default))!.CommentCount.Should().Be(1);
    }

    [Fact]
    public async Task ACommentOnACommentIsRefused()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost root = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;
        FeedPost comment = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "et hop", null, null, null, root.Id), default)).Post!;

        (FeedRefusal refusal, _) = await Service(factory)
            .PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "encore", null, null, null, comment.Id), default);

        refusal.Should().Be(FeedRefusal.ParentNotRoot);
    }
```

- [ ] **Step 2: Run them** — Run: `dotnet test Vortex.WebApi.Tests --filter FeedPublishTests`. Expected: PASS, 11 facts (6 from Task 5, 3 from Task 6, 2 here). Task 5 already implements both.

- [ ] **Step 3: Mount the comment form**

In `FeedPost.svelte`, under the nested comments and only on a root, when signed in:

```svelte
        {#if !comment && $signedIn}
            <div class="mt-3 pl-6">
                <FeedComposer
                    parentId={post.id}
                    onpublished={(child) => (post = {...post, comments: [...(post.comments ?? []), child], commentCount: post.commentCount + 1})}
                />
            </div>
        {/if}
```

`FeedComposer` imports `FeedPost`'s sibling and `FeedPost` now imports `FeedComposer` — a cycle Vite resolves, but only because neither reads the other at module scope. Keep both imports inside the component and nothing at the top level of either module.

- [ ] **Step 4: "See all N comments"**

When `post.commentCount > post.comments.length`, a button that calls `getPost(post.id)` and replaces the post with the answer, which carries every comment:

```svelte
            {#if !comment && post.commentCount > (post.comments?.length ?? 0)}
                <button type="button" onclick={async () => (post = await getPost(post.id))} class="mt-3 pl-6 text-sm underline">
                    {t('SITE_FEED_SEE_ALL_COMMENTS', {count: String(post.commentCount)})}
                </button>
            {/if}
```

- [ ] **Step 5: Keys, type-check, browse, commit**

`SITE_FEED_SEE_ALL_COMMENTS`, French and English. Browse: comment on a post, confirm it appears under it without a reload; comment four more times and confirm "see all 5" appears and expands.

```bash
cd ../vortex-emulator && git commit -- Vortex.WebApi.Tests/FeedPublishTests.cs -m "fil : un commentaire s attache a sa racine, et pas a un commentaire" && cd -
git commit -- packages/vortex-web/src -m "web : le fil de commentaires et son formulaire"
```

---

### Task 11: Deleting, and the rate limit

**Files:**
- Modify: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs`, `WebApiFeedService.cs`, `Hosting/WebApiEndpoints.Feed.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Configuration/WebApiConfig.cs` (a `FeedPostRateLimit`)
- Modify: `../vortex-emulator/Vortex.WebApi/Hosting/WebApiAppConfigurator.cs` (the policy)
- Modify: `packages/vortex-web/src/components/feed/FeedPost.svelte`, `lib/feed.ts`
- Test: `../vortex-emulator/Vortex.WebApi.Tests/FeedDeleteTests.cs`

**Interfaces:**
- Produces: `IWebApiFeedService.DeleteAsync(int playerId, int postId, CancellationToken ct) → Task<bool>`; `DELETE /api/user/feed/{id}`; `remove(postId)` in `lib/feed.ts`; `WebApiEndpoints.FeedPostRateLimitPolicy`.

- [ ] **Step 1: Write the failing test**

```csharp
    [Fact]
    public async Task IDeleteMyOwn()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        FeedPost post = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        (await Service(factory).DeleteAsync(1, post.Id, default)).Should().BeTrue();
        (await Service(factory).GetPostAsync(post.Id, null, default)).Should().BeNull();
    }

    [Fact]
    public async Task IDoNotDeleteSomebodyElses()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        await PlayerAsync(factory, 2, "Autre");
        FeedPost post = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;

        (await Service(factory).DeleteAsync(2, post.Id, default)).Should().BeFalse();
        (await Service(factory).GetPostAsync(post.Id, null, default)).Should().NotBeNull();
    }

    [Fact]
    public async Task DeletingARootTakesItsCommentsWithIt()
    {
        await using WebApiTestFactory factory = new();
        await PlayerAsync(factory, 1, "Prodiigy");
        await PlayerAsync(factory, 2, "Autre");
        FeedPost root = (await Service(factory).PublishAsync(1, new FeedPublishRequest(FeedPostKind.Status, "coucou", null, null, null, null), default)).Post!;
        FeedPost child = (await Service(factory).PublishAsync(2, new FeedPublishRequest(FeedPostKind.Status, "et hop", null, null, null, root.Id), default)).Post!;

        await Service(factory).DeleteAsync(1, root.Id, default);

        // Someone else's comment goes with the post it was made on: it is unreadable out of the
        // thread it answers, and leaving it live would put it in nobody's feed and nobody's reach.
        (await Service(factory).GetPostAsync(child.Id, null, default)).Should().BeNull();
    }
```

- [ ] **Step 2: Run it** — Expected: FAIL, no `DeleteAsync`.

- [ ] **Step 3: Implement**

```csharp
    /// <summary>
    /// Soft-deletes the caller's own post, and its comments with it. False when the post is not
    /// theirs or is already gone.
    /// </summary>
    Task<bool> DeleteAsync(int playerId, int postId, CancellationToken ct);
```

```csharp
    public async Task<bool> DeleteAsync(int playerId, int postId, CancellationToken ct)
    {
        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        WebFeedPostEntity? post = await db
            .WebFeedPosts.FirstOrDefaultAsync(p => p.Id == postId && p.DeletedAt == null, ct)
            .ConfigureAwait(false);

        if(post is null || post.PlayerEntityId != playerId)
        {
            return false;
        }

        DateTime now = DateTime.UtcNow;

        post.DeletedAt = now;

        // The comments go too, including other people's: a comment is unreadable out of the thread
        // it answers, and one left live would sit in nobody's feed and be reachable by nobody. The
        // rows survive, which is what a soft delete is for.
        await db
            .WebFeedPosts.Where(p => p.ParentEntityId == postId && p.DeletedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.DeletedAt, now), ct)
            .ConfigureAwait(false);

        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return true;
    }
```

`ExecuteUpdateAsync` is not implemented by EF's in-memory provider on every version. If the test throws on it, replace that call with a `ToListAsync` and a loop setting `DeletedAt` — a thread has tens of comments, not thousands.

- [ ] **Step 4: Run the test** — Expected: PASS, 3 tests.

- [ ] **Step 5: The endpoint and the rate limit**

`DELETE /api/user/feed/{id:int}` returning `Ok<EmptyResponse>` / `NotFound<ApiErrorResponse>("feed_post_not_found")` / `UnauthorizedError`, same auth block as Task 5.

In `WebApiConfig.cs`, beside `ReportRateLimit`:

```csharp
    /// <summary>
    /// How often one caller may publish. A feed is the one surface here where the cost of a flood
    /// is paid by every reader, so it is rate-limited at the same layer the login is.
    /// </summary>
    public RateLimitOptions FeedPostRateLimit { get; set; } =
        new RateLimitOptions { PermitLimit = 10, WindowSeconds = 60, QueueLimit = 0 };
```

Read how `ReportRateLimitPolicy` is declared in `WebApiEndpoints.cs` (line ~37) and registered in `WebApiAppConfigurator.cs`, and add `FeedPostRateLimitPolicy = "webapi-feed-post"` the same way. Apply `.RequireRateLimiting(WebApiEndpoints.FeedPostRateLimitPolicy)` to `POST /api/user/feed` only — not to the votes or reactions, which are cheap and which a reader legitimately fires several of in a row.

- [ ] **Step 6: Regenerate, add the front's delete control, commit**

A delete control on `FeedPost` when `post.mine`, calling `remove(post.id)` and removing the card. Add to `lib/feed.ts`:

```ts
/** Delete one of my own posts, and its comments with it. */
export function remove(postId: number): Promise<unknown>
{
    return request(`/api/user/feed/${postId}`, {method: 'DELETE'});
}
```

`remove` and not `delete`: the latter is a reserved word and cannot be an export name.

```bash
cd ../vortex-emulator
dotnet test Vortex.WebApi.Tests --filter OpenApiDocumentTests   # rerun until green
dotnet test Vortex.WebApi.Tests
dotnet csharpier .
git commit -- Vortex.WebApi Vortex.WebApi.Tests -m "fil : supprimer le sien, et le debit sur la publication"
cd -
pnpm --filter vortex-web api:types
pnpm --filter vortex-web check
git commit -- packages/vortex-web/src -m "web : supprimer son propre post"
```

---

### Task 12: Staff takedown

**Files:**
- Modify: `../vortex-emulator/Vortex.Primitives/Permissions/Capabilities.cs`
- Modify: `../vortex-emulator/Vortex.Authentication/Permissions/DefaultRoles.cs`
- Modify: `../vortex-emulator/Vortex.WebApi/Services/IWebApiFeedService.cs`, `WebApiFeedService.cs`
- Modify: the dashboard's endpoint file for moderation surfaces (find it: `Vortex.Dashboard.API/Hosting/Catalogue/DashboardEndpoints.*.cs`)
- Test: `../vortex-emulator/Vortex.Dashboard.Tests/` — mirror whichever existing test covers a capability-guarded dashboard endpoint

**Why here and not on the web API:** `Vortex.WebApi` has no permission check anywhere in it — not one of its routes reads `Capabilities`. Teaching it a capability system for a single endpoint puts the hotel's authorisation model in two places. `Vortex.Dashboard.API` already has all of it.

**The guard is a parameter, not a line of code.** `Vortex.Dashboard.API/Hosting/DashboardEndpoints.cs:490` declares

```csharp
    private static void MapPost(WebApplication app, string path, Delegate handler, string capability, string tag)
```

which does `.RequireAuthorization(capability)`, the tag, and the validation filter. Every dashboard route goes through it — `DashboardEndpoints.Economy.cs` is five calls to its `MapReadGet` sibling in a row — so this task writes one more call and no authorisation code at all.

- [ ] **Step 1: Declare the capability**

In `Vortex.Primitives/Permissions/Capabilities.cs`, following the nested-class-per-area layout the file already has (`Room`, `Moderation`, `Economy`, `Dashboard`, …):

```csharp
    /// <summary>The website's own surfaces, as distinct from the game's.</summary>
    public static class Web
    {
        /// <summary>Take down anybody's post or comment in the social feed.</summary>
        public const string FeedModerate = "web.feed.moderate";
    }
```

- [ ] **Step 2: Grant it**

In `Vortex.Authentication/Permissions/DefaultRoles.cs`, add `Capabilities.Web.FeedModerate` to the same role that holds `Capabilities.Moderation.Mute` — a feed takedown is the same authority over the same players' words.

`Vortex.Authentication.Tests/Permissions/CapabilityDeclarationTests.cs` fails on a key that is declared and granted to nobody, so skipping this step breaks a suite that has nothing to do with the feed.

- [ ] **Step 3: Write the failing test**

Open the test file covering the endpoints in whichever `DashboardEndpoints.*.cs` you add the route to, and add two facts to it in that file's own style: a caller holding `web.feed.moderate` removes another player's post, and a caller without it gets 403. Its existing tests already build an authorised client — reuse that helper rather than a new one; the capability string is the only thing that changes.

- [ ] **Step 4: Run it** — Expected: FAIL, the route 404s.

- [ ] **Step 5: Implement the service method**

On `IWebApiFeedService`:

```csharp
    /// <summary>
    /// Takes a post down regardless of who wrote it, for a caller the DASHBOARD has already
    /// authorised. There is no capability check in here and there must not be one: this method is
    /// unreachable except through a route carrying <c>Capabilities.Web.FeedModerate</c>, and a
    /// second check in a second place is a second thing to get wrong.
    /// </summary>
    Task<bool> ModerateDeleteAsync(int postId, CancellationToken ct);
```

In `WebApiFeedService`, the body of `DeleteAsync` from Task 11 with the ownership line removed:

```csharp
    public async Task<bool> ModerateDeleteAsync(int postId, CancellationToken ct)
    {
        await using VortexDbContext db = await _db.CreateDbContextAsync(ct).ConfigureAwait(false);

        WebFeedPostEntity? post = await db
            .WebFeedPosts.FirstOrDefaultAsync(p => p.Id == postId && p.DeletedAt == null, ct)
            .ConfigureAwait(false);

        if(post is null)
        {
            return false;
        }

        DateTime now = DateTime.UtcNow;

        post.DeletedAt = now;

        await db
            .WebFeedPosts.Where(p => p.ParentEntityId == postId && p.DeletedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.DeletedAt, now), ct)
            .ConfigureAwait(false);

        await db.SaveChangesAsync(ct).ConfigureAwait(false);

        return true;
    }
```

- [ ] **Step 6: Add the dashboard route**

```csharp
        MapPost(
            app,
            ApiOperations + "/feed/{id:int}/remove",
            async (int id, IWebApiFeedService feed, CancellationToken ct) =>
                await feed.ModerateDeleteAsync(id, ct).ConfigureAwait(false)
                    ? Results.Ok()
                    : Results.NotFound(),
            Capabilities.Web.FeedModerate,
            TagOperations
        );
```

`ApiOperations` and `TagOperations` are constants in `DashboardEndpoints.cs` — **read their real names there** (`DashboardEndpoints.Economy.cs` uses `ApiEconomy`, `ApiV1`, `ApiOperations` and `TagEconomy`, so the pair for a moderation operation exists under some name).

**Check the project reference before writing this.** If `Vortex.Dashboard.API` does not already reference `Vortex.WebApi`, do **not** add one for this: put `ModerateDeleteAsync`'s four lines of EF in a small service in the dashboard's own project against the same `VortexDbContext`. A new reference between those two projects is a bigger decision than this task.

- [ ] **Step 7: Run the tests** — Expected: PASS, including `dotnet test Vortex.Authentication.Tests --filter CapabilityDeclarationTests`.

- [ ] **Step 8: Full suite, format, commit**

```bash
cd ../vortex-emulator
dotnet test Vortex.WebApi.Tests
dotnet test Vortex.Database.Tests
dotnet test Vortex.Authentication.Tests
dotnet test Vortex.Dashboard.Tests
dotnet csharpier check .
git commit -- Vortex.Primitives/Permissions Vortex.Authentication/Permissions Vortex.WebApi Vortex.Dashboard.API Vortex.Dashboard.Tests -m "fil : le retrait par le staff, derriere une capacite"
```

---

## What this plan deliberately does not build

Each was decided in the spec and is repeated here so a reader does not take it for an oversight:

- **The right-hand column** — friend requests, room invitations, birthdays, recommendations. There is no friends surface on the web API; the aside renders the site's standard CMS safety box, which is what every other content page already does.
- **`Create a photo album`** — a fourth post kind, not retained.
- **The news card in the feed** — articles exist (`GET /api/public/articles`) but they are not part of the feed's model.
- **A word filter** — the emulator has none to reuse (`RoomFilterWordEntity` is per-room, `PlayerWordFilterEntity` is per-player). Task 11's author delete and Task 12's staff takedown are what v1 ships instead.
- **Stored counters** — correlated counts, a stated ceiling in `WebApiFeedService`'s own remarks.
- **A front-end test runner** — `vortex-web` has none and this plan does not add one.
