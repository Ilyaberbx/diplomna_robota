<!-- Domain glossary. Read first for unfamiliar terms. Keep definitions tight (one sentence). Be opinionated about canonical terms. -->

# PetFinder — Online service for finding lost pets

A service where pet owners publish reports about pets they have lost and finders publish reports about pets they have found, so the two can be matched and reunited.

## Language

**Lost Report**:
A record published by an owner stating that a specific pet of theirs is missing, including last-seen location and time.
_Avoid_: "missing post", "lost ad"

**Found Report**:
A record published by a finder stating that an unidentified animal has been found or sighted under their care, including where and when it was found.
_Avoid_: "found ad", "rescue"

**Candidate**:
A Found Report (or Lost Report) the system surfaces as a possible same-animal match for a given report, ranked by species equality, geographic distance, and date-window overlap. A Candidate is a computed suggestion, not a stored record.
_Avoid_: "suggestion", "hit"

**Match**:
A stored, human-proposed link between exactly one Lost Report and one Found Report, with a lifecycle: `proposed` → `confirmed` | `rejected`. Only a human turns a Candidate into a Match.
_Avoid_: "hit", "result"

**Reunited**:
The terminal state of a Lost Report whose pet has been recovered; reached when a Match on it is `confirmed` and the Owner marks the report resolved.

**Owner**:
The user who lost a pet and authored the Lost Report.

**Finder**:
The user who found an animal and authored the Found Report.

**Reporter**:
Canonical umbrella term for the authoring user of any report (Owner or Finder) when authorship — not role — is what matters.

## Relationships

- A **Reporter** authors zero-or-more **Lost Report**s and zero-or-more **Found Report**s.
- A **Match** links exactly one **Lost Report** to exactly one **Found Report**.
- A **Lost Report** has zero-or-more **Match**es; a **Found Report** has zero-or-more **Match**es.

## Example dialogue

> **Dev:** "When a **Finder** files a **Found Report**, do we auto-create **Match**es?"
> **Domain expert:** "We surface candidate Lost Reports; a **Match** only exists once a human proposes it."

## Flagged ambiguities

- "Report" alone is ambiguous — always qualify as **Lost Report** or **Found Report**.
