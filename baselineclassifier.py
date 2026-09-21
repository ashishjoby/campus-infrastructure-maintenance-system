import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report


# 1. Load dataset
df = pd.read_csv("data/campus_infrastructure_dataset_v1_150.csv")

print("Dataset loaded successfully!")
print("Total complaints:", len(df))


# 2. Separate input and output
X = df["complaint_text"]
y = df["category"]


# 3. Split dataset into training and testing data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


print("\nTraining complaints:", len(X_train))
print("Testing complaints:", len(X_test))


# 4. Convert complaint text into numerical features
vectorizer = TfidfVectorizer()

X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)


# 5. Train Logistic Regression model
model = LogisticRegression(max_iter=1000)

model.fit(X_train_tfidf, y_train)


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