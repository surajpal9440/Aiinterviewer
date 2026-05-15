"""
train_model.py — Trains a Random Forest Classifier for cheating detection.

ML Pipeline:
  1. Load dataset.csv (1000 rows, 8 features, 1 label)
  2. Split into Train (80%) and Test (20%)
  3. Train Random Forest with 100 decision trees
  4. Evaluate: accuracy, precision, recall, F1-score, confusion matrix
  5. Show feature importance (which behavior matters most)
  6. Save trained model to model.pkl

Why Random Forest?
  - Works well with 1000 samples (neural nets need 100K+)
  - Gives probability (78% cheating risk), not just yes/no
  - Handles non-linear patterns (gaze 10% = fine, 40% = cheating)
  - Shows feature importance (explainable to evaluators)
  - Resistant to overfitting (100 trees vote together)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)
import joblib
import os


def main():
    print("=" * 60)
    print("  ML Model Training — Cheating Detection")
    print("=" * 60)

    # ──────────────────────────────────────
    # Step 1: Load Dataset
    # ──────────────────────────────────────
    data_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    data = pd.read_csv(data_path)

    print(f"\n📂 Dataset loaded: {data_path}")
    print(f"   Total samples: {len(data)}")
    print(f"   Honest (0): {len(data[data['label'] == 0])}")
    print(f"   Cheating (1): {len(data[data['label'] == 1])}")

    # ──────────────────────────────────────
    # Step 2: Split Features (X) and Label (y)
    # ──────────────────────────────────────
    feature_names = [col for col in data.columns if col != 'label']
    X = data[feature_names]
    y = data['label']

    print(f"\n📊 Features ({len(feature_names)}):")
    for i, name in enumerate(feature_names, 1):
        print(f"   {i}. {name}")

    # ──────────────────────────────────────
    # Step 3: Train/Test Split (80/20)
    # ──────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\n✂️  Train/Test Split:")
    print(f"   Training set: {len(X_train)} samples ({len(X_train)/len(data)*100:.0f}%)")
    print(f"   Testing set:  {len(X_test)} samples ({len(X_test)/len(data)*100:.0f}%)")

    # ──────────────────────────────────────
    # Step 4: Train Random Forest Model
    # ──────────────────────────────────────
    print(f"\n🌲 Training Random Forest Classifier...")
    print(f"   n_estimators = 100 (100 decision trees)")
    print(f"   random_state = 42 (reproducible results)")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1  # Use all CPU cores
    )

    model.fit(X_train, y_train)
    print("   ✅ Training complete!")

    # ──────────────────────────────────────
    # Step 5: Evaluate on Test Set
    # ──────────────────────────────────────
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]  # Cheating probability

    accuracy = accuracy_score(y_test, y_pred)
    auc_score = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=['Honest', 'Cheating'])

    print(f"\n{'=' * 60}")
    print(f"  📋 EVALUATION RESULTS (on {len(X_test)} unseen test samples)")
    print(f"{'=' * 60}")

    print(f"\n   ✅ Accuracy:  {accuracy:.1%}")
    print(f"   ✅ AUC Score: {auc_score:.3f}")

    print(f"\n   📊 Confusion Matrix:")
    print(f"                      Predicted")
    print(f"                   Honest  Cheating")
    print(f"   Actual Honest  [  {cm[0][0]:3d}     {cm[0][1]:3d}  ]")
    print(f"   Actual Cheating[  {cm[1][0]:3d}     {cm[1][1]:3d}  ]")

    print(f"\n   📋 Classification Report:")
    print(f"   {report}")

    # ──────────────────────────────────────
    # Step 6: Feature Importance
    # ──────────────────────────────────────
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    print(f"   🏆 Feature Importance (what the model learned):")
    max_imp = max(importances)
    for idx in sorted_idx:
        bar_len = int(importances[idx] / max_imp * 25)
        bar = "█" * bar_len
        print(f"     {feature_names[idx]:25s} {bar:25s} {importances[idx]:.1%}")

    # ──────────────────────────────────────
    # Step 7: Save Trained Model
    # ──────────────────────────────────────
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    joblib.dump(model, model_path)
    print(f"\n   💾 Model saved to: {model_path}")

    # Also save feature names for the API
    meta_path = os.path.join(os.path.dirname(__file__), 'model_meta.pkl')
    joblib.dump({'feature_names': feature_names}, meta_path)
    print(f"   💾 Feature metadata saved to: {meta_path}")

    print(f"\n{'=' * 60}")
    print(f"  ✅ TRAINING COMPLETE — Model ready for deployment!")
    print(f"{'=' * 60}")

    # ──────────────────────────────────────
    # Bonus: Test with sample predictions
    # ──────────────────────────────────────
    print(f"\n🧪 Sample Predictions:")

    # Honest candidate
    honest_sample = [[0.05, 0.04, 8.0, 2.0, 0, 0.04, 3.5, 0.02]]
    prob = model.predict_proba(honest_sample)[0][1] * 100
    print(f"   Honest candidate:      Risk = {prob:.1f}% {'✅' if prob < 50 else '🚨'}")

    # Reading notes
    cheating_sample = [[0.30, 0.02, 60.0, 8.0, 0, 0.04, 12.0, 0.10]]
    prob = model.predict_proba(cheating_sample)[0][1] * 100
    print(f"   Reading from notes:    Risk = {prob:.1f}% {'✅' if prob < 50 else '🚨'}")

    # Multiple faces
    multi_sample = [[0.15, 0.08, 35.0, 10.0, 5, 0.10, 8.0, 0.05]]
    prob = model.predict_proba(multi_sample)[0][1] * 100
    print(f"   Someone helping:       Risk = {prob:.1f}% {'✅' if prob < 50 else '🚨'}")

    # Nervous honest
    nervous_sample = [[0.10, 0.07, 18.0, 5.0, 0, 0.09, 10.0, 0.04]]
    prob = model.predict_proba(nervous_sample)[0][1] * 100
    print(f"   Nervous but honest:    Risk = {prob:.1f}% {'✅' if prob < 50 else '🚨'}")


if __name__ == '__main__':
    main()
