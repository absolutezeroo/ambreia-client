# Word Filter (batch 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A hotel-wide word list, edited by staff in the dashboard, applied to room chat, private
messages, room invites, mottos, names (game + web) and the website feed — each word replaced or
refused per staff choice, every hit journaled.

**Architecture:** One synchronous `IWordFilter` singleton (interface in `Vortex.Primitives`,
implementation in `Vortex.Observability`) holding an immutable compiled set swapped atomically on
reload; each sink calls it explicitly. Hits go through the existing durable `AuditChannel`. Staff
edit the list through a dashboard admin service that writes rows then calls `ReloadAsync`.

**Tech Stack:** .NET 10, Orleans, EF Core (MySQL), xUnit + FluentAssertions, ASP.NET minimal APIs,
Svelte 5 (dashboard + vortex-web).

**Spec:** `docs/superpowers/specs/2026-09-23-word-filter-design.md`

Batch 2 (the remaining ~18 sinks) gets its own plan once this one has shipped: each of those sinks
has its own refusal channel and needs reading one by one.

## Global Constraints

- Emulator repo: `C:\Users\Ctuto\Desktop\Habbo\vortex-emulator` (all paths below are relative to it
  unless prefixed `vortex-web/` = `C:\Users\Ctuto\Desktop\Habbo\vortex-modern-client\packages\vortex-web`).
- Read `AGENTS.md` and `CLAUDE.md` of the emulator before starting. csharpier reformats every
  edited `.cs` (PostToolUse hook) — re-read a file before the next `Edit` on it.
- **Commits name their paths** (`git commit -m "..." -- <paths>`); `guard-commit.mjs` blocks a bare
  commit or `git add .`. Commit message style: `filtre : <what, in French, lower case>`, ending with
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Do not stop the running `Vortex.Main` (`guard-emulator.mjs`). A full-solution build fails with
  file locks while it runs — build/test individual projects.
- Replacement default: `bobba`. Refusal message default: `Ton message contient un mot interdit.`
- Word and replacement max length: 64. Journal `original_text` max length: 512.
- Leet table: `4 @ → a`, `3 → e`, `1 → i`, `0 → o`, `5 $ → s`, `7 → t`. (`!` is deliberately NOT
  in it: `con!` would fold to `coni` and lose its word boundary.)
- Names: any hit refuses, whatever the word's action.
- Grain rules (AGENTS.md "Orleans grain development rules") apply: no swallowed exceptions, no
  hardcoded limits in grains, composers only through `PlayerPresenceGrain.SendComposerAsync` or
  `MessageContext.SendComposerAsync`.
