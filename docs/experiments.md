# Machine Learning Experiments

This document records the experiments conducted for the campus infrastructure complaint classification component.

The current datasets are synthetic and are used for development and evaluation of the prototype.

---

## Experiment 1 — Baseline Classifier

### Objective

Establish a baseline for automatic classification of campus infrastructure complaints.

### Configuration

- Dataset: `campus_infrastructure_dataset_v1_150.csv`
- Total complaints: 150
- Train/test split: 80/20
- Random state: 42
- Feature extraction: TF-IDF
- Classifier: Logistic Regression
- Number of categories: 6

### Results

- Training complaints: 120
- Testing complaints: 30
- Accuracy: **76.67%**
- Correct predictions: 23/30

### Observation

The baseline model was able to classify most complaints correctly, but several errors occurred between semantically related infrastructure categories.

Notable confusion patterns included Electrical/Networking, Civil/Plumbing, and Sanitation/Plumbing.

---

## Experiment 2 — Expanded Dataset

### Objective

Evaluate whether increasing the number of training examples improves complaint classification performance.

### Configuration

- Dataset: `campus_infrastructure_dataset_v2.csv`
- Total complaints: 180
- Train/test split: 80/20
- Random state: 42
- Feature extraction: TF-IDF
- Classifier: Logistic Regression

### Results

- Training complaints: 144
- Testing complaints: 36
- Accuracy: **86.11%**
- Correct predictions: 31/36

### Observation

The expanded dataset produced higher accuracy than the initial baseline.

The same model and evaluation configuration were retained, so the experiment primarily evaluated the effect of increasing the dataset size.

The main remaining errors involved lexical overlap between categories, particularly Electrical/Networking and Plumbing/Civil.

---

## Experiment 3 — Targeted Dataset Refinement

### Objective

Improve classification of categories that showed repeated confusion during error analysis.

### Configuration

- Dataset: `campus_infrastructure_dataset_v3.csv`
- Total complaints: 198
- Train/test split: 80/20
- Random state: 42
- Feature extraction: TF-IDF
- Classifier: Logistic Regression

Additional synthetic examples were specifically introduced for ambiguous category boundaries such as:

- Electrical vs Networking
- Civil vs Plumbing
- Sanitation vs Plumbing

### Results

- Training complaints: 158
- Testing complaints: 40
- Accuracy: **87.50%**
- Macro F1-score: **0.88**
- Correct predictions: 35/40

### Observation

The targeted dataset refinement produced a further improvement in classification accuracy.

The confusion matrix showed that Furniture and Networking were classified correctly for all test examples in this split.

Remaining errors included cases involving tube lights, damaged wires, leaking roofs, cracked staircase steps, and sanitation complaints involving washrooms.

---

## Experiment 4 — Linear SVM Comparison

### Objective

Compare Linear SVM with Logistic Regression using the same v3 dataset and train/test configuration.

### Configuration

- Dataset: `campus_infrastructure_dataset_v3.csv`
- Total complaints: 198
- Train/test split: 80/20
- Random state: 42
- Feature extraction: TF-IDF
- Classifier: Linear SVM

### Results

- Training complaints: 158
- Testing complaints: 40
- Accuracy: **87.50%**
- Macro F1-score: **0.88**

### Observation

The Linear SVM produced the same accuracy and macro F1-score as Logistic Regression on this particular 80/20 test split.

The same five test complaints were misclassified.

This indicates that the single train/test split did not reveal a measurable performance difference between the two classifiers.

---

## Experiment 5 — 5-Fold Cross-Validation

### Objective

Evaluate the stability of Logistic Regression and Linear SVM using stratified 5-fold cross-validation on the v3 dataset.

### Configuration

- Dataset: `campus_infrastructure_dataset_v3.csv`
- Total complaints: 198
- Feature extraction: TF-IDF
- Cross-validation: Stratified 5-Fold
- Shuffle: True
- Random state: 42
- Evaluation metric: Accuracy

### Results

| Model | Mean Accuracy | Standard Deviation |
|---|---:|---:|
| Logistic Regression | 88.86% | 0.0575 |
| Linear SVM | 93.90% | 0.0387 |

### Observation

The single 80/20 train-test experiment produced the same accuracy for Logistic Regression and Linear SVM (87.50%).

However, 5-fold cross-validation produced different mean accuracies.

Linear SVM achieved a mean accuracy of 93.90%, while Logistic Regression achieved 88.86%.

Linear SVM also showed lower variation across folds in this experiment.

### Conclusion

On the current synthetic dataset, Linear SVM showed higher mean cross-validation accuracy than Logistic Regression.

Further evaluation using real anonymized campus complaints is required before making conclusions about real-world performance.

---

## Overall Experiment Summary

| Experiment | Dataset | Model | Evaluation | Accuracy |
|---|---|---|---|---:|
| 1 | v1 — 150 | Logistic Regression | 80/20 split | 76.67% |
| 2 | v2 — 180 | Logistic Regression | 80/20 split | 86.11% |
| 3 | v3 — 198 | Logistic Regression | 80/20 split | 87.50% |
| 4 | v3 — 198 | Linear SVM | 80/20 split | 87.50% |
| 5 | v3 — 198 | Logistic Regression | 5-fold CV | 88.86% |
| 5 | v3 — 198 | Linear SVM | 5-fold CV | 93.90% |

### Current Findings

The experiments show that dataset refinement and model evaluation methodology affect the measured classification performance.

The v3 dataset and 5-fold cross-validation provide the current basis for further model evaluation. Because the current dataset is synthetic, real anonymized campus complaints will be important for future validation.