import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

class ListingSuccessModel:
    def __init__(self):
        # Locate dataset path cleanly
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "marketplace_data.csv")
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

        self.df = pd.read_csv(dataset_path)

        # Compute individual record sell-through ratio
        self.df['sell_through_ratio'] = self.df['sold_out_qty'] / self.df['waste_quantity']

        # Target success rule: 1 if sell_through_ratio >= 0.65 else 0
        self.df['isSuccessfull'] = (self.df['sell_through_ratio'] >= 0.65).astype(int)

        # Features & Target
        X = self.df[['material_type', 'month', 'waste_quantity', 'sell_through_ratio']]
        y = self.df['isSuccessfull']

        # One-hot encode material types
        X_encoded = pd.get_dummies(X, columns=['material_type'])
        self.feature_columns = X_encoded.columns

        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y, test_size=0.20, random_state=42
        )

        self.model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

        # Evaluation
        y_pred = self.model.predict(X_test)
        self.accuracy = round(accuracy_score(y_test, y_pred) * 100, 2)
        print(f"Listing Success Model Trained (Accuracy: {self.accuracy}%)")

    def predict_listing_success(self, material_type: str, month: int, waste_quantity: float):
        """
        Predicts listing success based on historical month-over-month 75% clearance benchmark.
        """
        month = int(month)
        waste_quantity = float(waste_quantity)

        # Look up historical clearance performance for this material in this month
        historical_data = self.df[
            (self.df['material_type'] == material_type) & (self.df['month'] == month)
        ]
        
        if len(historical_data) > 0:
            hist_clearance_ratio = float(historical_data['sell_through_ratio'].mean())
        else:
            # Fallback to general material average across all months
            mat_data = self.df[self.df['material_type'] == material_type]
            if len(mat_data) == 0:
                raise ValueError(f"Material '{material_type}' not found in dataset.")
            hist_clearance_ratio = float(mat_data['sell_through_ratio'].mean())

        # Construct input feature sample
        sample = pd.DataFrame([{
            'material_type': material_type,
            'month': month,
            'waste_quantity': waste_quantity,
            'sell_through_ratio': hist_clearance_ratio
        }])
        
        # One-hot encode input sample to match training structure
        sample_encoded = pd.get_dummies(sample, columns=['material_type']).reindex(
            columns=self.feature_columns, fill_value=0
        )
        
        # Predict success (1 or 0)
        prediction = int(self.model.predict(sample_encoded)[0])
        
        month_names = {
            1: "January", 2: "February", 3: "March", 4: "April",
            5: "May", 6: "June", 7: "July", 8: "August",
            9: "September", 10: "October", 11: "November", 12: "December"
        }

        return {
            "material_type": material_type,
            "month": f"{month} ({month_names.get(month, '')})",
            "waste_quantity": f"{waste_quantity} kg",
            "historical_clearance_rate": f"{hist_clearance_ratio * 100:.1f}%",
            "meets_75pct_threshold": "Yes" if hist_clearance_ratio >= 0.75 else "No",
            "isSuccessfull": prediction,
            "result_status": "SUCCESSFUL LISTING" if prediction == 1 else "UNSUCCESSFUL LISTING"
        }