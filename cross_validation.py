import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline


# 1. Load dataset
df = pd.read_csv("data/campus_infrastructure_dataset_v3.csv")

print("Dataset loaded successfully!")
print("Total complaints:", len(df))


# 2. Separate input and output
X = df["complaint_text"]
y = df["category"]


# 3. Define 5-fold stratified cross-validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


# 4. Logistic Regression pipeline
logistic_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", LogisticRegression(max_iter=1000))
])


# 5. Linear SVM pipeline
svm_pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", LinearSVC())
])


# 6. Evaluate Logistic Regression
logistic_scores = cross_val_score(
    logistic_pipeline,
    X,
    y,
    cv=cv,
    scoring="accuracy"
)


# 7. Evaluate Linear SVM
svm_scores = cross_val_score(
    svm_pipeline,
    X,
    y,
    cv=cv,
    scoring="accuracy"
)


# 8. Display results
print("\n==============================")
print("5-FOLD CROSS-VALIDATION")
print("==============================")

print("\nLogistic Regression")
print("Fold accuracies:", logistic_scores)
print("Mean accuracy:", round(logistic_scores.mean(), 4))
print("Standard deviation:", round(logistic_scores.std(), 4))

print("\nLinear SVM")
print("Fold accuracies:", svm_scores)
print("Mean accuracy:", round(svm_scores.mean(), 4))
print("Standard deviation:", round(svm_scores.std(), 4))