import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC


# 1. Load dataset
df = pd.read_csv("data/campus_infrastructure_dataset_v3.csv")

print("Dataset loaded successfully!")
print("Total complaints:", len(df))


# 2. Separate input and output
X = df["complaint_text"]
y = df["category"]


# 3. Create TF-IDF vectorizer
vectorizer = TfidfVectorizer()

X_tfidf = vectorizer.fit_transform(X)


# 4. Train final Linear SVM classifier
model = LinearSVC()

model.fit(X_tfidf, y)


# 5. Save trained model
joblib.dump(model, "models/final_complaint_classifier.joblib")

# 6. Save TF-IDF vectorizer
joblib.dump(vectorizer, "models/final_tfidf_vectorizer.joblib")


# 7. Display training information
print("\nFinal model trained successfully!")
print("Model: Linear SVM")
print("Feature extraction: TF-IDF")
print("Training complaints:", len(X))
print("Number of categories:", len(model.classes_))
print("Categories:", list(model.classes_))

print("\nSaved files:")
print("- models/final_complaint_classifier.joblib")
print("- models/final_tfidf_vectorizer.joblib")