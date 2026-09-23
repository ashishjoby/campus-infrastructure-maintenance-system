import sys
import json
import joblib

from department_mapping import get_department


# Load trained model and TF-IDF vectorizer
model = joblib.load("models/final_complaint_classifier.joblib")
vectorizer = joblib.load("models/final_tfidf_vectorizer.joblib")


def main():
    complaint = sys.stdin.read().strip()

    if not complaint:
        print(json.dumps({
            "error": "Complaint text is required"
        }))
        return

    # Convert complaint into TF-IDF features
    complaint_tfidf = vectorizer.transform([complaint])

    # Predict category
    predicted_category = model.predict(complaint_tfidf)[0]

    # Assign department
    assigned_department = get_department(predicted_category)

    result = {
        "complaint": complaint,
        "category": predicted_category,
        "department": assigned_department
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()