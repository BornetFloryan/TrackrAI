"""Build TrackrAI external training rows from the official UCI PAMAP2 archive.

The source archive is large (about 656 MB), so this script is intentionally not
run during Docker startup. Run it manually when refreshing the external dataset.
"""

import argparse
import io
import math
import os
import urllib.request
import zipfile

import numpy as np
import pandas as pd

PAMAP2_URL = "https://archive.ics.uci.edu/static/public/231/pamap2+physical+activity+monitoring.zip"
SOURCE_NAME = "UCI_PAMAP2_RAW"

ACTIVITIES = {
    1: "lying",
    2: "sitting",
    3: "standing",
    4: "walking",
    5: "running",
    6: "cycling",
    7: "nordic_walking",
    12: "ascending_stairs",
    13: "descending_stairs",
    16: "vacuum_cleaning",
    17: "ironing",
    18: "folding_laundry",
    19: "house_cleaning",
    20: "soccer",
    24: "rope_jumping",
}

LOCOMOTION_ACTIVITIES = {4, 5, 7, 12, 13, 20, 24}
LIGHT_STEP_ACTIVITIES = {16, 19}
OUTPUT_COLUMNS = [
    "source", "subject", "activity", "distanceKm", "durationMin", "hrAvg",
    "hrMax", "stress", "steps", "paceStepsPerMin", "distanceVsHistory",
    "stepsVsHistory", "stressVsHistory", "hrVsHistory", "historyCount",
    "daysSincePrevious", "nextHrAvg",
]


def clamp(value, lower=0, upper=100):
    return max(lower, min(upper, value))


def pct_delta(new, old, floor=1.0):
    denominator = max(abs(float(old)), floor)
    return (float(new) - float(old)) / denominator


def download_archive(destination):
    os.makedirs(os.path.dirname(destination) or ".", exist_ok=True)
    if os.path.exists(destination):
        return destination

    print(f"Downloading PAMAP2 from {PAMAP2_URL}")
    urllib.request.urlretrieve(PAMAP2_URL, destination)
    return destination


def resolve_dataset_archive(archive_path):
    with zipfile.ZipFile(archive_path) as archive:
        names = archive.namelist()
        if any("/Protocol/subject" in name and name.endswith(".dat") for name in names):
            return archive_path

        nested = next((name for name in names if name.lower().endswith("pamap2_dataset.zip")), None)
        if not nested:
            return archive_path

        nested_path = os.path.join(os.path.dirname(archive_path), "PAMAP2_Dataset.zip")
        if not os.path.exists(nested_path):
            print(f"Extracting nested archive {nested}")
            with archive.open(nested) as source, open(nested_path, "wb") as destination:
                shutil.copyfileobj(source, destination)
        return nested_path


def count_motion_peaks(acceleration):
    values = np.asarray(acceleration, dtype=float)
    values = values[np.isfinite(values)]
    if len(values) < 50:
        return 0

    centered = np.abs(values - np.median(values))
    threshold = max(np.percentile(centered, 75), np.std(centered) * 0.8)
    candidates = np.where(
        (centered[1:-1] > centered[:-2])
        & (centered[1:-1] >= centered[2:])
        & (centered[1:-1] > threshold)
    )[0] + 1

    # PAMAP2 IMUs are sampled at 100 Hz. Keep at most one peak every 0.3 s.
    kept = []
    for index in candidates:
        if not kept or index - kept[-1] >= 30:
            kept.append(index)
    return len(kept)


def stress_from_hr(hr_avg, hr_max):
    if not math.isfinite(hr_avg):
        return 50.0
    spread = max(0.0, hr_max - hr_avg) if math.isfinite(hr_max) else 0.0
    return clamp((hr_avg - 65.0) * 0.65 + spread * 0.25, 0, 100)


