"""
train_model.py — Professional ML Pipeline for Cheating Detection

Dataset: "Students suspicious behaviors detection dataset" (Mendeley)
DOI: 10.17632/39xs8th543.1 | 5,500 records | 38 attributes

Pipeline:
  1. Load & preprocess Mendeley dataset
  2. Feature selection & engineering (12 webcam-capturable features)
  3. Exploratory Data Analysis (saved as plots)
  4. Train/Test split (80/20, stratified)
  5. 5-Fold Cross-Validation
  6. Train 3 models: Random Forest, Gradient Boosting, Logistic Regression
  7. Select best model by AUC score
  8. Full evaluation: Accuracy, Precision, Recall, F1, Confusion Matrix, ROC
  9. Feature importance analysis
  10. Save trained model + metadata

Usage:
  python train_model.py
"""

import pandas as pd
import numpy as np
import os
import warnings
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_auc_score, roc_curve, precision_recall_fscore_support
)

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')
BASE_DIR = os.path.dirname(__file__)
PLOTS_DIR = os.path.join(BASE_DIR, 'plots')
DATASET_FILE = 'Students suspicious behaviors detection dataset_V1.csv'


# ══════════════════════════════════════════════════════════════
# STEP 1: Load & Preprocess
# ══════════════════════════════════════════════════════════════
def load_and_preprocess(path):
    print("\n📂 Step 1: Loading dataset...")
    df = pd.read_csv(path)
    print(f"   Raw shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"   Labels: {(df['label']==0).sum()} honest | {(df['label']==1).sum()} cheating")

    # Encode categorical: head_pose
    head_pose_map = {'forward': 0, 'left': 1, 'right': 2, 'up': 3, 'down': 4}
    df['head_pose_enc'] = df['head_pose'].map(head_pose_map).fillna(5).astype(int)

    # Encode categorical: gaze_direction
    gaze_dir_map = {
        'center': 0, 'left': 1, 'right': 2,
        'top_left': 3, 'top_right': 4,
        'bottom_left': 5, 'bottom_right': 6
    }
    df['gaze_dir_enc'] = df['gaze_direction'].map(gaze_dir_map).fillna(7).astype(int)

    # Engineer: normalized pupil distance
    px = df['pupil_right_x'] - df['pupil_left_x']
    py = df['pupil_right_y'] - df['pupil_left_y']
    raw_dist = np.sqrt(px**2 + py**2)
    fw = df['face_w'].replace(0, np.nan)
    df['pupil_dist_norm'] = (raw_dist / fw).fillna(0)

    # Engineer: face area ratio (normalized to 640×480 frame)
    df['face_area_ratio'] = (df['face_w'] * df['face_h']) / (640 * 480)

    return df


# ══════════════════════════════════════════════════════════════
# STEP 2: Feature Selection
# ══════════════════════════════════════════════════════════════
FEATURE_COLS = [
    'face_present',       # 1/0: is face visible
    'no_of_face',         # int: number of faces
    'face_conf',          # float: detection confidence
    'head_pitch',         # float: head up/down angle
    'head_yaw',           # float: head left/right angle
    'head_roll',          # float: head tilt angle
    'gaze_on_script',     # 1/0: is gaze on screen
    'head_pose_enc',      # encoded head direction
    'gaze_dir_enc',       # encoded gaze direction
    'pupil_dist_norm',    # normalized pupil distance
    'face_area_ratio',    # face area as fraction of frame
]

def select_features(df):
    print(f"\n📊 Step 2: Selecting {len(FEATURE_COLS)} features...")
    for i, col in enumerate(FEATURE_COLS, 1):
        print(f"   {i:2d}. {col}")
    X = df[FEATURE_COLS].copy()
    y = df['label'].copy()
    return X, y


# ══════════════════════════════════════════════════════════════
# STEP 3: EDA — Save plots
# ══════════════════════════════════════════════════════════════
def run_eda(X, y):
    print("\n📈 Step 3: Exploratory Data Analysis...")
    os.makedirs(PLOTS_DIR, exist_ok=True)

    # 3a. Class distribution
    fig, ax = plt.subplots(figsize=(6, 4))
    counts = y.value_counts()
    bars = ax.bar(['Honest (0)', 'Cheating (1)'], [counts[0], counts[1]],
                  color=['#2ecc71', '#e74c3c'], edgecolor='white', linewidth=1.5)
    for bar, val in zip(bars, [counts[0], counts[1]]):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 40,
                str(val), ha='center', fontweight='bold', fontsize=12)
    ax.set_title('Class Distribution', fontsize=14, fontweight='bold')
    ax.set_ylabel('Count')
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'class_distribution.png'), dpi=150)
    plt.close()
    print("   ✅ Saved class_distribution.png")

    # 3b. Correlation heatmap
    fig, ax = plt.subplots(figsize=(10, 8))
    combined = X.copy()
    combined['label'] = y
    corr = combined.corr()
    sns.heatmap(corr, annot=True, fmt='.2f', cmap='RdBu_r', center=0,
                square=True, linewidths=0.5, ax=ax,
                annot_kws={'size': 8})
    ax.set_title('Feature Correlation Matrix', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'correlation_matrix.png'), dpi=150)
    plt.close()
    print("   ✅ Saved correlation_matrix.png")

    # 3c. Feature distributions by class
    fig, axes = plt.subplots(3, 4, figsize=(16, 10))
    axes = axes.flatten()
    for i, col in enumerate(FEATURE_COLS):
        if i >= len(axes):
            break
        ax = axes[i]
        X[y == 0][col].hist(ax=ax, bins=30, alpha=0.6, color='#2ecc71', label='Honest', density=True)
        X[y == 1][col].hist(ax=ax, bins=30, alpha=0.6, color='#e74c3c', label='Cheating', density=True)
        ax.set_title(col, fontsize=9, fontweight='bold')
        ax.tick_params(labelsize=7)
    for j in range(i + 1, len(axes)):
        axes[j].set_visible(False)
    axes[0].legend(fontsize=8)
    fig.suptitle('Feature Distributions by Class', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'feature_distributions.png'), dpi=150)
    plt.close()
    print("   ✅ Saved feature_distributions.png")


