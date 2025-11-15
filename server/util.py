import json
import pickle
import numpy as np
import os
import warnings
warnings.filterwarnings("ignore")


locations = None
data_columns = None
model = None


def get_estimated_price(location, sqft, bhk, bath):
    try:
        location_index = data_columns.index(location.lower())
    except:
        location_index = -1

    features = np.zeros(len(data_columns))
    features[0] = sqft
    features[1] = bath
    features[2] = bhk
    if location_index >= 0:
        features[location_index] = 1

    return round(model.predict([features])[0], 2)


def get_location_names():
    return locations


def get_data_columns():
    return data_columns


def load_saved_artifacts():
    print("Loading saved artifacts...")

    base_dir = os.path.dirname(__file__)
    artifacts_dir = os.path.join(base_dir, "artifacts")

    columns_path = os.path.join(artifacts_dir, "columns.json")
    model_path = os.path.join(artifacts_dir, "bengaluru_home_prices_model.pickle")

    global data_columns
    global locations
    global model

    with open(columns_path, "r") as f:
        data_columns = json.load(f)['data_columns']
        locations = data_columns[3:]

    with open(model_path, "rb") as f:
        model = pickle.load(f)

    print("Artifacts loaded successfully.")


if __name__ == '__main__':
    load_saved_artifacts()
    print("Locations:", get_location_names())
    print("Estimate 1st Phase JP Nagar, 1000 sqft, 3 BHK, 3 bath:",
          get_estimated_price('1st Phase JP Nagar', 1000, 3, 3))
    print("Estimate 1st Phase JP Nagar, 1000 sqft, 2 BHK, 2 bath:",
          get_estimated_price('1st Phase JP Nagar', 1000, 2, 2))
    print("Estimate Kalhalli, 1000 sqft, 2 BHK, 2 bath:",
          get_estimated_price('Kalhalli', 1000, 2, 2))
    print("Estimate Ejipura, 1000 sqft, 2 BHK, 2 bath:",
          get_estimated_price('Ejipura', 1000, 2, 2))
