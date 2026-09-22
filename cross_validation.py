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


# 6. Evaluation function
def evaluate_model(model, model_name):

    accuracy = cross_val_score(
        model,
        X,
        y,
        cv=cv,
        scoring="accuracy"
    )

    macro_f1 = cross_val_score(
        model,
        X,
        y,
        cv=cv,
        scoring="f1_macro"
    )

    weighted_f1 = cross_val_score(
        model,
        X,
        y,
        cv=cv,
        scoring="f1_weighted"
    )

    print(f"\n{model_name}")
    print("-" * 30)

    print("Accuracy:")
    print("  Fold scores:", accuracy)
    print("  Mean:", round(accuracy.mean(), 4))
    print("  Std:", round(accuracy.std(), 4))

    print("Macro F1:")
    print("  Fold scores:", macro_f1)
    print("  Mean:", round(macro_f1.mean(), 4))
    print("  Std:", round(macro_f1.std(), 4))

    print("Weighted F1:")
    print("  Fold scores:", weighted_f1)
    print("  Mean:", round(weighted_f1.mean(), 4))
    print("  Std:", round(weighted_f1.std(), 4))


# 7. Evaluate both models
print("\n==============================")
print("5-FOLD CROSS-VALIDATION")
print("==============================")

evaluate_model(logistic_pipeline, "Logistic Regression")
evaluate_model(svm_pipeline, "Linear SVM")