# ══════════════════════════════════════════════════════════════
# STEP 4-8: Train/Val/Test Split, Cross-Validate, Evaluate
# ══════════════════════════════════════════════════════════════
def train_and_evaluate(X, y):
    # ── Step 4: 3-Way Split (70% Train / 15% Validation / 15% Test) ──
    print("\n✂️  Step 4: Train/Validation/Test Split (70/15/15, stratified)...")

    # First split: 70% train, 30% temp
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )
    # Second split: split the 30% temp into 50/50 → 15% val, 15% test
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp
    )

    print(f"   Training set:   {len(X_train)} samples (70%)")
    print(f"   Validation set: {len(X_val)} samples (15%)")
    print(f"   Test set:       {len(X_test)} samples (15%)")
    print(f"   Total:          {len(X_train) + len(X_val) + len(X_test)} samples")

    # Scale features for Logistic Regression
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # ── Step 5: Define models ──
    models = {
        'Random Forest': RandomForestClassifier(
            n_estimators=100, max_depth=12, min_samples_split=5,
            min_samples_leaf=2, random_state=42, n_jobs=-1
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.1,
            min_samples_split=5, random_state=42
        ),
        'Logistic Regression': LogisticRegression(
            max_iter=1000, random_state=42
        )
    }

    # ── Step 6: 5-Fold Cross-Validation on Training Set ──
    print("\n🔄 Step 5-6: 5-Fold Cross-Validation (on training set only)...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in models.items():
        data = X_train_scaled if name == 'Logistic Regression' else X_train
        scores = cross_val_score(model, data, y_train, cv=cv, scoring='roc_auc', n_jobs=-1)
        print(f"   {name:25s} → AUC: {scores.mean():.4f} +/- {scores.std():.4f}")

    # ── Step 7: Train & Evaluate on Validation Set (model selection) ──
    print("\n📊 Step 7: Evaluating on VALIDATION set (model selection)...")
    best_name, best_auc, best_model = None, 0, None
    val_results = {}

    for name, model in models.items():
        train_data = X_train_scaled if name == 'Logistic Regression' else X_train
        val_data = X_val_scaled if name == 'Logistic Regression' else X_val

        model.fit(train_data, y_train)
        y_pred = model.predict(val_data)
        y_prob = model.predict_proba(val_data)[:, 1]

        acc = accuracy_score(y_val, y_pred)
        auc = roc_auc_score(y_val, y_prob)
        p, r, f1, _ = precision_recall_fscore_support(y_val, y_pred, average='binary')

        val_results[name] = {
            'accuracy': acc, 'auc': auc,
            'precision': p, 'recall': r, 'f1': f1,
        }

        print(f"   {name:25s} → Acc: {acc:.4f} | AUC: {auc:.4f} | F1: {f1:.4f}")
        if auc > best_auc:
            best_auc = auc
            best_name = name
            best_model = model

    print(f"\n   🥇 Best Model (by validation AUC): {best_name} (AUC = {best_auc:.4f})")

    # ── Step 8: Final Evaluation on TEST Set (unseen data) ──
    print(f"\n{'='*60}")
    print(f"  📋 FINAL EVALUATION ON TEST SET — {best_name}")
    print(f"  (Test set was NEVER used during training or model selection)")
    print(f"{'='*60}")

    test_data = X_test_scaled if best_name == 'Logistic Regression' else X_test
    y_pred = best_model.predict(test_data)
    y_prob = best_model.predict_proba(test_data)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')

    print(f"\n   Accuracy:  {acc:.4f} ({acc*100:.1f}%)")
    print(f"   AUC Score: {auc:.4f}")
    print(f"   Precision: {p:.4f}")
    print(f"   Recall:    {r:.4f}")
    print(f"   F1 Score:  {f1:.4f}")

    cm = confusion_matrix(y_test, y_pred)
    print(f"\n   Confusion Matrix:")
    print(f"                    Predicted")
    print(f"                  Honest  Cheating")
    print(f"   Actual Honest [  {cm[0][0]:4d}    {cm[0][1]:4d}  ]")
    print(f"   Actual Cheat  [  {cm[1][0]:4d}    {cm[1][1]:4d}  ]")

    report = classification_report(y_test, y_pred,
                                    target_names=['Honest', 'Cheating'])
    print(f"\n   Classification Report:\n{report}")

    # Build test_results dict for plotting
    test_results = {}
    for name, model in models.items():
        td = X_test_scaled if name == 'Logistic Regression' else X_test
        yp = model.predict(td)
        ypr = model.predict_proba(td)[:, 1]
        a = accuracy_score(y_test, yp)
        au = roc_auc_score(y_test, ypr)
        pr, rc, f, _ = precision_recall_fscore_support(y_test, yp, average='binary')
        test_results[name] = {
            'accuracy': a, 'auc': au, 'precision': pr, 'recall': rc, 'f1': f,
            'y_pred': yp, 'y_prob': ypr
        }

    # ── Save evaluation plots ──
    save_evaluation_plots(y_test, test_results, best_name, best_model, X_train, FEATURE_COLS)

    return best_model, best_name, scaler


# ══════════════════════════════════════════════════════════════
# STEP 8-9: Save Plots
# ══════════════════════════════════════════════════════════════
def save_evaluation_plots(y_test, results, best_name, best_model, X_train, feature_names):
    os.makedirs(PLOTS_DIR, exist_ok=True)

    # 8a. Confusion Matrix
    cm = confusion_matrix(y_test, results[best_name]['y_pred'])
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Honest', 'Cheating'],
                yticklabels=['Honest', 'Cheating'], ax=ax,
                annot_kws={'size': 16})
    ax.set_ylabel('Actual', fontsize=12)
    ax.set_xlabel('Predicted', fontsize=12)
    ax.set_title(f'Confusion Matrix — {best_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'confusion_matrix.png'), dpi=150)
    plt.close()
    print("   ✅ Saved confusion_matrix.png")

    # 8b. ROC Curves for all models
    fig, ax = plt.subplots(figsize=(7, 6))
    colors = {'Random Forest': '#2ecc71', 'Gradient Boosting': '#3498db',
              'Logistic Regression': '#e67e22'}
    for name, res in results.items():
        fpr, tpr, _ = roc_curve(y_test, res['y_prob'])
        ax.plot(fpr, tpr, color=colors.get(name, '#333'),
                label=f"{name} (AUC={res['auc']:.3f})", linewidth=2)
    ax.plot([0, 1], [0, 1], 'k--', alpha=0.4, label='Random (AUC=0.500)')
    ax.set_xlabel('False Positive Rate', fontsize=12)
    ax.set_ylabel('True Positive Rate', fontsize=12)
    ax.set_title('ROC Curves — Model Comparison', fontsize=13, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'roc_curves.png'), dpi=150)
    plt.close()
    print("   ✅ Saved roc_curves.png")

    # 8c. Feature Importance (for tree-based models)
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        sorted_idx = np.argsort(importances)
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.barh(range(len(sorted_idx)), importances[sorted_idx],
                color='#3498db', edgecolor='white')
        ax.set_yticks(range(len(sorted_idx)))
        ax.set_yticklabels([feature_names[i] for i in sorted_idx], fontsize=10)
        ax.set_xlabel('Importance', fontsize=12)
        ax.set_title(f'Feature Importance — {best_name}', fontsize=13, fontweight='bold')
        plt.tight_layout()
        plt.savefig(os.path.join(PLOTS_DIR, 'feature_importance.png'), dpi=150)
        plt.close()
        print("   ✅ Saved feature_importance.png")

    # 8d. Model comparison bar chart
    fig, ax = plt.subplots(figsize=(8, 5))
    names = list(results.keys())
    metrics = ['accuracy', 'auc', 'precision', 'recall', 'f1']
    x = np.arange(len(names))
    width = 0.15
    for i, m in enumerate(metrics):
        vals = [results[n][m] for n in names]
        ax.bar(x + i * width, vals, width, label=m.upper())
    ax.set_xticks(x + width * 2)
    ax.set_xticklabels(names, fontsize=10)
    ax.set_ylim(0.5, 1.05)
    ax.set_ylabel('Score')
    ax.set_title('Model Comparison', fontsize=13, fontweight='bold')
    ax.legend(fontsize=9)
    ax.grid(True, axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(PLOTS_DIR, 'model_comparison.png'), dpi=150)
    plt.close()
    print("   ✅ Saved model_comparison.png")


