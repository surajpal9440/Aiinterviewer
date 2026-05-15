"""
generate_dataset.py — Creates synthetic training data for cheating detection.

Simulates 1000 video call interview behavior samples:
  - 500 honest candidates (natural webcam behavior)
  - 150 reading from off-screen notes
  - 80 reading from phone (looking down)
  - 70 someone helping off-camera
  - 100 using another device/screen
  - 100 nervous but honest candidates

Features (all from webcam/video data):
  1. gaze_offset_avg      — Average gaze offset from center (0-0.5)
  2. gaze_offset_std      — Gaze position variation (0-0.2)
  3. gaze_away_pct        — % of time looking away from screen (0-100)
  4. face_absent_pct      — % of time no face detected (0-100)
  5. multi_face_count     — Number of times 2+ faces appeared (0-20)
  6. head_pose_variance   — How much head position changes (0-0.3)
  7. answer_delay_sec     — Seconds before starting to answer (0-60)
  8. eye_movement_speed   — Rate of gaze position change (0-0.2)

Label: 0 = Honest, 1 = Cheating
"""

import numpy as np
import pandas as pd
import os

# Set random seed for reproducibility
np.random.seed(42)

def generate_honest(n=500):
    """Generate data for honest candidates who look at camera naturally."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.02, 0.10, n),
        'gaze_offset_std':    np.random.uniform(0.02, 0.08, n),
        'gaze_away_pct':      np.random.uniform(0, 15, n),
        'face_absent_pct':    np.random.uniform(0, 5, n),
        'multi_face_count':   np.random.choice([0, 0, 0, 0, 0, 0, 0, 0, 0, 1], n),
        'head_pose_variance': np.random.uniform(0.01, 0.08, n),
        'answer_delay_sec':   np.random.uniform(1, 8, n),
        'eye_movement_speed': np.random.uniform(0.005, 0.04, n),
        'label':              np.zeros(n, dtype=int)
    })

def generate_nervous_honest(n=100):
    """Generate data for nervous but honest candidates (more eye movement)."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.05, 0.14, n),
        'gaze_offset_std':    np.random.uniform(0.04, 0.10, n),
        'gaze_away_pct':      np.random.uniform(8, 25, n),
        'face_absent_pct':    np.random.uniform(0, 8, n),
        'multi_face_count':   np.random.choice([0, 0, 0, 0, 0, 0, 1], n),
        'head_pose_variance': np.random.uniform(0.03, 0.12, n),
        'answer_delay_sec':   np.random.uniform(3, 15, n),
        'eye_movement_speed': np.random.uniform(0.02, 0.06, n),
        'label':              np.zeros(n, dtype=int)  # Still honest!
    })

def generate_reading_notes(n=150):
    """Generate data for candidates reading from off-screen notes."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.18, 0.40, n),
        'gaze_offset_std':    np.random.uniform(0.01, 0.04, n),  # Low variance = staring at one spot
        'gaze_away_pct':      np.random.uniform(40, 80, n),
        'face_absent_pct':    np.random.uniform(2, 15, n),
        'multi_face_count':   np.random.choice([0, 0, 0, 0, 1], n),
        'head_pose_variance': np.random.uniform(0.02, 0.06, n),
        'answer_delay_sec':   np.random.uniform(5, 25, n),
        'eye_movement_speed': np.random.uniform(0.06, 0.15, n),  # Read left-to-right
        'label':              np.ones(n, dtype=int)  # Cheating
    })

def generate_reading_phone(n=80):
    """Generate data for candidates reading from phone below screen."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.12, 0.30, n),
        'gaze_offset_std':    np.random.uniform(0.03, 0.08, n),
        'gaze_away_pct':      np.random.uniform(30, 65, n),
        'face_absent_pct':    np.random.uniform(15, 50, n),  # Face dips out of frame
        'multi_face_count':   np.random.choice([0, 0, 0, 0, 1], n),
        'head_pose_variance': np.random.uniform(0.08, 0.20, n),  # Head bobbing up/down
        'answer_delay_sec':   np.random.uniform(8, 30, n),
        'eye_movement_speed': np.random.uniform(0.04, 0.12, n),
        'label':              np.ones(n, dtype=int)  # Cheating
    })

def generate_someone_helping(n=70):
    """Generate data for candidates with someone helping off-camera."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.10, 0.25, n),
        'gaze_offset_std':    np.random.uniform(0.05, 0.12, n),
        'gaze_away_pct':      np.random.uniform(20, 50, n),
        'face_absent_pct':    np.random.uniform(5, 20, n),
        'multi_face_count':   np.random.randint(2, 12, n),  # Multiple faces!
        'head_pose_variance': np.random.uniform(0.05, 0.15, n),
        'answer_delay_sec':   np.random.uniform(5, 20, n),
        'eye_movement_speed': np.random.uniform(0.03, 0.08, n),
        'label':              np.ones(n, dtype=int)  # Cheating
    })

def generate_using_device(n=100):
    """Generate data for candidates reading from another screen/device."""
    return pd.DataFrame({
        'gaze_offset_avg':    np.random.uniform(0.15, 0.35, n),
        'gaze_offset_std':    np.random.uniform(0.02, 0.06, n),
        'gaze_away_pct':      np.random.uniform(35, 70, n),
        'face_absent_pct':    np.random.uniform(3, 12, n),
        'multi_face_count':   np.random.choice([0, 0, 0, 1], n),
        'head_pose_variance': np.random.uniform(0.03, 0.08, n),
        'answer_delay_sec':   np.random.uniform(3, 15, n),
        'eye_movement_speed': np.random.uniform(0.08, 0.18, n),  # Fast reading pattern
        'label':              np.ones(n, dtype=int)  # Cheating
    })


def main():
    print("=" * 50)
    print("  Generating Synthetic Dataset")
    print("=" * 50)

    # Generate all behavior types
    honest = generate_honest(500)
    nervous = generate_nervous_honest(100)
    reading_notes = generate_reading_notes(150)
    reading_phone = generate_reading_phone(80)
    someone_helping = generate_someone_helping(70)
    using_device = generate_using_device(100)

    # Combine all
    dataset = pd.concat([
        honest, nervous, reading_notes,
        reading_phone, someone_helping, using_device
    ], ignore_index=True)

    # Shuffle rows
    dataset = dataset.sample(frac=1, random_state=42).reset_index(drop=True)

    # Round to 4 decimal places
    float_cols = dataset.select_dtypes(include=[float]).columns
    dataset[float_cols] = dataset[float_cols].round(4)

    # Save to CSV
    output_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    dataset.to_csv(output_path, index=False)

    # Print summary
    print(f"\n✅ Dataset generated: {output_path}")
    print(f"   Total samples: {len(dataset)}")
    print(f"   Honest (label=0): {len(dataset[dataset['label'] == 0])}")
    print(f"   Cheating (label=1): {len(dataset[dataset['label'] == 1])}")
    print(f"\n📊 Dataset preview:")
    print(dataset.head(10).to_string())
    print(f"\n📈 Feature statistics:")
    print(dataset.describe().round(3).to_string())
    print("=" * 50)


if __name__ == '__main__':
    main()
