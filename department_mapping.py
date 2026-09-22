# Category to Department Mapping

CATEGORY_DEPARTMENT = {
    "Electrical": "Electrical Maintenance",
    "Plumbing": "Plumbing Maintenance",
    "Civil": "Civil Maintenance",
    "Furniture": "Furniture Maintenance",
    "Networking": "IT / Network Department",
    "Sanitation": "Sanitation / Housekeeping"
}


def get_department(category):
    return CATEGORY_DEPARTMENT.get(category, "General Maintenance")


# Test the mapping
if __name__ == "__main__":
    test_category = "Plumbing"

    department = get_department(test_category)

    print("Category:", test_category)
    print("Assigned Department:", department)