- New dashboard capability: all four files AGENTS.md lists ("Add dashboard capability or admin
  page"), plus `DefaultRoles.cs`.

## Review Focus

1. **Innocent words containing a banned one** (`concert`, `Scunthorpe`, `classe` with `ass` banned as
   WholeWord) must pass untouched — Task 3 test `WholeWord_DoesNotMatchInsideALongerWord`.
2. **Punctuation stuck to a banned word** (`con!`, `(con)`, `con,`) must still match and the
   punctuation must survive the replacement — Task 3 test `Replace_KeepsSurroundingPunctuation`.
3. **Empty list at boot, before the first reload** must pass everything through, never throw —
   Task 4 test `BeforeTheFirstReload_EverythingPasses`.
4. **The name-availability probe** fires on every keystroke and must not flood the journal — Task 6
   uses `Test()`, which journals nothing; Task 4 test `Test_NeverJournals`.
5. **A pathological input or a regex timeout** must fail open (text passes, warning logged) rather
   than throw into the chat path — Task 4 test `ARegexTimeout_FailsOpen`.

---

### Task 1: Primitives — enums, normaliser, the interface, config keys

**Files:**
- Create: `Vortex.Primitives/Moderation/WordFilter/WordFilterAction.cs`
- Create: `Vortex.Primitives/Moderation/WordFilter/WordFilterMatch.cs`
- Create: `Vortex.Primitives/Moderation/WordFilter/WordFilterSource.cs`
- Create: `Vortex.Primitives/Moderation/WordFilter/WordFilterNormalizer.cs`
- Create: `Vortex.Primitives/Moderation/WordFilter/IWordFilter.cs`
- Create: `Vortex.Primitives/Moderation/WordFilter/WordFilterConfig.cs`
- Modify: `Vortex.Primitives/Server/ConfigKeyCatalog.cs` (append two entries next to `room.filter.replacement`, ~line 296)
- Test: `Vortex.Hosting.Tests/WordFilter/WordFilterNormalizerTests.cs`

**Interfaces:**
- Produces: `WordFilterAction { Replace = 0, Refuse = 1 }`, `WordFilterMatch { WholeWord = 0, Partial = 1 }`,
  `WordFilterSource { RoomChat = 0, Messenger = 1, RoomInvite = 2, Motto = 3, Username = 4, FeedPost = 5 }`,
  `WordFilterNormalizer.Normalize(string) : string` (same length as input),
  `WordFilterNormalizer.Key(string word) : string` (normalised, spaces removed, repeats collapsed),
  `IWordFilter`, `WordFilterResult`, `WordFilterConfig.ReplacementKey/Default`, `RefusedMessageKey/Default`.

- [ ] **Step 1: Write the failing normaliser test**

```csharp
using FluentAssertions;
using Vortex.Primitives.Moderation.WordFilter;
using Xunit;

namespace Vortex.Hosting.Tests.WordFilter;

public sealed class WordFilterNormalizerTests
{
    [Theory]
    [InlineData("CON", "con")]
    [InlineData("Çôñ", "con")]
    [InlineData("c0n", "con")]
    [InlineData("c.o.n", "c o n")]
    [InlineData("4@3105$7", "aaeiosst")]
    [InlineData("con!", "con ")]
    [InlineData("a😀b", "a  b")]
    public void Normalize_FoldsCaseAccentsLeetAndSeparators(string input, string expected)
    {
        WordFilterNormalizer.Normalize(input).Should().Be(expected);
    }

    [Fact]
    public void Normalize_KeepsTheLengthOfTheInput()
    {
        const string input = "Ça va, c.o.n ?! 😀";

        WordFilterNormalizer.Normalize(input).Length.Should().Be(input.Length);
    }

    [Theory]
    [InlineData("Coonnn", "con")]
    [InlineData("c o n", "con")]
    [InlineData("C.0.N", "con")]
    public void Key_IsTheSameForEverySpellingOfAWord(string word, string expected)
    {
        WordFilterNormalizer.Key(word).Should().Be(expected);
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilterNormalizerTests`
Expected: build FAIL, `WordFilterNormalizer` does not exist.

- [ ] **Step 3: Write the enums, normaliser, interface and config**

`WordFilterAction.cs`:
```csharp
namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>What the hotel-wide filter does with a text containing a listed word.</summary>
public enum WordFilterAction
{
    /// <summary>The text goes through with the offending span replaced.</summary>
    Replace = 0,

    /// <summary>The whole text is refused and the player is told why.</summary>
    Refuse = 1,
}
```

`WordFilterMatch.cs`:
```csharp
namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>How a listed word is found in a text.</summary>
public enum WordFilterMatch
{
    /// <summary>Only on word boundaries: "con" does not match inside "concert".</summary>
    WholeWord = 0,

    /// <summary>Anywhere, including inside a longer word.</summary>
    Partial = 1,
}
```

`WordFilterSource.cs`:
```csharp
namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>
/// Where a filtered text was written — the journal's "source" column. Persisted as its number, so
/// append only; batch 2 of the filter adds the remaining sinks after <see cref="FeedPost"/>.
/// </summary>
public enum WordFilterSource
{
    RoomChat = 0,
    Messenger = 1,
    RoomInvite = 2,
    Motto = 3,
    Username = 4,
    FeedPost = 5,
}
```

`WordFilterNormalizer.cs`:
```csharp
using System.Globalization;
using System.Text;

namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>
/// The one normalisation both sides of the filter go through: a listed word at compile time, and
/// every filtered text per call. Applying the same fold to both is what makes a disguised spelling
/// land on the same letters as the word it disguises.
/// </summary>
/// <remarks>
/// One output character per input character, always. A match found in the normalised text is
/// therefore the same span in the original, which is what lets a replacement swap exactly the
/// offending letters and leave the punctuation, emoji and casing around them alone.
/// <para>
/// <c>ponytail:</c> accents are folded through NFKD, which covers Latin diacritics and compatibility
/// forms but not look-alike letters from other scripts (Cyrillic <c>о</c> for <c>o</c>). A
/// confusables table in <see cref="Fold"/> is the upgrade path if that becomes the workaround.
/// </para>
/// </remarks>
public static class WordFilterNormalizer
{
    public static string Normalize(string text) =>
        string.Create(
            text.Length,
            text,
            static (span, source) =>
            {
                for (int i = 0; i < source.Length; i++)
                {
                    span[i] = Fold(source[i]);
                }
            }
        );

    /// <summary>
    /// A word's identity: normalised, separators dropped, repeated letters collapsed. Two words with
    /// the same key are the same entry — "Coonnn" and "c.o.n" cannot both be listed.
    /// </summary>
    public static string Key(string word)
    {
        string normalized = Normalize(word.Trim());
        StringBuilder key = new(normalized.Length);

        foreach (char c in normalized)
        {
            if (c != ' ' && (key.Length == 0 || key[^1] != c))
            {
                key.Append(c);
            }
        }

        return key.ToString();
    }

    private static char Fold(char c)
    {
        if (c > 127)
        {
            string decomposed = c.ToString().Normalize(NormalizationForm.FormKD);
            c = decomposed.Length > 0 ? decomposed[0] : c;
        }

        c = char.ToLowerInvariant(c);

        c = c switch
        {
            '4' or '@' => 'a',
            '3' => 'e',
            '1' => 'i',
            '0' => 'o',
            '5' or '$' => 's',
            '7' => 't',
            _ => c,
        };

        return c is >= 'a' and <= 'z' or >= '0' and <= '9' ? c : ' ';
    }
}
```

`IWordFilter.cs`:
```csharp
using System.Threading;
using System.Threading.Tasks;

namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>
/// The hotel-wide word filter. Staff keep the list in the dashboard; every sink where a player
/// writes text another player will read calls <see cref="Apply"/> before storing or sending it.
/// </summary>
/// <remarks>
/// Synchronous on purpose: it sits on the chat path, touches no I/O (the journal is an enqueue),
/// and a grain or a web service can call it without another hop.
/// </remarks>
public interface IWordFilter
{
    /// <summary>Filters <paramref name="text"/> and journals any hit against the player.</summary>
    WordFilterResult Apply(string text, WordFilterSource source, int playerId);

    /// <summary>
    /// What <see cref="Apply"/> would answer, journaling nothing. For probes that fire on every
    /// keystroke (the name check) and the dashboard's try-a-sentence box.
    /// </summary>
    WordFilterResult Test(string text);

    /// <summary>The refusal notification's text, from <c>word_filter.refused_message</c>.</summary>
    string RefusedMessage { get; }

    /// <summary>Re-reads the list and both config keys, and swaps the compiled set atomically.</summary>
    Task ReloadAsync(CancellationToken ct);
}

/// <summary>
/// <paramref name="Text"/> is the text to use (the same instance when nothing matched);
/// <paramref name="Refused"/> means use nothing at all; <paramref name="Changed"/> means at least
/// one span was replaced.
/// </summary>
public readonly record struct WordFilterResult(string Text, bool Refused, bool Changed)
{
    /// <summary>Any hit at all. A name treats a replacement as a refusal.</summary>
    public bool Hit => Refused || Changed;
}
```

`WordFilterConfig.cs`:
```csharp
using System.Collections.Immutable;

namespace Vortex.Primitives.Moderation.WordFilter;

/// <summary>
/// The filter's two live settings, served by <c>IServerConfigGrain</c>. Read when the list compiles,
/// never per call, so a change lands on the next reload (any edit of the list triggers one).
/// </summary>
public static class WordFilterConfig
{
    public const string ReplacementKey = "word_filter.replacement";
    public const string ReplacementDefault = "bobba";

    public const string RefusedMessageKey = "word_filter.refused_message";
    public const string RefusedMessageDefault = "Ton message contient un mot interdit.";

    /// <summary>Longest word or replacement accepted. Both columns hold 64.</summary>
    public const int WordMaxLength = 64;

    /// <summary>Longest original text the journal keeps.</summary>
    public const int JournalTextMaxLength = 512;

    public static readonly ImmutableArray<string> Keys = [ReplacementKey, RefusedMessageKey];
}
```

`ConfigKeyCatalog.cs` — append after the `room.filter.replacement` entry, in the same shape:
```csharp
        new(
            "word_filter.replacement",
            "bobba",
            ConfigValueKind.String,
            "What a word on the hotel-wide filter is replaced with, when that word's action is Replace and it names no replacement of its own. Read when the list compiles; editing any word reloads it.",
            "Moderation"
        ),
        new(
            "word_filter.refused_message",
            "Ton message contient un mot interdit.",
            ConfigValueKind.String,
            "The bubble a player sees when the hotel-wide filter refuses what they wrote. Read when the list compiles; editing any word reloads it.",
            "Moderation"
        ),
```
(If `ConfigKeyCatalog` has a fixed list of categories, check how `"Rooms"` is declared and add
`"Moderation"` the same way, or reuse an existing category that fits.)

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilterNormalizerTests`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git commit -m "filtre : le normaliseur, l interface et les deux cles de config" -- Vortex.Primitives/Moderation/WordFilter Vortex.Primitives/Server/ConfigKeyCatalog.cs Vortex.Hosting.Tests/WordFilter
```
(`git add` the new files first, by path.)

---

### Task 2: Database — the two tables and the migration

**Files:**
- Create: `Vortex.Database/Entities/Moderation/WordFilterWordEntity.cs`
- Create: `Vortex.Database/Entities/Moderation/WordFilterHitEntity.cs`
- Modify: `Vortex.Database/Context/VortexDbContext.cs` (two `DbSet`s, beside the other moderation/feed sets)
- Create: `Vortex.Database/Migrations/<timestamp>_AddWordFilter.cs` (+ Designer, snapshot) via the wrapper

**Interfaces:**
- Consumes: Task 1 enums.
- Produces: `VortexDbContext.WordFilterWords`, `VortexDbContext.WordFilterHits`; entity props below.

- [ ] **Step 1: Write the entities**

`WordFilterWordEntity.cs`:
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Primitives.Moderation.WordFilter;

namespace Vortex.Database.Entities.Moderation;

/// <summary>
/// One word on the hotel-wide filter. Staff own the list through the dashboard; the live copy is
/// the compiled set inside <c>WordFilter</c>, reloaded after every write.
/// </summary>
/// <remarks>
/// <see cref="Key"/> is the uniqueness, not <see cref="Word"/>: "Coonnn" and "c.o.n" are one word to
/// the matcher, so they must be one row. It is <c>WordFilterNormalizer.Key(Word)</c>, written by the
/// admin service. Unique among live rows only would need a filtered index MySQL does not have, so a
/// soft-deleted word is hard to re-add under the same key: the admin service revives the deleted row
/// instead of inserting.
/// </remarks>
[Table("word_filter_words")]
[Index(nameof(Key), IsUnique = true)]
public class WordFilterWordEntity : VortexEntity
{
    [Column("word")]
    [MaxLength(WordFilterConfig.WordMaxLength)]
    public required string Word { get; set; }

    [Column("word_key")]
    [MaxLength(WordFilterConfig.WordMaxLength)]
    public required string Key { get; set; }

    [Column("action")]
    public required WordFilterAction Action { get; set; }

    [Column("match")]
    public required WordFilterMatch Match { get; set; }

    /// <summary>Null means the configured default (<c>word_filter.replacement</c>).</summary>
    [Column("replacement")]
    [MaxLength(WordFilterConfig.WordMaxLength)]
    public string? Replacement { get; set; }

    /// <summary>The operator's e-mail, as the dashboard's operation runner records actors.</summary>
    [Column("created_by")]
    [MaxLength(255)]
    public string? CreatedBy { get; set; }
}
```

`WordFilterHitEntity.cs`:
```csharp
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Vortex.Primitives.Moderation.WordFilter;

namespace Vortex.Database.Entities.Moderation;

/// <summary>
/// One time the hotel-wide filter caught something. Written in batches by the durable observability
/// writer, read by staff in the dashboard's journal.
/// </summary>
[Table("word_filter_hits")]
[Index(nameof(PlayerEntityId), nameof(OccurredAt))]
[Index(nameof(OccurredAt))]
public class WordFilterHitEntity : VortexEntity
{
    [Column("player_id")]
    public required int PlayerEntityId { get; set; }

    [Column("source")]
    public required WordFilterSource Source { get; set; }

    /// <summary>The first word that matched. No foreign key: a deleted word keeps its history.</summary>
    [Column("word_id")]
    public required int WordId { get; set; }

    [Column("action")]
    public required WordFilterAction Action { get; set; }

    [Column("original_text")]
    [MaxLength(WordFilterConfig.JournalTextMaxLength)]
    public required string OriginalText { get; set; }

    /// <summary>When the player wrote it — capture time, not flush time.</summary>
    [Column("occurred_at")]
    public required DateTime OccurredAt { get; set; }
}
```

`VortexDbContext.cs` — add:
```csharp
    public DbSet<WordFilterWordEntity> WordFilterWords { get; init; } = null!;
    public DbSet<WordFilterHitEntity> WordFilterHits { get; init; } = null!;
```
with `using Vortex.Database.Entities.Moderation;`. If the context configures enums as strings or
ints in `OnModelCreating` for other enum columns, follow whatever it does for `FeedPostKind`.

- [ ] **Step 2: Build**

Run: `dotnet build Vortex.Database`
Expected: success.

- [ ] **Step 3: Generate the migration**

Run (PowerShell): `scripts/ef.ps1 migrations add AddWordFilter`
Expected: a new `*_AddWordFilter.cs` creating `word_filter_words` (unique index on `word_key`) and
`word_filter_hits` (two indexes). Read the generated `Up()` and check both tables, all columns and
the three indexes are there, and that nothing unrelated is in it (if the snapshot was stale and
other tables appear, stop and report).

- [ ] **Step 4: Run the database tests**

Run: `dotnet test Vortex.Database.Tests`
Expected: PASS (it includes the model/migration consistency checks).

- [ ] **Step 5: Commit**

```bash
git commit -m "filtre : les tables des mots et du journal" -- Vortex.Database/Entities/Moderation Vortex.Database/Context/VortexDbContext.cs Vortex.Database/Migrations
```

---

### Task 3: The matcher — `WordFilterSet`

**Files:**
- Create: `Vortex.Observability/WordFilter/WordFilterSet.cs`
- Test: `Vortex.Hosting.Tests/WordFilter/WordFilterSetTests.cs`

**Interfaces:**
- Consumes: `WordFilterNormalizer`, the enums.
- Produces:
  - `record WordFilterEntry(int Id, string Word, WordFilterAction Action, WordFilterMatch Match, string? Replacement)`
  - `WordFilterSet.Empty`
  - `WordFilterSet.Build(IEnumerable<WordFilterEntry> entries, string defaultReplacement, TimeSpan matchTimeout) : WordFilterSet`
  - `WordFilterSet.Evaluate(string text) : WordFilterVerdict`
  - `readonly record struct WordFilterVerdict(string Text, bool Refused, bool Changed, int FirstWordId, WordFilterAction FirstAction)` — `FirstWordId` is 0 when nothing matched.

- [ ] **Step 1: Write the failing tests**

```csharp
using System;
using FluentAssertions;
using Vortex.Observability.WordFilter;
using Vortex.Primitives.Moderation.WordFilter;
using Xunit;

namespace Vortex.Hosting.Tests.WordFilter;

public sealed class WordFilterSetTests
{
    private static WordFilterSet Set(params WordFilterEntry[] entries) =>
        WordFilterSet.Build(entries, "bobba", TimeSpan.FromMilliseconds(100));

    private static WordFilterEntry Replace(string word, WordFilterMatch match = WordFilterMatch.WholeWord, string? with = null) =>
        new(1, word, WordFilterAction.Replace, match, with);

    private static WordFilterEntry Refuse(string word, int id = 2) =>
        new(id, word, WordFilterAction.Refuse, WordFilterMatch.WholeWord, null);

    [Theory]
    [InlineData("t'es con")]
    [InlineData("t'es CON")]
    [InlineData("t'es cooonnn")]
    [InlineData("t'es c.o.n")]
    [InlineData("t'es c o n")]
    [InlineData("t'es c0n")]
    [InlineData("t'es çôn")]
    public void EveryDisguise_IsCaught(string text)
    {
        Set(Replace("con")).Evaluate(text).Changed.Should().BeTrue();
    }

    [Theory]
    [InlineData("un concert", "con")]
    [InlineData("Scunthorpe", "cunt")]
    [InlineData("une classe", "ass")]
    public void WholeWord_DoesNotMatchInsideALongerWord(string text, string word)
    {
        WordFilterVerdict verdict = Set(Replace(word)).Evaluate(text);

        verdict.Changed.Should().BeFalse();
        verdict.Text.Should().BeSameAs(text);
    }

    [Fact]
    public void Partial_MatchesInsideALongerWord()
    {
        Set(Replace("con", WordFilterMatch.Partial)).Evaluate("un concert").Text.Should().Be("un bobbacert");
    }

    [Theory]
    [InlineData("con!", "bobba!")]
    [InlineData("(con)", "(bobba)")]
    [InlineData("Salut, con, ça va", "Salut, bobba, ça va")]
    [InlineData("c.o.n.", "bobba.")]
    public void Replace_KeepsSurroundingPunctuation(string text, string expected)
    {
        Set(Replace("con")).Evaluate(text).Text.Should().Be(expected);
    }

    [Fact]
    public void Replace_UsesTheWordsOwnReplacementWhenItHasOne()
    {
        Set(Replace("con", with: "***")).Evaluate("con").Text.Should().Be("***");
    }

    [Fact]
    public void Replace_SwapsEveryOccurrence()
    {
        Set(Replace("con")).Evaluate("con et con").Text.Should().Be("bobba et bobba");
    }

    [Fact]
    public void ARefuseWord_RefusesTheWholeText_EvenBesideReplaceWords()
    {
        WordFilterVerdict verdict = Set(Replace("con"), Refuse("nazi", id: 7)).Evaluate("con de nazi");

        verdict.Refused.Should().BeTrue();
        verdict.FirstWordId.Should().Be(7);
        verdict.FirstAction.Should().Be(WordFilterAction.Refuse);
    }

    [Fact]
    public void NoMatch_ReturnsTheSameInstance()
    {
        const string text = "bonjour tout le monde";

        WordFilterVerdict verdict = Set(Replace("con")).Evaluate(text);

        verdict.Text.Should().BeSameAs(text);
        verdict.Changed.Should().BeFalse();
        verdict.Refused.Should().BeFalse();
        verdict.FirstWordId.Should().Be(0);
    }

    [Fact]
    public void TheEmptySet_PassesEverything()
    {
        WordFilterSet.Empty.Evaluate("con").Text.Should().Be("con");
    }

    [Fact]
    public void AMultiWordEntry_MatchesAcrossTheSpace()
    {
        Set(Replace("sale con")).Evaluate("espèce de sale con !").Text.Should().Be("espèce de bobba !");
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilterSetTests`
Expected: build FAIL, `WordFilterSet` missing.

- [ ] **Step 3: Implement**

```csharp
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Vortex.Primitives.Moderation.WordFilter;

namespace Vortex.Observability.WordFilter;

/// <summary>One listed word as the matcher needs it — the row minus its bookkeeping.</summary>
public sealed record WordFilterEntry(
    int Id,
    string Word,
    WordFilterAction Action,
    WordFilterMatch Match,
    string? Replacement
);

/// <summary>What the set decided about one text.</summary>
public readonly record struct WordFilterVerdict(
    string Text,
    bool Refused,
    bool Changed,
    int FirstWordId,
    WordFilterAction FirstAction
);

/// <summary>
/// The compiled word list. Immutable: a reload builds a new one and swaps the reference, so a call
/// in flight sees one whole list or the other, never half of each.
/// </summary>
/// <remarks>
/// Each word becomes one regex over the normalised text: every letter is <c>x+</c> (repeats) and
/// letters are joined by <c> *</c> (the normaliser turned separators into spaces), so "con" is
/// <c>c+ *o+ *n+</c>. WholeWord adds boundary guards; they are what keep "concert" clean.
/// <para>
/// <c>ponytail:</c> one regex per word, tried in turn — O(words × length). Fine for hundreds of
/// words on chat-length lines; a single Aho-Corasick pass over the normalised text is the upgrade if
/// the list reaches thousands.
/// </para>
/// </remarks>
public sealed class WordFilterSet
{
    private readonly ImmutableArray<CompiledWord> _words;

    private WordFilterSet(ImmutableArray<CompiledWord> words) => _words = words;

    public static WordFilterSet Empty { get; } = new([]);

    public int Count => _words.Length;

    public static WordFilterSet Build(
        IEnumerable<WordFilterEntry> entries,
        string defaultReplacement,
        TimeSpan matchTimeout
    )
    {
        ImmutableArray<CompiledWord>.Builder words = ImmutableArray.CreateBuilder<CompiledWord>();

        foreach (WordFilterEntry entry in entries)
        {
            string key = WordFilterNormalizer.Key(entry.Word);

            if (key.Length == 0)
            {
                continue;
            }

            string pattern = string.Join(" *", key.Select(c => Regex.Escape(c.ToString()) + "+"));

            if (entry.Match == WordFilterMatch.WholeWord)
            {
                pattern = "(?<![a-z0-9])" + pattern + "(?![a-z0-9])";
            }

            words.Add(
                new CompiledWord(
                    entry.Id,
                    entry.Action,
                    entry.Replacement ?? defaultReplacement,
                    new Regex(
                        pattern,
                        RegexOptions.Compiled | RegexOptions.CultureInvariant,
                        matchTimeout
                    )
                )
            );
        }

        return new WordFilterSet(words.ToImmutable());
    }

    /// <exception cref="RegexMatchTimeoutException">A pathological input; the caller fails open.</exception>
    public WordFilterVerdict Evaluate(string text)
    {
        if (_words.IsEmpty || string.IsNullOrEmpty(text))
        {
            return new WordFilterVerdict(text, false, false, 0, default);
        }

        string normalized = WordFilterNormalizer.Normalize(text);
        List<(int Index, int Length, string With)>? spans = null;
        CompiledWord? first = null;

        foreach (CompiledWord word in _words)
        {
            foreach (Match match in word.Pattern.Matches(normalized))
            {
                if (word.Action == WordFilterAction.Refuse)
                {
                    return new WordFilterVerdict(text, true, false, word.Id, WordFilterAction.Refuse);
                }

                first ??= word;
                (spans ??= []).Add((match.Index, match.Length, word.Replacement));
            }
        }

        if (spans is null || first is null)
        {
            return new WordFilterVerdict(text, false, false, 0, default);
        }

        // Earliest first, overlaps dropped (two words matching the same letters replace them once),
        // then applied from the end so earlier indexes stay valid.
        spans.Sort((a, b) => a.Index.CompareTo(b.Index));

        List<(int Index, int Length, string With)> kept = [];
        int end = -1;

        foreach ((int Index, int Length, string With) span in spans)
        {
            if (span.Index >= end)
            {
                kept.Add(span);
                end = span.Index + span.Length;
            }
        }

        StringBuilder result = new(text);

        for (int i = kept.Count - 1; i >= 0; i--)
        {
            result.Remove(kept[i].Index, kept[i].Length).Insert(kept[i].Index, kept[i].With);
        }

        return new WordFilterVerdict(result.ToString(), false, true, first.Id, WordFilterAction.Replace);
    }

    private sealed record CompiledWord(
        int Id,
        WordFilterAction Action,
        string Replacement,
        Regex Pattern
    );
}
```

Note on `c.o.n.` → `bobba.`: the pattern `c+ *o+ *n+` stops at `n`, so the trailing `.` survives.
Note on `ARefuseWord…`: a Refuse match returns at once, so `FirstWordId` is that Refuse word even
when a Replace word appeared earlier in the list — the journal records what decided the outcome.

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilter`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "filtre : le moteur de correspondance" -- Vortex.Observability/WordFilter/WordFilterSet.cs Vortex.Hosting.Tests/WordFilter/WordFilterSetTests.cs
```

---

### Task 4: The service — `WordFilter`, its journal, its registration

**Files:**
- Create: `Vortex.Observability/WordFilter/WordFilter.cs`
- Create: `Vortex.Observability/WordFilter/WordFilterLoader.cs` (hosted service: first reload once the host has started)
- Modify: `Vortex.Observability/Audit/DurableRecord.cs` (add `WordFilterHitRecord`)
- Modify: `Vortex.Observability/Audit/AuditWriterService.cs` (`MapEntity` case + `MapWordFilterHit`)
- Modify: `Vortex.Observability/ObservabilityModule.cs` (registrations)
- Test: `Vortex.Hosting.Tests/WordFilter/WordFilterTests.cs`

**Interfaces:**
- Consumes: Task 1 (`IWordFilter`, `WordFilterConfig`), Task 2 (`WordFilterWords`, `WordFilterHitEntity`), Task 3 (`WordFilterSet`).
- Produces: `WordFilter : IWordFilter` with a test seam
  `internal WordFilter(Func<CancellationToken, Task<(IReadOnlyList<WordFilterEntry> Words, string Replacement, string Refused)>> source, Action<WordFilterHit> journal, ILogger<WordFilter> logger)`
  and the public DI constructor `WordFilter(IDbContextFactory<VortexDbContext>, IGrainFactory, AuditChannel, IVortexContextAccessor, ILogger<WordFilter>)`;
  `record WordFilterHit(int PlayerId, WordFilterSource Source, int WordId, WordFilterAction Action, string OriginalText)`.

Before writing: open `Vortex.Observability/Audit/AuditChannel.cs` and `ChannelEconomyLedger.cs`
(the model for the journal write), and check `Vortex.Hosting.Tests` can see `internal` members of
`Vortex.Observability` (look for `InternalsVisibleTo` in its csproj or an `AssemblyInfo`). If it
cannot, add `<InternalsVisibleTo Include="Vortex.Hosting.Tests" />` to `Vortex.Observability.csproj`.

- [ ] **Step 1: Write the failing tests**

```csharp
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Vortex.Observability.WordFilter;
using Vortex.Primitives.Moderation.WordFilter;
using Xunit;

namespace Vortex.Hosting.Tests.WordFilter;

public sealed class WordFilterTests
{
    private readonly List<WordFilterHit> _journal = [];

    private Vortex.Observability.WordFilter.WordFilter NewFilter(params WordFilterEntry[] words) =>
        new(
            _ => Task.FromResult<(IReadOnlyList<WordFilterEntry>, string, string)>((words, "bobba", "Interdit.")),
            _journal.Add,
            NullLogger<Vortex.Observability.WordFilter.WordFilter>.Instance
        );

    private static WordFilterEntry Word(string word, WordFilterAction action, int id = 3) =>
        new(id, word, action, WordFilterMatch.WholeWord, null);

    [Fact]
    public void BeforeTheFirstReload_EverythingPasses()
    {
        WordFilterResult result = NewFilter(Word("con", WordFilterAction.Refuse)).Apply("con", WordFilterSource.RoomChat, 9);

        result.Refused.Should().BeFalse();
        result.Text.Should().Be("con");
    }

    [Fact]
    public async Task Apply_ReplacesAndJournals()
    {
        var filter = NewFilter(Word("con", WordFilterAction.Replace));
        await filter.ReloadAsync(CancellationToken.None);

        WordFilterResult result = filter.Apply("t'es con", WordFilterSource.RoomChat, 9);

        result.Text.Should().Be("t'es bobba");
        result.Changed.Should().BeTrue();
        _journal.Should().ContainSingle().Which.Should().Be(
            new WordFilterHit(9, WordFilterSource.RoomChat, 3, WordFilterAction.Replace, "t'es con"));
    }

    [Fact]
    public async Task Apply_RefusesAndJournals()
    {
        var filter = NewFilter(Word("con", WordFilterAction.Refuse));
        await filter.ReloadAsync(CancellationToken.None);

        filter.Apply("t'es con", WordFilterSource.Messenger, 9).Refused.Should().BeTrue();
        _journal.Should().ContainSingle().Which.Action.Should().Be(WordFilterAction.Refuse);
    }

    [Fact]
    public async Task AUsername_IsRefusedByAReplaceWordToo()
    {
        var filter = NewFilter(Word("con", WordFilterAction.Replace));
        await filter.ReloadAsync(CancellationToken.None);

        WordFilterResult result = filter.Apply("con", WordFilterSource.Username, 9);

        result.Refused.Should().BeTrue();
        result.Text.Should().Be("con");
        _journal.Should().ContainSingle().Which.Action.Should().Be(WordFilterAction.Refuse);
    }

    [Fact]
    public async Task Test_NeverJournals()
    {
        var filter = NewFilter(Word("con", WordFilterAction.Refuse));
        await filter.ReloadAsync(CancellationToken.None);

        filter.Test("con").Refused.Should().BeTrue();
        _journal.Should().BeEmpty();
    }

    [Fact]
    public async Task TheJournal_KeepsAtMost512Characters()
    {
        var filter = NewFilter(Word("con", WordFilterAction.Replace));
        await filter.ReloadAsync(CancellationToken.None);

        filter.Apply("con " + new string('x', 1000), WordFilterSource.FeedPost, 9);

        _journal.Should().ContainSingle().Which.OriginalText.Length.Should().Be(512);
    }

    [Fact]
    public async Task RefusedMessage_ComesFromTheReload()
    {
        var filter = NewFilter();
        filter.RefusedMessage.Should().Be(WordFilterConfig.RefusedMessageDefault);

        await filter.ReloadAsync(CancellationToken.None);

        filter.RefusedMessage.Should().Be("Interdit.");
    }

    [Fact]
    public async Task ARegexTimeout_FailsOpen()
    {
        var filter = new Vortex.Observability.WordFilter.WordFilter(
            _ => Task.FromResult<(IReadOnlyList<WordFilterEntry>, string, string)>(
                ([new WordFilterEntry(1, "a", WordFilterAction.Refuse, WordFilterMatch.Partial, null)], "bobba", "x")),
            _journal.Add,
            NullLogger<Vortex.Observability.WordFilter.WordFilter>.Instance,
            matchTimeout: TimeSpan.FromTicks(1)
        );
        await filter.ReloadAsync(CancellationToken.None);

        WordFilterResult result = filter.Apply(new string('a', 200_000), WordFilterSource.RoomChat, 9);

        result.Refused.Should().BeFalse();
        result.Changed.Should().BeFalse();
    }
}
```

(A one-tick timeout on a 200 000-character input reliably throws `RegexMatchTimeoutException`; if it
turns out flaky on the build machine, raise the input size rather than weakening the assertion.)

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilterTests`
Expected: build FAIL.

- [ ] **Step 3: Implement**

`DurableRecord.cs` — append:
```csharp
internal sealed record WordFilterHitRecord(
    WordFilterHit Hit,
    DateTime OccurredAt,
    string? CorrelationId
) : DurableRecord(OccurredAt, CorrelationId);
```
(with `using Vortex.Observability.WordFilter;`)

`AuditWriterService.cs` — in `MapEntity`'s switch, before the default arm:
```csharp
            WordFilterHitRecord hit => MapWordFilterHit(hit),
```
and beside `MapItem`:
```csharp
    private static WordFilterHitEntity MapWordFilterHit(WordFilterHitRecord record) =>
        new()
        {
            PlayerEntityId = record.Hit.PlayerId,
            Source = record.Hit.Source,
            WordId = record.Hit.WordId,
            Action = record.Hit.Action,
            OriginalText = record.Hit.OriginalText,
            OccurredAt = record.OccurredAt,
        };
```

`WordFilter.cs`:
```csharp
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Orleans;
using Vortex.Database.Context;
using Vortex.Observability.Audit;
using Vortex.Primitives.Moderation.WordFilter;
using Vortex.Primitives.Observability;
using Vortex.Primitives.Orleans;

namespace Vortex.Observability.WordFilter;

/// <summary>One journaled hit, before the writer stamps it and turns it into a row.</summary>
public sealed record WordFilterHit(
    int PlayerId,
    WordFilterSource Source,
    int WordId,
    WordFilterAction Action,
    string OriginalText
);

/// <summary>
/// The hotel-wide word filter: one compiled set behind a volatile reference, swapped whole on
/// reload.
/// </summary>
/// <remarks>
/// <para>
/// Empty until the first <see cref="ReloadAsync"/>, which <see cref="WordFilterLoader"/> runs once
/// the host has started (the config grain needs a running silo). Until then everything passes —
/// the window is the seconds between boot and the first accepted socket.
/// </para>
/// <para>
/// <c>ponytail:</c> a reload refreshes this silo only. The hotel runs one silo, shared in-process by
/// the grains, the web API and the dashboard; with several, the admin service's reload becomes a
/// broadcast (an Orleans stream every silo's filter subscribes to).
/// </para>
/// </remarks>
public sealed class WordFilter : IWordFilter
{
    private static readonly TimeSpan DefaultMatchTimeout = TimeSpan.FromMilliseconds(50);

    private readonly Func<
        CancellationToken,
        Task<(IReadOnlyList<WordFilterEntry> Words, string Replacement, string Refused)>
    > _source;
    private readonly Action<WordFilterHit> _journal;
    private readonly ILogger<WordFilter> _logger;
    private readonly TimeSpan _matchTimeout;

    private volatile WordFilterSet _set = WordFilterSet.Empty;
    private volatile string _refusedMessage = WordFilterConfig.RefusedMessageDefault;

    public WordFilter(
        IDbContextFactory<VortexDbContext> dbCtxFactory,
        IGrainFactory grainFactory,
        AuditChannel channel,
        IVortexContextAccessor contextAccessor,
        ILogger<WordFilter> logger
    )
        : this(
            ct => LoadAsync(dbCtxFactory, grainFactory, ct),
            hit => Enqueue(channel, contextAccessor, logger, hit),
            logger
        ) { }

    internal WordFilter(
        Func<
            CancellationToken,
            Task<(IReadOnlyList<WordFilterEntry> Words, string Replacement, string Refused)>
        > source,
        Action<WordFilterHit> journal,
        ILogger<WordFilter> logger,
        TimeSpan? matchTimeout = null
    )
    {
        _source = source;
        _journal = journal;
        _logger = logger;
        _matchTimeout = matchTimeout ?? DefaultMatchTimeout;
    }

    public string RefusedMessage => _refusedMessage;

    public WordFilterResult Apply(string text, WordFilterSource source, int playerId)
    {
        WordFilterVerdict verdict = Evaluate(text);

        if (verdict.FirstWordId == 0)
        {
            return new WordFilterResult(verdict.Text, false, false);
        }

        // A name with "bobba" spliced into it is not a name anyone chose: any hit refuses it.
        bool refused = verdict.Refused || source == WordFilterSource.Username;

        _journal(
            new WordFilterHit(
                playerId,
                source,
                verdict.FirstWordId,
                refused ? WordFilterAction.Refuse : WordFilterAction.Replace,
                text.Length > WordFilterConfig.JournalTextMaxLength
                    ? text[..WordFilterConfig.JournalTextMaxLength]
                    : text
            )
        );

        return refused
            ? new WordFilterResult(text, true, false)
            : new WordFilterResult(verdict.Text, false, verdict.Changed);
    }

    public WordFilterResult Test(string text)
    {
        WordFilterVerdict verdict = Evaluate(text);

        return new WordFilterResult(verdict.Text, verdict.Refused, verdict.Changed);
    }

    public async Task ReloadAsync(CancellationToken ct)
    {
        (IReadOnlyList<WordFilterEntry> words, string replacement, string refused) = await _source(ct)
            .ConfigureAwait(false);

        _set = WordFilterSet.Build(words, replacement, _matchTimeout);
        _refusedMessage = refused;

        _logger.LogInformation("Word filter loaded: {Count} word(s)", _set.Count);
    }

    private WordFilterVerdict Evaluate(string text)
    {
        try
        {
            return _set.Evaluate(text);
        }
        catch (RegexMatchTimeoutException ex)
        {
            // Fail open: a line nobody can filter in time is let through rather than thrown into
            // the chat path. Logged so a pattern that times out on real input gets looked at.
            _logger.LogWarning(ex, "Word filter timed out on a {Length}-character text; let through", text.Length);

            return new WordFilterVerdict(text, false, false, 0, default);
        }
    }

    private static async Task<(IReadOnlyList<WordFilterEntry>, string, string)> LoadAsync(
        IDbContextFactory<VortexDbContext> dbCtxFactory,
        IGrainFactory grainFactory,
        CancellationToken ct
    )
    {
        ImmutableDictionary<string, string> config = await grainFactory
            .GetServerConfigGrain()
            .GetManyAsync(WordFilterConfig.Keys)
            .ConfigureAwait(false);

        await using VortexDbContext db = await dbCtxFactory.CreateDbContextAsync(ct).ConfigureAwait(false);

        List<WordFilterEntry> words = await db
            .WordFilterWords.AsNoTracking()
            .Select(w => new WordFilterEntry(w.Id, w.Word, w.Action, w.Match, w.Replacement))
            .ToListAsync(ct)
            .ConfigureAwait(false);

        return (
            words,
            config.GetValueOrDefault(WordFilterConfig.ReplacementKey, WordFilterConfig.ReplacementDefault),
            config.GetValueOrDefault(WordFilterConfig.RefusedMessageKey, WordFilterConfig.RefusedMessageDefault)
        );
    }

    private static void Enqueue(
        AuditChannel channel,
        IVortexContextAccessor contextAccessor,
        ILogger logger,
        WordFilterHit hit
    )
    {
        WordFilterHitRecord record = new(hit, DateTime.UtcNow, contextAccessor.Current?.CorrelationId.Value);

        if (!channel.TryWrite(record))
        {
            logger.LogWarning(
                "Word filter hit dropped (channel saturated): player {PlayerId} word {WordId}",
                hit.PlayerId,
                hit.WordId
            );
        }
    }
}
```

Check against the real code while writing: the exact `using` for `IVortexContextAccessor` (see
`ChannelEconomyLedger.cs`), whether `GetManyAsync` returns only keys that exist (then
`GetValueOrDefault` is right), and the `VortexEventIds` convention — if `ChannelEconomyLedger` logs
with an event id, add one for the word filter in the same enum.

`WordFilterLoader.cs`:
```csharp
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Vortex.Primitives.Moderation.WordFilter;

namespace Vortex.Observability.WordFilter;

/// <summary>
/// Runs the filter's first reload once the host — and with it the silo — has started. Loading in
/// <c>StartAsync</c> would race the silo for the config grain.
/// </summary>
internal sealed class WordFilterLoader(
    IWordFilter filter,
    IHostApplicationLifetime lifetime,
    ILogger<WordFilterLoader> logger
) : IHostedService
{
    public Task StartAsync(CancellationToken ct)
    {
        lifetime.ApplicationStarted.Register(() =>
            _ = filter
                .ReloadAsync(lifetime.ApplicationStopping)
                .ContinueWith(
                    t => logger.LogError(t.Exception, "Word filter failed its first load; it passes everything until the next edit"),
                    TaskContinuationOptions.OnlyOnFaulted
                )
        );

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
```

`ObservabilityModule.cs` — beside the other audit sinks:
```csharp
        services.TryAddSingleton<IWordFilter, WordFilter.WordFilter>();
        services.AddHostedService<WordFilterLoader>();
```
(fully-qualify or alias to dodge the namespace/type name clash, e.g.
`using WordFilterService = Vortex.Observability.WordFilter.WordFilter;`).

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.Hosting.Tests --filter FullyQualifiedName~WordFilter`
Expected: PASS. Then `dotnet build Vortex.Main/Vortex.Main.csproj -t:VortexCloudFastCheck` — PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "filtre : le service, son journal et son chargement" -- Vortex.Observability Vortex.Hosting.Tests/WordFilter
```

---

### Task 5: The refusal bubble, and room chat

**Files:**
- Create: `Vortex.Protocol/Messages/Outgoing/Notifications/WordFilterNotice.cs`
- Modify: `Vortex.Rooms/Grains/RoomGrain.cs` (constructor param + `internal readonly IWordFilter _wordFilter`)
- Modify: `Vortex.Rooms/Grains/Systems/RoomChatSystem.cs` (~line 117-120)
- Modify: the ten test files constructing `RoomGrain` (list below) — append one argument
- Test: `Vortex.Rooms.Tests/Chat/HotelWordFilterTests.cs`

**Interfaces:**
- Consumes: `IWordFilter`, `WordFilterResult`, `WordFilterSource.RoomChat`.
- Produces: `WordFilterNotice.Create(string message) : NotificationDialogMessageComposer`;
  `RoomChatSystem.ApplyHotelFilterAsync(PlayerId playerId, string text) : Task<string?>` (null = refused, notice already sent).

- [ ] **Step 1: Write `WordFilterNotice`**

```csharp
using System.Collections.Immutable;

namespace Vortex.Protocol.Messages.Outgoing.Notifications;

/// <summary>
/// The bubble a player gets when the hotel-wide word filter refuses what they wrote.
/// </summary>
/// <remarks>
/// <c>display=BUBBLE</c> and <c>message</c> travel as parameters, and the client's
/// <c>HabboNotifications.showNotification</c> takes both from the parameters before it looks at
/// external_variables or the texts file — so this needs no client data at all, and the text is the
/// operator's (<c>word_filter.refused_message</c>).
/// </remarks>
public static class WordFilterNotice
{
    public const string Type = "word_filter";

    public static NotificationDialogMessageComposer Create(string message) =>
        new()
        {
            Type = Type,
            Parameters =
            [
                new NotificationDialogParameter { Key = "display", Value = "BUBBLE" },
                new NotificationDialogParameter { Key = "message", Value = message },
            ],
        };
}
```

- [ ] **Step 2: Add the dependency to `RoomGrain`**

Append `IWordFilter wordFilter` as the LAST constructor parameter (after `ICommerceJournal
commerceJournal`), store it as `internal readonly IWordFilter _wordFilter;` beside
`_commerceJournal`. Then append one argument to every construction site — find them with:

Run: `grep -rln "CreateWithIntegerKey<RoomGrain>\|new RoomGrain(" --include=*.cs . | grep -v /obj/`

Expected list (10): `Vortex.Rooms.Tests/Chat/ChatFloodTests.cs`, `Chat/RoomFilterWordsTests.cs`,
`Grains/TickBoundaryTests.cs`, `Moderation/HotelMuteEnforcementTests.cs`,
`MysteryBox/RoomGrainMysteryBoxAbandonTests.cs`, `Pets/PetCareTests.cs`, `Rooms/RoomRatingTests.cs`,
`Support/RoomHarness.cs`, `Wired/WiredContractSettlementOrderingTests.cs`,
`Wired/WiredTradeSessionTests.cs`. In each, the new last argument is
`RoomGrainStubs.PassThroughWordFilter()`, which you add to `Vortex.Rooms.Tests/Support/RoomGrainStubs.cs`:

```csharp
    /// <summary>A filter with an empty list: every text comes back untouched.</summary>
    public static IWordFilter PassThroughWordFilter() =>
        FakeProxy.Create<IWordFilter>(call =>
            call.Method.Name switch
            {
                nameof(IWordFilter.Apply) or nameof(IWordFilter.Test) =>
                    new WordFilterResult((string)call.Args![0]!, false, false),
                nameof(IWordFilter.RefusedMessage) or "get_RefusedMessage" => "refused",
                _ => null,
            });
```

- [ ] **Step 3: Write the failing test**

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Vortex.Primitives.Moderation.WordFilter;
using Vortex.Primitives.Players;
using Vortex.Protocol.Messages.Outgoing.Notifications;
using Vortex.Rooms.Grains.Systems;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.Rooms.Tests.Chat;

/// <summary>The hotel-wide filter on room chat: consulted as RoomChat, and a refusal tells the speaker.</summary>
public sealed class HotelWordFilterTests
{
    private static readonly PlayerId Talker = new(501);

    [Fact]
    public async Task AReplacedLine_ComesBackReplaced()
    {
        (RoomChatSystem chat, _) = NewChat(new WordFilterResult("t'es bobba", false, true), out List<ProxyCall> filterCalls);

        (await chat.ApplyHotelFilterAsync(Talker, "t'es con")).Should().Be("t'es bobba");

        filterCalls.Should().ContainSingle(c => c.Method.Name == nameof(IWordFilter.Apply))
            .Which.Args.Should().BeEquivalentTo(new object[] { "t'es con", WordFilterSource.RoomChat, 501 });
    }

    [Fact]
    public async Task ARefusedLine_IsNullAndTheSpeakerGetsTheBubble()
    {
        (RoomChatSystem chat, List<object> sent) = NewChat(new WordFilterResult("t'es con", true, false), out _);

        (await chat.ApplyHotelFilterAsync(Talker, "t'es con")).Should().BeNull();

        sent.Should().ContainSingle().Which.Should().BeOfType<NotificationDialogMessageComposer>()
            .Which.Type.Should().Be(WordFilterNotice.Type);
    }

    // Build the RoomGrain exactly as HotelMuteEnforcementTests.NewChat does, with two differences:
    //  - the IGrainFactory fake answers GetGrain<IPlayerPresenceGrain> with a FakeProxy whose
    //    SendComposerAsync adds its composer argument to `sent` and returns Task.CompletedTask
    //    (see how ChatFloodTests captures FloodControlMessageComposer — copy that mechanism);
    //  - the last argument is a FakeProxy<IWordFilter> that records every call into `filterCalls`,
    //    answers Apply with `answer`, and RefusedMessage with "Interdit.".
    private static (RoomChatSystem, List<object>) NewChat(WordFilterResult answer, out List<ProxyCall> filterCalls)
    {
        // implementation per the comment above — the construction list must match RoomGrain's
        // constructor after Step 2.
    }
}
```

`NewChat` is left as a comment only because its body is the ~30-line constructor list that
already exists in `HotelMuteEnforcementTests.NewChat` plus the capture mechanism already in
`ChatFloodTests` — open both and combine them; do not invent a third way to capture composers.

- [ ] **Step 4: Run to verify failure**

Run: `dotnet test Vortex.Rooms.Tests --filter FullyQualifiedName~HotelWordFilterTests`
Expected: FAIL — `ApplyHotelFilterAsync` does not exist.

- [ ] **Step 5: Implement in `RoomChatSystem`**

Add the method:
```csharp
    /// <summary>
    /// The hotel-wide filter, before the room's own. Null means refused: the line reaches nobody,
    /// the speaker included, and the speaker is told why.
    /// </summary>
    internal async Task<string?> ApplyHotelFilterAsync(PlayerId playerId, string text)
    {
        WordFilterResult result = _roomGrain._wordFilter.Apply(
            text,
            WordFilterSource.RoomChat,
            playerId.Value
        );

        if (!result.Refused)
        {
            return result.Text;
        }

        await _roomGrain
            ._grainFactory.GetPlayerPresenceGrain(playerId)
            .SendComposerAsync(WordFilterNotice.Create(_roomGrain._wordFilter.RefusedMessage));

        return null;
    }
```

and in `SendChatFromPlayerAsync`, replace
```csharp
        text = ApplyFilterWords(text);
```
with
```csharp
        // The hotel's list first, then the room owner's. A refusal ends the line here, after the
        // cancellable event for the same reason the room filter sits after it: a handler still sees
        // what was actually typed.
        string? allowed = await ApplyHotelFilterAsync(playerId, text).ConfigureAwait(true);

        if (allowed is null)
        {
            return;
        }

        text = ApplyFilterWords(allowed);
```
Check `playerId.Value` is how `PlayerId` exposes its int (it is `PlayerId.Value` elsewhere in this
file's neighbours); adjust if it is an implicit conversion.

- [ ] **Step 6: Run the room tests**

Run: `dotnet test Vortex.Rooms.Tests`
Expected: PASS (the new tests and every existing one).

- [ ] **Step 7: Commit**

```bash
git commit -m "filtre : le chat des apparts, et la bulle de refus" -- Vortex.Protocol/Messages/Outgoing/Notifications/WordFilterNotice.cs Vortex.Rooms Vortex.Rooms.Tests
```

---

### Task 6: Packet handlers — private messages, room invites, motto, names

**Files:**
- Modify: `Vortex.PacketHandlers/FriendList/SendMsgMessageHandler.cs`
- Modify: `Vortex.PacketHandlers/FriendList/SendRoomInviteMessageHandler.cs`
- Modify: `Vortex.PacketHandlers/Room/Avatar/ChangeMottoMessageHandler.cs`
- Modify: `Vortex.PacketHandlers/Avatar/ChangeUserNameMessageHandler.cs`
- Modify: `Vortex.PacketHandlers/Avatar/CheckUserNameMessageHandler.cs`
- Modify: `Vortex.PacketHandlers.Tests/Vortex.PacketHandlers.Tests.csproj` (reference `Vortex.Tests.Support`)
- Test: `Vortex.PacketHandlers.Tests/WordFilterHandlerTests.cs`

**Interfaces:**
- Consumes: `IWordFilter`, `WordFilterNotice.Create`.
- Produces: nothing new for later tasks.

Filtering happens in the handlers rather than the grains: the invite is fanned out to N grains and
must be filtered (and journaled) once; the motto and the name are single-caller paths; and the
private message's refusal is answered by the handler anyway. A Habbicon message goes through
`MessengerGrain.SendMessageAsync` from `PlayerHabbiconGrain` with an empty body and never reaches
this handler, which is correct — it has no text.

- [ ] **Step 1: Write the failing tests**

```csharp
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Orleans;
using Vortex.Messages.Registry;
using Vortex.PacketHandlers.Avatar;
using Vortex.PacketHandlers.FriendList;
using Vortex.PacketHandlers.Room.Avatar;
using Vortex.Primitives.Moderation.WordFilter;
using Vortex.Primitives.Networking;
using Vortex.Primitives.Players;
using Vortex.Primitives.Rooms;
using Vortex.Protocol.Messages.Outgoing.Notifications;
using Vortex.Tests.Support;
using Xunit;

namespace Vortex.PacketHandlers.Tests;

public sealed class WordFilterHandlerTests
{
    private readonly List<object> _sent = [];
    private readonly List<ProxyCall> _grainCalls = [];

    private MessageContext Context() =>
        new(
            FakeProxy.Create<ISessionContext>(call =>
            {
                if (call.Method.Name == nameof(ISessionContext.SendComposerAsync))
                {
                    _sent.Add(call.Args![0]!);
                    return Task.CompletedTask;
                }
                return null;
            }),
            PlayerId.Parse(501),
            default(RoomId)
        );

    // Every grain the handler asks for is a FakeProxy that records its calls into _grainCalls.
    private IGrainFactory Grains() =>
        FakeProxy.Create<IGrainFactory>(call =>
            call.Method.Name == nameof(IGrainFactory.GetGrain) && call.Method.IsGenericMethod
                ? FakeProxy.CreateFor(call.Method.GetGenericArguments()[0], inner =>
                {
                    _grainCalls.Add(inner);
                    return null;
                })
                : null);

    private static IWordFilter Refusing() =>
        FakeProxy.Create<IWordFilter>(call => call.Method.Name switch
        {
            nameof(IWordFilter.Apply) or nameof(IWordFilter.Test) => new WordFilterResult((string)call.Args![0]!, true, false),
            "get_RefusedMessage" => "Interdit.",
            _ => null,
        });

    private static IWordFilter Replacing(string with) =>
        FakeProxy.Create<IWordFilter>(call => call.Method.Name switch
        {
            nameof(IWordFilter.Apply) or nameof(IWordFilter.Test) => new WordFilterResult(with, false, true),
            _ => null,
        });

    [Fact]
    public async Task ARefusedMotto_IsNeverSaved_AndTheBubbleIsSent()
    {
        await new ChangeMottoMessageHandler(Grains(), Refusing())
            .HandleAsync(new() { Text = "con" }, Context(), CancellationToken.None);

        _grainCalls.Should().NotContain(c => c.Method.Name == "SetMottoAsync");
        _sent.Should().ContainSingle().Which.Should().BeOfType<NotificationDialogMessageComposer>();
    }

    [Fact]
    public async Task AReplacedMotto_IsSavedReplaced()
    {
        await new ChangeMottoMessageHandler(Grains(), Replacing("bobba"))
            .HandleAsync(new() { Text = "con" }, Context(), CancellationToken.None);

        _grainCalls.Should().ContainSingle(c => c.Method.Name == "SetMottoAsync")
            .Which.Args![0].Should().Be("bobba");
    }

    [Fact]
    public async Task ARefusedInvite_ReachesNobody()
    {
        await new SendRoomInviteMessageHandler(Grains(), Refusing(), Microsoft.Extensions.Logging.Abstractions.NullLogger<SendRoomInviteMessageHandler>.Instance)
            .HandleAsync(new() { FriendIds = [7, 8], Message = "con" }, Context(), CancellationToken.None);

        _grainCalls.Should().NotContain(c => c.Method.Name == "ReceiveRoomInviteAsync");
        _sent.Should().ContainSingle().Which.Should().BeOfType<NotificationDialogMessageComposer>();
    }

    [Fact]
    public async Task ARefusedPrivateMessage_IsNeverSent_AndAnswersOfflineFailed()
    {
        await new SendMsgMessageHandler(Grains(), Refusing())
            .HandleAsync(new() { ChatId = 7, Message = "con" }, Context(), CancellationToken.None);

        _grainCalls.Should().NotContain(c => c.Method.Name == "SendMessageAsync");
        _sent.Should().HaveCount(2);
        _sent.Should().ContainSingle(s => s is NotificationDialogMessageComposer);
        _sent.Should().ContainSingle(s => s is Vortex.Protocol.Messages.Outgoing.FriendList.InstantMessageErrorMessageComposer);
    }

    // CheckUserName: a filtered name answers NameNotValid (4) and never asks the directory.
    // Build the handler with an IConfiguration from `new ConfigurationBuilder().Build()` (the
    // handler reads its bounds with GetValue defaults), then assert the single sent
    // CheckUserNameResultMessageComposer has ResultCode == 4 and that no call on _grainCalls is
    // GetPlayerIdAsync. Same test for ChangeUserName, additionally asserting no SetNameAsync.
}
```

Adapt the message initialisers (`new() { Text = ... }`) to the real incoming message record shapes
(`Vortex.Protocol/Messages/Incoming/...`) — open each record and use its real property names and
`required` members. Write the two name tests described in the trailing comment in full, in the same
style as the four above.

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test Vortex.PacketHandlers.Tests --filter FullyQualifiedName~WordFilterHandlerTests`
Expected: build FAIL (constructors take no `IWordFilter`).

- [ ] **Step 3: Implement**

Each handler takes `IWordFilter wordFilter` as a new constructor parameter (DI supplies it; handlers
are resolved from the root container, where `ObservabilityModule` registered it).

`ChangeMottoMessageHandler.HandleAsync`, replacing the last two lines:
```csharp
        WordFilterResult filtered = _wordFilter.Apply(message.Text, WordFilterSource.Motto, ctx.PlayerId);

        if (filtered.Refused)
        {
            await ctx.SendComposerAsync(WordFilterNotice.Create(_wordFilter.RefusedMessage), ct)
                .ConfigureAwait(false);

            return;
        }

        IPlayerGrain player = _grainFactory.GetPlayerGrain(ctx.PlayerId);

        await player.SetMottoAsync(filtered.Text, ct).ConfigureAwait(false);
```

`SendRoomInviteMessageHandler.HandleAsync`, after the early return and before the loop:
```csharp
        // Once, before the fan-out: one invite to twenty friends is one thing the player wrote.
        WordFilterResult filtered = _wordFilter.Apply(message.Message, WordFilterSource.RoomInvite, ctx.PlayerId);

        if (filtered.Refused)
        {
            await ctx.SendComposerAsync(WordFilterNotice.Create(_wordFilter.RefusedMessage), ct)
                .ConfigureAwait(false);

            return;
        }
```
and pass `filtered.Text` instead of `message.Message` to `ReceiveRoomInviteAsync`. The trailing
`await ValueTask.CompletedTask` stays.

`SendMsgMessageHandler.HandleAsync`, after the `PlayerId <= 0` return:
```csharp
        WordFilterResult filtered = _wordFilter.Apply(message.Message, WordFilterSource.Messenger, ctx.PlayerId);

        if (filtered.Refused)
        {
            // OfflineFailed (10) because the client's error table is a verbatim port of MainView.as's
            // ERROR_MESSAGES and has no "filtered" entry; 10 states the outcome without a cause, as
            // SendMessageAsync already does for the ignore-list refusal. The bubble says why.
            await ctx.SendComposerAsync(WordFilterNotice.Create(_wordFilter.RefusedMessage), ct)
                .ConfigureAwait(false);
            await ctx.SendComposerAsync(
                    new InstantMessageErrorMessageComposer
                    {
                        ErrorCode = InstantMessageErrorCodeType.OfflineFailed,
                        PlayerId = message.ChatId,
                        Message = message.Message,
                    },
                    ct
                )
                .ConfigureAwait(false);

            return;
        }
```
and pass `filtered.Text` instead of `message.Message` to `SendMessageAsync`.

`CheckUserNameMessageHandler` — after `NameChangeResultCode result = NameChangePolicy.Validate(...)`:
```csharp
        // Test, not Apply: this probe fires on every pause in typing, and journaling each one would
        // bury the journal. The claim (ChangeUserName) is what journals.
        if (result == NameChangeResultCode.Ok && _wordFilter.Test(name).Hit)
        {
            result = NameChangeResultCode.NameNotValid;
        }
```

`ChangeUserNameMessageHandler` — same place:
```csharp
        if (
            result == NameChangeResultCode.Ok
            && _wordFilter.Apply(name, WordFilterSource.Username, ctx.PlayerId).Refused
        )
        {
            result = NameChangeResultCode.NameNotValid;
        }
```
(`Apply` with `Username` refuses on any hit — Task 4.)

`Vortex.PacketHandlers.Tests.csproj` — add
`<ProjectReference Include="..\Vortex.Tests.Support\Vortex.Tests.Support.csproj" />`.

- [ ] **Step 4: Run the tests**

Run: `dotnet test Vortex.PacketHandlers.Tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -m "filtre : messages prives, invitations, devise et pseudo en jeu" -- Vortex.PacketHandlers Vortex.PacketHandlers.Tests
```

---

### Task 7: Web API — the feed and web names

**Files:**
- Modify: `Vortex.WebApi/Services/IWebApiFeedService.cs` (`FeedRefusal.WordFiltered`)
- Modify: `Vortex.WebApi/Services/WebApiFeedService.cs` (constructor + `PublishAsync`)
- Modify: `Vortex.WebApi/Hosting/WebApiEndpoints.Feed.cs` (the `Code(refusal)` mapping, if it is an explicit switch)
- Modify: `Vortex.WebApi/Services/WebApiPlayerService.cs` (constructor + the two name checks)
- Modify: `Vortex.WebApi/Hosting/WebApiWebHost.cs` (`ForwardSingletons`: add `IWordFilter`)
- Modify: `Vortex.WebApi.Tests/WebApiTestFactory.cs` (a `WordFilter` property, registered, passed to the feed service it builds)
- Modify: the 8 feed test files that `new WebApiFeedService(factory.DbContexts, factory.Events)` and `WebApiPurseTests.cs` (`new WebApiPlayerService(`) — append the filter argument
- Modify: `Vortex.WebApi/openapi.json` (regenerated) and `vortex-web/src/lib/api.generated.ts` (`pnpm api:types`)
- Test: `Vortex.WebApi.Tests/FeedWordFilterTests.cs`

**Interfaces:**
- Consumes: `IWordFilter`, `WordFilterSource.FeedPost`, `WordFilterSource.Username`.
- Produces: HTTP 400 `{ "error": "feed_word_filtered" }` on `POST /api/user/feed`.

- [ ] **Step 1: Write the failing test**

Open `Vortex.WebApi.Tests/FeedPublishTests.cs` first and copy its arrangement (how it seeds a
player, builds the service, calls `PublishAsync`). Then:

```csharp
// FeedWordFilterTests — in FeedPublishTests' style.
//
// [Fact] ARefusedBody_IsNotWritten_AndAnswersWordFiltered
//   filter = FakeProxy<IWordFilter> answering Apply with Refused = true
//   (FeedRefusal refusal, FeedPost? post) = await service.PublishAsync(player, new FeedPublishRequest { Kind = Status, Body = "con" }, ct)
//   refusal.Should().Be(FeedRefusal.WordFiltered); post.Should().BeNull();
//   (await db.WebFeedPosts.CountAsync()).Should().Be(0);
//
// [Fact] AReplacedBody_IsStoredReplaced
//   Apply answers ("t'es bobba", false, true) → post!.Body.Should().Be("t'es bobba")
//
// [Fact] ARefusedPollChoice_RefusesThePost
//   Apply answers Refused only when Args[0] is "con"; body "Qui ?", choices ["toi", "con"]
//   → FeedRefusal.WordFiltered
//
// [Fact] ThePublishRoute_Answers400WordFiltered
//   through factory's HTTP client, as FeedEndpointTests does: POST /api/user/feed → 400,
//   body error == "feed_word_filtered"
```

Write those four tests in full in the arrangement you copied — they are fully specified above;
only the fixture plumbing is borrowed.

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test Vortex.WebApi.Tests --filter FullyQualifiedName~FeedWordFilterTests`
Expected: build FAIL.

- [ ] **Step 3: Implement**

`FeedRefusal` — append `WordFiltered,` after `KindMismatch`.

`WebApiFeedService` — constructor gains `IWordFilter wordFilter` (third parameter). In
`PublishAsync`, immediately after the `PollInvalid` check (all shape checks done, nothing written
yet):
```csharp
        // Last of the checks, so a post refused for its shape is not journaled as a filter hit.
        WordFilterResult filteredBody = _wordFilter.Apply(text, WordFilterSource.FeedPost, playerId);

        if (filteredBody.Refused)
        {
            return (FeedRefusal.WordFiltered, null);
        }

        text = filteredBody.Text;

        List<string> filteredChoices = new(choices.Count);

        foreach (string choice in choices)
        {
            WordFilterResult filtered = _wordFilter.Apply(choice, WordFilterSource.FeedPost, playerId);

            if (filtered.Refused)
            {
                return (FeedRefusal.WordFiltered, null);
            }

            filteredChoices.Add(filtered.Text);
        }

        choices = filteredChoices;
```
`choices` is declared `IReadOnlyList<string>`, so the reassignment compiles; `text` must be a local
that is not `const`/readonly — it is (`string text = ...Trim();`). A replacement can push a choice
past `WebFeedPollChoiceEntity.LabelLength` or the body past `BodyLength` ("bobba" is longer than a
3-letter word): after the loops, re-check both limits and answer `BodyTooLong` / `PollInvalid` —
the same answers the first checks give.

Hashtags and mentions are extracted later in the method from `text`, so they now come from the
filtered body — which is right: a replaced word must not survive as a tag.

`WebApiEndpoints.Feed.cs` — find `Code(FeedRefusal)`; if it maps each member explicitly, add
`FeedRefusal.WordFiltered => "feed_word_filtered",`; if it derives the code from the name, check it
yields exactly `feed_word_filtered` and otherwise make it explicit.

`WebApiPlayerService` — constructor gains `IWordFilter wordFilter`. In `CreateAvatarAsync`, extend
the `!NameShape.IsWellFormed(name)` branch:
```csharp
        else if (
            !NameShape.IsWellFormed(name)
            || _wordFilter.Apply(name, WordFilterSource.Username, accountId).Refused
        )
```
Note the journal's player id here is the ACCOUNT id — there is no player yet. Say so in a comment
on that line. In the rename method (~line 147-154), the same `|| _wordFilter.Apply(name,
WordFilterSource.Username, playerId).Refused` beside its `IsWellFormed` check, with the player id it
has.

`WebApiWebHost.ForwardSingletons` — add, beside the other root singletons:
```csharp
        // The very instance the grains use: one compiled list, one reload.
        services.AddSingleton(rootServices.GetRequiredService<IWordFilter>());
```

`WebApiTestFactory` — add `public IWordFilter WordFilter { get; set; } = <pass-through FakeProxy, as in Task 5's RoomGrainStubs.PassThroughWordFilter>;`,
register it (`builder.Services.AddSingleton(WordFilter)`) and pass it where the factory builds
`new WebApiFeedService(DbContexts, Events)` (line ~167). Update the 8 feed test files and
`WebApiPurseTests.cs` to pass `factory.WordFilter`.

- [ ] **Step 4: Run the tests and the checks**

Run: `dotnet test Vortex.WebApi.Tests`
Expected: PASS (including `OpenApiDocumentTests` once `openapi.json` is regenerated — see how the
repo regenerates it: grep `openapi.json` in `Vortex.WebApi.Tests/OpenApiDocumentTests.cs` for the
instruction it prints on mismatch, and follow it).
Run: `node scripts/hooks/check-webapi-forwarding.mjs`
Expected: clean.
Then in vortex-web: `pnpm api:types` and check `api.generated.ts` changed only by the new refusal.

- [ ] **Step 5: Commit** (two repos, two commits)

```bash
git commit -m "filtre : le fil du site et les pseudos du site" -- Vortex.WebApi Vortex.WebApi.Tests
```
In the client repo:
```bash
git commit -m "web : les types du refus par le filtre" -- packages/vortex-web/src/lib/api.generated.ts
```

---

### Task 8: vortex-web — the refusal toast

**Files:**
- Modify: `vortex-web/src/components/feed/FeedComposer.svelte` (its publish error path)
- Modify: `vortex-web/src/locales/site/fr.json`, `vortex-web/src/locales/site/en.json`

**Interfaces:**
- Consumes: the 400 `feed_word_filtered` from Task 7.

- [ ] **Step 1: Find how the composer surfaces errors today**

Run: `grep -n "notifier\|catch\|error" packages/vortex-web/src/components/feed/FeedComposer.svelte`
and read `packages/vortex-web/src/lib/notifier.ts`. Errors go through the notifier as toasts, never
inline (project memory: "vortex-web notifier"). Find how an error code from `request()` reaches the
catch (the `api.ts` error type and its `code`/`error` field).

- [ ] **Step 2: Add the texts**

`src/locales/site/fr.json`: `"SITE_FEED_WORD_FILTERED": "Ton message contient un mot interdit."`
`src/locales/site/en.json`: `"SITE_FEED_WORD_FILTERED": "Your message contains a forbidden word."`
(same position in both files, beside the other `SITE_FEED_*` error keys).

- [ ] **Step 3: Map the code**

In the composer's publish catch, where other refusal codes are turned into toasts, map
`feed_word_filtered` → `t('SITE_FEED_WORD_FILTERED')` through the notifier's error toast. If the
composer maps codes through a table, add one row; if it shows a generic error, add the one case.
The comment form is the same component (`parentId`), so comments are covered.

- [ ] **Step 4: Verify**

Run: `cd packages/vortex-web && pnpm build` — PASS. Then, with the emulator running and a word
listed as Refuse (after Task 9, or with a row inserted by hand), publish it from `/community/chats`
and see the toast.

- [ ] **Step 5: Commit**

```bash
git commit -m "web : le fil dit quand un mot est interdit" -- packages/vortex-web/src/components/feed/FeedComposer.svelte packages/vortex-web/src/locales/site
```

---

### Task 9: Dashboard — capability, admin service, routes, page

**Files (server):**
- Modify: `Vortex.Primitives/Permissions/Capabilities.cs` (`OpsWordFilterManage = "dashboard.ops.wordfilter.manage"` + `Dashboard.All`)
- Modify: `Vortex.Authentication/Permissions/DefaultRoles.cs` (grant it where `OpsFeedModerate` is granted)
- Create: `Vortex.Primitives/Moderation/WordFilter/IWordFilterAdminService.cs`
- Create: `Vortex.Dashboard.API/Admin/Hotel/WordFilterAdminService.cs`
- Create: `Vortex.Dashboard.API/Operations/Hotel/WordFilterOperations.cs`
- Create: `Vortex.Dashboard.API/Api/Hotel/WordFilterReads.cs` (+ contracts file beside the others in `Api/Hotel/Contracts/`)
- Create: `Vortex.Dashboard.API/Hosting/Hotel/DashboardEndpoints.WordFilter.cs`
- Modify: `Vortex.Dashboard.API/DashboardPlugin.cs` (register the four), `Hosting/DashboardEndpoints.cs` (call the two `Map*`), `DashboardWebHost.DeclaredServiceTypes` if reads/operations types must be declared there (check how `FeedOperations`/`SocialReads` are)
- Test: `Vortex.Dashboard.Tests/WordFilterAdminServiceTests.cs`

**Files (front end):**
- Create: `Vortex.Dashboard.Web/src/pages/WordFilterPage.svelte`
- Modify: `Vortex.Dashboard.Web/src/lib/dashboardPermissions.js`, `src/lib/routes.js`, `src/lib/locales/en.js`, `src/lib/locales/fr.js`

**Interfaces:**
- Consumes: `IWordFilter.ReloadAsync`, `IWordFilter.Test`, `WordFilterNormalizer.Key`, entities from Task 2.
- Produces (HTTP, all under the capability):
  - `GET  /api/v1/wordfilter/words` → `WordFilterWordList { items: WordFilterWordRow[] }`, row = `{ id, word, action, match, replacement, createdBy, createdAt }`
  - `GET  /api/v1/wordfilter/hits?playerId=&source=&page=` → `{ items: WordFilterHitRow[], total }`, row = `{ id, playerId, playerName, playerFigure, source, wordId, word, action, originalText, occurredAt }`, 50 per page, newest first
  - `POST /api/v1/wordfilter/test` `{ text }` → `{ text, refused, changed }`
  - `POST <ApiOperations>/wordfilter/words` `{ word, action, match, replacement, reason }`, `…/words/update` `{ id, … , reason }`, `…/words/remove` `{ id, reason }` → `OperationResult`

Before writing anything here, read in full: `docs/architecture/dashboard-architecture.md` §3, §11-17;
`docs/walkthroughs/add-a-dashboard-page.md`; the Feed pair (`Admin/Hotel/FeedAdminService.cs`,
`Operations/Hotel/FeedOperations.cs`, `Hosting/Hotel/DashboardEndpoints.Feed.cs`) and a reads pair
(`Hosting/Hotel/DashboardEndpoints.Bots.cs` + its `BotReads`). Use the emulator's
`/new-dashboard-page` skill checklist if available. The shapes below follow those files; where
they disagree with what you read, the files win.

- [ ] **Step 1: Write the failing admin-service tests**

In `Vortex.Dashboard.Tests/WordFilterAdminServiceTests.cs`, copying the DB setup of
`FeedAdminServiceTests.cs`:

```csharp
// AddAsync_StoresTheWordAndItsKey_AndReloads
//   await admin.AddAsync("C.0.N", Refuse, WholeWord, null, "ops@x", ct)
//   → row with Word "C.0.N", Key "con"; the fake IWordFilter recorded exactly one ReloadAsync
// AddAsync_RefusesASecondSpellingOfTheSameWord
//   add "con" then "cooonn" → second returns WordFilterAdminOutcome.Duplicate, one row, one reload
// AddAsync_RefusesAnEmptyOrTooLongWord → Invalid, no row, no reload
// AddAsync_RevivesASoftDeletedWord
//   add "con", remove it, add "con" again → one row, DeletedAt null, new action applied
// UpdateAsync_ChangesActionMatchReplacement_AndReloads
// RemoveAsync_SoftDeletes_AndReloads; RemoveAsync_OfAMissingId_IsNotFound_AndDoesNotReload
```
Write each as a full `[Fact]` in `FeedAdminServiceTests`' style.

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test Vortex.Dashboard.Tests --filter FullyQualifiedName~WordFilterAdminServiceTests`
Expected: build FAIL.

- [ ] **Step 3: Implement the admin service**

`IWordFilterAdminService.cs`:
```csharp
using System.Threading;
using System.Threading.Tasks;

namespace Vortex.Primitives.Moderation.WordFilter;

public enum WordFilterAdminOutcome
{
    Done = 0,
    Invalid = 1,
    Duplicate = 2,
    NotFound = 3,
}

/// <summary>
/// Staff's edits to the hotel-wide word list. Reachable only through dashboard routes carrying
/// <c>dashboard.ops.wordfilter.manage</c>; no capability check in here (the route has it).
/// </summary>
/// <remarks>
/// Category C of the dashboard architecture (§11): the rows feed the compiled set inside
/// <see cref="IWordFilter"/>. Every successful write ends with <see cref="IWordFilter.ReloadAsync"/>,
/// and the edit is functionally done only when that returns — the hotel filters with the new list
/// from the next line on.
/// </remarks>
public interface IWordFilterAdminService
{
    Task<WordFilterAdminOutcome> AddAsync(string word, WordFilterAction action, WordFilterMatch match, string? replacement, string actor, CancellationToken ct);

    Task<WordFilterAdminOutcome> UpdateAsync(int id, string word, WordFilterAction action, WordFilterMatch match, string? replacement, CancellationToken ct);

    Task<WordFilterAdminOutcome> RemoveAsync(int id, CancellationToken ct);
}
```

`WordFilterAdminService.cs` — `(IDbContextFactory<VortexDbContext> dbCtxFactory, IWordFilter filter)`:
- validation shared by add/update: `word = word.Trim()`; `key = WordFilterNormalizer.Key(word)`;
  Invalid when `word.Length is 0 or > WordFilterConfig.WordMaxLength`, `key.Length == 0`, or
  `replacement?.Length > WordFilterConfig.WordMaxLength`; an empty/whitespace replacement is stored
  as null.
- Add: look up by `Key` **ignoring the soft-delete filter** (`IgnoreQueryFilters()`); live row →
  Duplicate; deleted row → revive (`DeletedAt = null`, overwrite word/action/match/replacement,
  `CreatedBy = actor`); none → insert. `SaveChangesAsync`, then `await filter.ReloadAsync(ct)`.
- Update: live row by id or NotFound; a different live row with the new key → Duplicate; else
  overwrite, save, reload.
- Remove: live row by id or NotFound; `DeletedAt = DateTime.UtcNow`, save, reload.

`WordFilterOperations.cs` — one method per write, each through `_runner.ExecuteAsync(...)` exactly
like `FeedOperations.RemovePostAsync`, with operation names `ops.wordfilter.word.add` /
`.update` / `.remove`, `detail: new { word, action, match }` (or `{ id }`), and an outcome other than
`Done` thrown as `InvalidOperationException("wordfilter_" + outcome.ToString().ToLowerInvariant())`
so the runner records it.

`WordFilterReads.cs` — the list (live rows, ordered by word) and the journal page (join
`WordFilterHits` to `Players` for name + figure and to `WordFilterWords` **with**
`IgnoreQueryFilters()` so a deleted word still shows its text; filters `playerId`, `source`; 50 per
page, `OccurredAt` descending; `total` from the same filtered query). Player figure → avatar URL the
way `DashboardAssetUrls` does it for other player rows.

`DashboardEndpoints.WordFilter.cs` — `MapWordFilterReads` (the two GETs with `MapReadGet<>`, plus
`POST …/test` answering `filter.Test(body.Text)` — no reason, no audit, it changes nothing) and
`MapWordFilterOperations` (the three POSTs with `MapPost`, each validating `reason` is non-blank the
way the Feed route relies on the runner to, and answering `Results.Ok(await ops.XAsync(..., body.Reason, ctx.ActorEmail(), ct))`).
Every route carries `Capabilities.Dashboard.OpsWordFilterManage`.

Register in `DashboardPlugin.cs` beside the Feed ones:
`TryAddSingleton<IWordFilterAdminService, WordFilterAdminService>()`,
`TryAddSingleton<WordFilterOperations>()`, `TryAddSingleton<WordFilterReads>()`, and call both
`Map*` in `DashboardEndpoints.cs` beside `MapFeedOperations(app)`.

- [ ] **Step 4: Run the server tests**

Run: `dotnet test Vortex.Dashboard.Tests`
Expected: PASS — including `CapabilityDeclarationTests` (declared, in `All`, granted) and
`DashboardEndpointServiceTests` (forwarded service types).

- [ ] **Step 5: Commit the server half**

```bash
git commit -m "filtre : la liste et le journal cote dashboard" -- Vortex.Primitives/Permissions/Capabilities.cs Vortex.Authentication/Permissions/DefaultRoles.cs Vortex.Primitives/Moderation/WordFilter/IWordFilterAdminService.cs Vortex.Dashboard.API Vortex.Dashboard.Tests
```

- [ ] **Step 6: The page**

Read two existing pages first — one with `Drawer` + `ConfirmReasonModal` (e.g. `HabbiconsPage.svelte`)
and one with a `PickerModal kind="user"` filter row (grep for `kind="user"`). `WordFilterPage.svelte`:

- Tabs **Mots** / **Journal** (whatever tab component those pages use).
- **Mots**: table of word / action / match / replacement (blank → the default, shown greyed as
  "bobba (défaut)") / author / date. `panel-head` has **Nouveau mot** → `drawer = { mode: 'create', form: empty() }`;
  a row action **Modifier** → `{ mode: 'edit', id, form: { ...row } }`; a row action **Supprimer** →
  `ConfirmReasonModal` → `…/words/remove`. The `<Drawer>` holds: word input; action select
  (Remplacer / Refuser); match select (Mot entier / Partiel); replacement input (disabled when action
  is Refuser); a **reason** field (required, sent with the save); a **test** textarea that POSTs to
  `/api/v1/wordfilter/test` on input (debounced 300 ms) and shows the result — refused (red),
  changed (the new text), or unchanged. Note under the test box: it tests the SAVED list, so a
  word being created is not in it yet. `{#snippet actions()}` holds Enregistrer / Annuler.
  Server errors `wordfilter_duplicate` / `wordfilter_invalid` show through the page's usual error
  display with a translated message.
- **Journal**: a filter row above the table — player via `<PickerModal kind="user">` (never a typed
  id), source select, a clear button; table rows show the avatar (`AssetImage`), player name,
  source, word, action badge, original text, date; pagination as the other paged pages do it.

Front-end wiring (all four, or the page is silently hidden — `check-dashboard-capabilities.mjs`
runs after each edit and says which is missing):
- `dashboardPermissions.js`: `CAPABILITIES` gets `'dashboard.ops.wordfilter.manage'`; `ROUTE_PERMISSIONS` maps `/wordfilter` to it.
- `routes.js`: `{ path: '/wordfilter', load: () => import('../pages/WordFilterPage.svelte'), … }` in the moderation group.
- `locales/en.js` and `fr.js`: identical structure — `nav.wordfilter` ("Word filter" / "Filtre de mots") and a `wordFilter` page block holding every label above.

- [ ] **Step 7: Verify the page**

Run: `cd Vortex.Dashboard.Web && npm run lint && npm run build` — PASS.
Run: `node scripts/hooks/check-dashboard-capabilities.mjs` — clean.
Then the `dashboard-render` skill (emulator repo) to look at the page once: add a word, test a
sentence in the drawer, delete it with a reason, open the journal.

- [ ] **Step 8: Commit the front end**

```bash
git commit -m "filtre : la page du dashboard" -- Vortex.Dashboard.Web/src
```

---

### Task 10: End-to-end check and the gate

- [ ] **Step 1: The gate**

Run: `dotnet build Vortex.Main/Vortex.Main.csproj -t:VortexCloudQualityGate`
Expected: PASS. (If `Vortex.Main` is running and the build hits file locks, the failures are not
about this code — see the emulator's "hook needs the server stopped" note; ask the user to stop the
server rather than stopping it.)

- [ ] **Step 2: Live check** (with the user's running hotel, after they restart it)

1. Dashboard → Filtre de mots → add `con` (Remplacer, Mot entier), reason "test".
2. In a room: say `t'es c.o.n !` → everyone sees `t'es bobba !`.
3. Add `nazi` (Refuser). Say `nazi` → nobody sees it; the speaker gets the bubble.
4. Private message `nazi` → error in the chat window + bubble.
5. Motto `nazi` → unchanged + bubble.
6. Web feed post `nazi` → toast; post `con` → published as `bobba`.
7. Journal tab → five rows, filterable by the player.

- [ ] **Step 3: Update the spec's status** to `implemented (batch 1)` and commit it (client repo).
