import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

class MarketplaceTrendModel:
    def __init__(self):
        # Locate dataset path dynamically
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "marketplace_data.csv")
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

        self.df = pd.read_csv(dataset_path)

        # Calculate historical clearance ratio for each material/month pattern
        self.df['sell_through_ratio'] = self.df['sold_out_qty'] / self.df['waste_quantity']

        # Input Features and Target
        X = self.df[['material_type', 'month', 'waste_quantity', 'sell_through_ratio']]
        y = self.df['trend_status_code']

        # One-Hot Encode categorical variable (material_type)
        X_encoded = pd.get_dummies(X, columns=['material_type'])
        self.feature_columns = X_encoded.columns
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y, test_size=0.20, random_state=42, stratify=y
        )

        self.model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

        # Model Performance Evaluation
        y_pred = self.model.predict(X_test)
        self.accuracy = round(accuracy_score(y_test, y_pred) * 100, 2)
        print(f"Marketplace Trend Model Trained (Accuracy: {self.accuracy}%)")

    def predict_marketplace_trend(self, material_type: str, month: int, waste_quantity: float):
        """
        Predicts marketplace trend status based on material, month, and volume.
        """
        month = int(month)
        waste_quantity = float(waste_quantity)

        month_names = {
            1: "January", 2: "February", 3: "March", 4: "April",
            5: "May", 6: "June", 7: "July", 8: "August",
            9: "September", 10: "October", 11: "November", 12: "December"
        }

        # Retrieve historical clearance ratio for this material and month
        historical_subset = self.df[
            (self.df['material_type'] == material_type) & (self.df['month'] == month)
        ]
        
        # Fallback to general material average if month lookup is empty
        if len(historical_subset) > 0:
            avg_sell_through = historical_subset['sell_through_ratio'].mean()
        else:
            mat_data = self.df[self.df['material_type'] == material_type]
            if len(mat_data) == 0:
                raise ValueError(f"Material '{material_type}' not found in dataset.")
            avg_sell_through = mat_data['sell_through_ratio'].mean()

        # Prepare input sample using derived historical ratio
        sample = pd.DataFrame([{
            'material_type': material_type,
            'month': month,
            'waste_quantity': waste_quantity,
            'sell_through_ratio': float(avg_sell_through)
        }])
        
        # Encode input sample
        sample_encoded = pd.get_dummies(sample, columns=['material_type']).reindex(
            columns=self.feature_columns, fill_value=0
        )
        
        # Predict trend status code
        predicted_code = int(self.model.predict(sample_encoded)[0])

        # Human-readable labels
        trend_labels = {
            1: "Low Demand (Trending Down)",
            2: "Stable Demand (Moderate)",
            3: "High Demand (Trending Up)"
        }

        return {
            "material_type": material_type,
            "month": f"{month} ({month_names.get(month, '')})",
            "waste_quantity": f"{waste_quantity} kg",
            "predicted_trend_status_code": predicted_code,
            "trend_description": trend_labels.get(predicted_code, "Unknown")
        }