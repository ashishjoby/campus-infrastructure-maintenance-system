import pandas as pd


# Load the original v1 dataset
input_file = "data/campus_infrastructure_dataset_v1_150.csv"
output_file = "data/campus_infrastructure_dataset_v2.csv"

df = pd.read_csv(input_file)


# Additional training examples
new_data = [
    # Furniture
    ["A desk drawer is stuck and cannot be opened", "Furniture", "Library", "synthetic"],
    ["The classroom chair is broken and needs repair", "Furniture", "Room 201", "synthetic"],
    ["A wooden table leg is damaged", "Furniture", "Seminar Hall", "synthetic"],
    ["The cupboard door is not closing properly", "Furniture", "Office Block", "synthetic"],
    ["Several desks have damaged drawers", "Furniture", "Computer Lab", "synthetic"],

    # Electrical
    ["A power cable is exposed near the staircase", "Electrical", "Main Block", "synthetic"],
    ["There is a loose electrical wire in the classroom", "Electrical", "Room 102", "synthetic"],
    ["The electrical switch is sparking", "Electrical", "Laboratory", "synthetic"],
    ["A damaged wire is hanging from the ceiling", "Electrical", "Academic Block", "synthetic"],
    ["The classroom power socket is not working", "Electrical", "Room 204", "synthetic"],

    # Plumbing
    ["The washbasin tap is broken", "Plumbing", "Washroom", "synthetic"],
    ["Water is leaking from the bathroom tap", "Plumbing", "Hostel Block", "synthetic"],
    ["The toilet flush is not functioning", "Plumbing", "Hostel Washroom", "synthetic"],
    ["The sink tap needs to be replaced", "Plumbing", "Canteen", "synthetic"],
    ["Water is leaking from a pipe near the washroom", "Plumbing", "Main Block", "synthetic"],

    # Civil
    ["Rainwater is entering through the damaged roof", "Civil", "Main Block", "synthetic"],
    ["The classroom ceiling has visible cracks", "Civil", "Room 305", "synthetic"],
    ["There is a crack in the corridor wall", "Civil", "Academic Block", "synthetic"],
    ["Tiles on the corridor floor are broken", "Civil", "Main Block", "synthetic"],
    ["The roof has damaged concrete and needs repair", "Civil", "Library Block", "synthetic"],

    # Sanitation
    ["The dustbin near the hostel is overflowing", "Sanitation", "Hostel Block", "synthetic"],
    ["Garbage has accumulated near the laboratory", "Sanitation", "Science Block", "synthetic"],
    ["The waste bin in the corridor is full", "Sanitation", "Academic Block", "synthetic"],
    ["Trash has not been collected from the hostel area", "Sanitation", "Hostel Block", "synthetic"],
    ["The garbage bins outside the classroom are overflowing", "Sanitation", "Academic Block", "synthetic"],
        # Networking
    ["The Wi-Fi connection is not working in the classroom", "Networking", "Room 101", "synthetic"],
    ["There is no internet connection in the computer lab", "Networking", "Computer Lab", "synthetic"],
    ["The network cable is damaged near the server room", "Networking", "Server Room", "synthetic"],
    ["Campus Wi-Fi is very slow in the library", "Networking", "Library", "synthetic"],
    ["The network port is not working in the office", "Networking", "Office Block", "synthetic"],
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


print("Dataset v2 created successfully!")
print("Original complaints:", len(df))
print("New complaints:", len(new_df))
print("Total complaints in v2:", len(df_v2))

print("\nCategory distribution:")
print(df_v2["category"].value_counts())

print("\nSaved to:", output_file)