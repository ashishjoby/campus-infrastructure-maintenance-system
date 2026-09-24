import joblib

from department_mapping import get_department


# Load final trained model and TF-IDF vectorizer
model = joblib.load("models/final_complaint_classifier.joblib")
vectorizer = joblib.load("models/final_tfidf_vectorizer.joblib")


# Get complaint from user
complaint = input("Enter complaint: ")


# Convert complaint into TF-IDF representation
complaint_tfidf = vectorizer.transform([complaint])


# Predict category
predicted_category = model.predict(complaint_tfidf)[0]


# Assign department
assigned_department = get_department(predicted_category)


print("\nPredicted Category:", predicted_category)
print("Assigned Department:", assigned_department)