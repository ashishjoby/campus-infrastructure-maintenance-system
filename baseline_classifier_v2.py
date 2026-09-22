import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from department_mapping import get_department


# 1. Load dataset
df = pd.read_csv("data/campus_infrastructure_dataset_v2.csv")

print("Dataset loaded successfully!")
print("Total complaints:", len(df))


# 2. Separate input and output
X = df["complaint_text"]
y = df["category"]


# 3. Split dataset into training and testing data
X_train_raw, X_test_raw, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("\nTraining complaints:", len(X_train_raw))
print("Testing complaints:", len(X_test_raw))


# 4. Convert complaint text into numerical features
vectorizer = TfidfVectorizer()

X_train_tfidf = vectorizer.fit_transform(X_train_raw)
X_test_tfidf = vectorizer.transform(X_test_raw)


# 5. Train Logistic Regression model
model = LogisticRegression(max_iter=1000)

model.fit(X_train_tfidf, y_train)


# Save trained model and vectorizer
joblib.dump(model, "models/complaint_classifier.joblib")
joblib.dump(vectorizer, "models/tfidf_vectorizer.joblib")

print("\nModel and vectorizer saved successfully.")


# 6. Make predictions
y_pred = model.predict(X_test_tfidf)


# 7. Evaluate the model
accuracy = accuracy_score(y_test, y_pred)

print("\n==============================")
print("MODEL RESULTS")
print("==============================")

print("Accuracy:", round(accuracy, 4))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))


# 8. Show incorrect predictions
print("\nIncorrect Predictions:")
print("-" * 80)

for complaint, actual, predicted in zip(
    X_test_raw, y_test, y_pred
):
    if actual != predicted:
        print("Complaint:", complaint)
        print("Actual:", actual)
        print("Predicted:", predicted)
        print("-" * 80)


# 9. Confusion Matrix
# Uncomment the following section if you want to display the confusion matrix.

# cm = confusion_matrix(y_test, y_pred)

# plt.figure(figsize=(8, 6))

# sns.heatmap(
#     cm,
#     annot=True,
#     fmt="d",
#     xticklabels=model.classes_,
#     yticklabels=model.classes_
# )

# plt.xlabel("Predicted Category")
# plt.ylabel("Actual Category")
# plt.title("Confusion Matrix - Baseline Classifier")

# plt.tight_layout()
# plt.show()


# 10. Interactive Prediction
print("\n" + "=" * 30)
print("TEST A NEW COMPLAINT")
print("=" * 30)

new_complaint = input("Enter complaint: ")

new_complaint_tfidf = vectorizer.transform([new_complaint])

prediction = model.predict(new_complaint_tfidf)

predicted_category = prediction[0]
assigned_department = get_department(predicted_category)

print("\nPredicted Category:", predicted_category)
print("Assigned Department:", assigned_department)