def aggregate_subject(raw, subject, window_seconds, max_windows):
    raw.columns = ["timestamp", "activity_id", "heart_rate", "acc_x", "acc_y", "acc_z"]
    raw = raw.replace([np.inf, -np.inf], np.nan)
    raw = raw[raw["activity_id"].isin(ACTIVITIES)].copy()
    if raw.empty:
        return []

    raw["heart_rate"] = raw["heart_rate"].interpolate(limit_direction="both")
    raw[["acc_x", "acc_y", "acc_z"]] = raw[["acc_x", "acc_y", "acc_z"]].interpolate(limit_direction="both")
    raw["acc_mag"] = np.sqrt(raw["acc_x"] ** 2 + raw["acc_y"] ** 2 + raw["acc_z"] ** 2)

    # Start a new sequence whenever the labeled activity changes.
    raw["sequence"] = (raw["activity_id"] != raw["activity_id"].shift()).cumsum()
    rows = []

    for (sequence_id, activity_id), sequence in raw.groupby(["sequence", "activity_id"], sort=False):
        sequence = sequence.sort_values("timestamp").copy()
        sequence["window"] = ((sequence["timestamp"] - sequence["timestamp"].iloc[0]) / window_seconds).astype(int)

        for _, window in sequence.groupby("window", sort=False):
            duration_seconds = float(window["timestamp"].max() - window["timestamp"].min())
            if duration_seconds < min(240, window_seconds * 0.8):
                continue

            hr = window["heart_rate"].dropna()
            if hr.empty:
                continue

            steps = count_motion_peaks(window["acc_mag"].to_numpy())
            if activity_id not in LOCOMOTION_ACTIVITIES and activity_id not in LIGHT_STEP_ACTIVITIES:
                steps = 0

            step_length_m = 0.75 if activity_id in LOCOMOTION_ACTIVITIES else 0.4
            distance_km = steps * step_length_m / 1000
            duration_min = duration_seconds / 60
            hr_avg = float(hr.mean())
            hr_max = float(hr.max())

            rows.append({
                "source": SOURCE_NAME,
                "subject": subject,
                "activity": ACTIVITIES[int(activity_id)],
                "sequence": int(sequence_id),
                "timestamp": float(window["timestamp"].min()),
                "distanceKm": distance_km,
                "durationMin": duration_min,
                "hrAvg": hr_avg,
                "hrMax": hr_max,
                "stress": stress_from_hr(hr_avg, hr_max),
                "steps": steps,
                "paceStepsPerMin": steps / max(duration_min, 1),
            })

            if max_windows and len(rows) >= max_windows:
                return rows

    return rows


def build_supervised_rows(windows):
    output = []
    history = []

    for index in range(len(windows) - 1):
        current = windows[index]
        following = windows[index + 1]
        if current["sequence"] != following["sequence"] or current["activity"] != following["activity"]:
            history.append(current)
            continue
        previous = history.copy()

        def history_average(key, fallback):
            return float(np.mean([item[key] for item in previous])) if previous else fallback

        row = dict(current)
        row["distanceVsHistory"] = pct_delta(
            current["distanceKm"], history_average("distanceKm", current["distanceKm"]), 0.1
        )
        row["stepsVsHistory"] = pct_delta(
            current["steps"], history_average("steps", current["steps"]), 50
        )
        row["stressVsHistory"] = current["stress"] - history_average("stress", current["stress"])
        row["hrVsHistory"] = current["hrAvg"] - history_average("hrAvg", current["hrAvg"])
        row["historyCount"] = len(previous)
        row["daysSincePrevious"] = 0
        row["nextHrAvg"] = following["hrAvg"]
        output.append({column: row.get(column) for column in OUTPUT_COLUMNS})
        history.append(current)

    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", default=os.path.join(os.path.dirname(__file__), "pamap2.zip"))
    parser.add_argument("--output", default=os.path.join(os.path.dirname(__file__), "external_training_data.csv"))
    parser.add_argument("--window-seconds", type=int, default=60)
    parser.add_argument("--max-windows-per-subject", type=int, default=500)
    args = parser.parse_args()

    archive_path = resolve_dataset_archive(download_archive(args.archive))
    all_rows = []

    with zipfile.ZipFile(archive_path) as archive:
        names = sorted(
            name for name in archive.namelist()
            if "/Protocol/subject" in name and name.endswith(".dat")
        )
        if not names:
            raise RuntimeError("No PAMAP2 protocol subject files found in archive")

        for name in names:
            subject = os.path.splitext(os.path.basename(name))[0]
            print(f"Processing {subject}")
            with archive.open(name) as stream:
                raw = pd.read_csv(
                    io.TextIOWrapper(stream, encoding="utf-8"),
                    sep=r"\s+",
                    header=None,
                    usecols=[0, 1, 2, 21, 22, 23],
                )
            windows = aggregate_subject(
                raw, subject, args.window_seconds, args.max_windows_per_subject
            )
            all_rows.extend(build_supervised_rows(windows))

    if not all_rows:
        raise RuntimeError("PAMAP2 preprocessing produced no supervised rows")

    output = pd.DataFrame(all_rows, columns=OUTPUT_COLUMNS)
    output.to_csv(args.output, index=False)
    print(f"Wrote {len(output)} supervised rows to {args.output}")


if __name__ == "__main__":
    main()
