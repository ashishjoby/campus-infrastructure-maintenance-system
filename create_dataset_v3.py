import pandas as pd


# Load the original v1 dataset
input_file = "data/campus_infrastructure_dataset_v2.csv"
output_file = "data/campus_infrastructure_dataset_v3.csv"

df = pd.read_csv(input_file)


# Additional training examples
new_data = [
    
    # Electrical
    ["The electrical socket is damaged in the classroom", "Electrical", "Room 101", "synthetic"],
    ["The light switch is not working in the laboratory", "Electrical", "Laboratory", "synthetic"],
    ["A loose power wire is visible near the classroom", "Electrical", "Room 202", "synthetic"],
    ["The ceiling fan is not receiving electrical power", "Electrical", "Room 305", "synthetic"],
    ["There is a short circuit in the office power socket", "Electrical", "Office Block", "synthetic"],

    # Networking
    ["The Wi-Fi signal is unavailable in the classroom", "Networking", "Room 101", "synthetic"],
    ["Students cannot connect to the campus internet", "Networking", "Academic Block", "synthetic"],
    ["The LAN connection is not working in the computer lab", "Networking", "Computer Lab", "synthetic"],
    ["The network router is not functioning properly", "Networking", "Server Room", "synthetic"],
    ["The internet connection keeps disconnecting in the office", "Networking", "Office Block", "synthetic"],

    # Civil
    ["The classroom roof has a large crack", "Civil", "Room 301", "synthetic"],
    ["Floor tiles are broken near the staircase", "Civil", "Main Block", "synthetic"],
    ["The corridor wall has developed a structural crack", "Civil", "Academic Block", "synthetic"],

    # Plumbing
    ["Water is leaking from a damaged pipe", "Plumbing", "Main Block", "synthetic"],
    ["The bathroom tap is continuously leaking water", "Plumbing", "Washroom", "synthetic"],
    ["The toilet flush is not supplying water properly", "Plumbing", "Hostel Washroom", "synthetic"],

    # Sanitation
    ["Garbage has not been removed from the classroom area", "Sanitation", "Academic Block", "synthetic"],
    ["The waste bin is overflowing near the hostel", "Sanitation", "Hostel Block", "synthetic"],

]


# Create DataFrame for new examples
new_df = pd.DataFrame(
    new_data,
    columns=["complaint_text", "category", "location", "source"]
)


# Add IDs to the new records
start_id = df["id"].max() + 1

new_df.insert(
    0,
    "id",
    range(start_id, start_id + len(new_df))
)


# Combine v1 and new examples
df_v2 = pd.concat(
    [df, new_df],
    ignore_index=True
)


# Save Dataset v2
df_v2.to_csv(output_file, index=False)


print("Dataset v3 created successfully!")
print("Original complaints:", len(df))
print("New complaints:", len(new_df))
print("Total complaints in v3:", len(df_v2))

print("\nCategory distribution:")
print(df_v2["category"].value_counts())

print("\nSaved to:", output_file)