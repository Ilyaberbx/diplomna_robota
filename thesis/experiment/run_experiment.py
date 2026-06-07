#!/usr/bin/env python3
"""Experimental evaluation of the lost/found report matching algorithm.

Reproduces the production ranking rule (thesis chapter 4, formulas (4.1)-(4.4)):
candidates of the opposite report type are ordered lexicographically by
  1) species match (same species first),
  2) great-circle distance (haversine), ascending,
  3) absolute event-date difference, ascending.

The dataset is synthetic but has known ground-truth pairs, so ranking quality
(Hit@K, MRR) is computed honestly, not asserted. Fully deterministic
(seeded), no third-party dependencies. Run:  python3 run_experiment.py
"""
import math
import random
import time

R_KM = 6371.0  # mean Earth radius, formula (4.2)

# A few real city centres inside Ukraine to create geographic clustering.
CITIES = [
    (50.4501, 30.5234),  # Kyiv
    (46.4825, 30.7233),  # Odesa
    (49.8397, 24.0297),  # Lviv
    (49.9935, 36.2304),  # Kharkiv
    (48.4647, 35.0462),  # Dnipro
    (47.8388, 35.1396),  # Zaporizhzhia
    (49.2331, 28.4682),  # Vinnytsia
    (48.9226, 24.7111),  # Ivano-Frankivsk
    (50.9077, 34.7981),  # Sumy
    (46.9750, 31.9946),  # Mykolaiv
]
SPECIES = ["dog", "cat", "bird", "other"]
SPECIES_W = [0.45, 0.40, 0.10, 0.05]


def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance, formulas (4.1)-(4.2)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2)
         * math.sin(math.radians(lng2 - lng1) / 2) ** 2)
    return 2 * R_KM * math.asin(min(1.0, math.sqrt(a)))


def days_apart(t1, t2):
    """Absolute event-date difference in days, formula (4.3)."""
    return abs(t2 - t1) / 86400.0


def rank_key(query, cand):
    """Lexicographic ordering key, formula (4.4). Lower sorts first."""
    species_match = 0 if cand["species"] == query["species"] else 1
    d = haversine_km(query["lat"], query["lng"], cand["lat"], cand["lng"])
    t = days_apart(query["event_ts"], cand["event_ts"])
    return (species_match, d, t)


def make_report(rng, kind, lat, lng, species, event_ts, true_id=None):
    return {"kind": kind, "lat": lat, "lng": lng, "species": species,
            "event_ts": event_ts, "true_id": true_id}


def build_dataset(rng, n_pairs, n_distractor_found):
    """n_pairs lost queries each with one true found match, plus distractors."""
    base = 1_714_500_000  # arbitrary fixed epoch (~2024-05), seconds
    lost, found = [], []
    for i in range(n_pairs):
        clat, clng = rng.choice(CITIES)
        sp = rng.choices(SPECIES, SPECIES_W)[0]
        # lost report somewhere in the city
        llat = clat + rng.uniform(-0.05, 0.05)
        llng = clng + rng.uniform(-0.05, 0.05)
        lts = base + rng.randint(0, 30) * 86400
        # true found match: very close in space and time (same animal)
        flat = llat + rng.uniform(-0.015, 0.015)   # within ~1-2 km
        flng = llng + rng.uniform(-0.015, 0.015)
        fts = lts + rng.randint(0, 2) * 86400
        lost.append(make_report(rng, "lost", llat, llng, sp, lts, true_id=i))
        found.append(make_report(rng, "found", flat, flng, sp, fts, true_id=i))
    # distractor found reports: same-city, mixed species and dates -> competitors
    for _ in range(n_distractor_found):
        clat, clng = rng.choice(CITIES)
        sp = rng.choices(SPECIES, SPECIES_W)[0]
        flat = clat + rng.uniform(-0.06, 0.06)
        flng = clng + rng.uniform(-0.06, 0.06)
        fts = base + rng.randint(0, 32) * 86400
        found.append(make_report(rng, "found", flat, flng, sp, fts))
    return lost, found


def evaluate(lost, found):
    """For each lost query, rank all found reports and locate the true match."""
    ranks = []
    for q in lost:
        ordered = sorted(found, key=lambda c: rank_key(q, c))
        for pos, cand in enumerate(ordered, start=1):
            if cand["true_id"] == q["true_id"]:
                ranks.append(pos)
                break
    return ranks


def median(xs):
    s = sorted(xs)
    m = len(s) // 2
    return s[m] if len(s) % 2 else (s[m - 1] + s[m]) / 2


def time_candidate_query(rng, n):
    """Time building one ranked candidate list over n found reports."""
    base = 1_714_500_000
    found = []
    for _ in range(n):
        clat, clng = rng.choice(CITIES)
        found.append(make_report(
            rng, "found",
            clat + rng.uniform(-0.06, 0.06), clng + rng.uniform(-0.06, 0.06),
            rng.choices(SPECIES, SPECIES_W)[0], base + rng.randint(0, 32) * 86400))
    q = make_report(rng, "lost", 50.45, 30.52, "dog", base)
    samples = []
    for _ in range(5):
        t0 = time.perf_counter()
        sorted(found, key=lambda c: rank_key(q, c))
        samples.append((time.perf_counter() - t0) * 1000.0)  # ms
    return median(samples)


def main():
    rng = random.Random(42)
    n_pairs, n_distractor = 60, 140
    lost, found = build_dataset(rng, n_pairs, n_distractor)
    ranks = evaluate(lost, found)

    n = len(ranks)
    hit1 = sum(r <= 1 for r in ranks) / n
    hit3 = sum(r <= 3 for r in ranks) / n
    hit5 = sum(r <= 5 for r in ranks) / n
    mrr = sum(1.0 / r for r in ranks) / n

    print("=== Dataset ===")
    print(f"true pairs (queries): {n_pairs}")
    print(f"found reports total : {len(found)} "
          f"({n_pairs} true + {n_distractor} distractors)")
    print()
    print("=== Ranking quality (true match among candidates) ===")
    print(f"Hit@1 : {hit1:.3f}")
    print(f"Hit@3 : {hit3:.3f}")
    print(f"Hit@5 : {hit5:.3f}")
    print(f"MRR   : {mrr:.3f}")
    print(f"median rank (ranked)        : {median(ranks):.1f}")
    print()
    print("=== Baseline: chronological browsing (no ranking) ===")
    # newest-first scan: expected position of the true match is uniform over
    # the found list -> median position ~ M/2.
    base_median = (len(found) + 1) / 2
    print(f"found list length M         : {len(found)}")
    print(f"median position (baseline)  : {base_median:.1f}")
    print(f"effort reduction factor     : {base_median / median(ranks):.0f}x")
    print()
    print("=== Time to build ranked candidate list (reference impl, ms) ===")
    for size in (1000, 10000, 50000):
        ms = time_candidate_query(random.Random(7), size)
        print(f"n = {size:>6}: {ms:.1f} ms")


if __name__ == "__main__":
    main()