# ══════════════════════════════════════════════════════════════
# STEP 10: Save Model
# ══════════════════════════════════════════════════════════════
def save_model(model, model_name, scaler):
    model_path = os.path.join(BASE_DIR, 'model.pkl')
    meta_path = os.path.join(BASE_DIR, 'model_meta.pkl')

    joblib.dump(model, model_path)
    joblib.dump({
        'feature_names': FEATURE_COLS,
        'model_name': model_name,
        'scaler': scaler
    }, meta_path)

    print(f"\n   💾 Model saved: {model_path}")
    print(f"   💾 Metadata saved: {meta_path}")


# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
def main():
    print("=" * 60)
    print("  🤖 ML Training Pipeline — Cheating Detection")
    print("  Dataset: Mendeley DOI 10.17632/39xs8th543.1")
    print("=" * 60)

    data_path = os.path.join(BASE_DIR, DATASET_FILE)
    if not os.path.exists(data_path):
        print(f"\n❌ Dataset not found: {data_path}")
        print("   Download from: https://data.mendeley.com/datasets/39xs8th543/1")
        return

    df = load_and_preprocess(data_path)
    X, y = select_features(df)
    run_eda(X, y)
    best_model, best_name, scaler = train_and_evaluate(X, y)
    save_model(best_model, best_name, scaler)

    print(f"\n{'='*60}")
    print(f"  ✅ TRAINING COMPLETE")
    print(f"  Best model: {best_name}")
    print(f"  Plots saved to: {PLOTS_DIR}/")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
