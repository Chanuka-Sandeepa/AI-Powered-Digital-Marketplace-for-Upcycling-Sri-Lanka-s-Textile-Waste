import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

class SalesTimeModel:
    def __init__(self):
        # Locate dataset path dynamically
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "marketplace_data.csv")
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

        self.df = pd.read_csv(dataset_path)

        # Compute individual sell-through ratio & monthly sales rate (kg / month)
        self.df['sell_through_ratio'] = self.df['sold_out_qty'] / self.df['waste_quantity']
        self.df['monthly_sales_rate'] = self.df['sold_out_qty'] / self.df['months_to_sell']

        # Features & Target
        X = self.df[['material_type', 'month', 'waste_quantity', 'sold_out_qty', 'sell_through_ratio']]
        y = self.df['months_to_sell']

        # One-Hot Encoding
        X_encoded = pd.get_dummies(X, columns=['material_type'])
        self.feature_columns = X_encoded.columns

        X_train, X_test, y_train, y_test = train_test_split(
            X_encoded, y, test_size=0.20, random_state=42
        )

        self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

        # Evaluation metrics
        y_pred = self.model.predict(X_test)
        self.r2 = round(r2_score(y_test, y_pred) * 100, 2)
        self.mae = round(mean_absolute_error(y_test, y_pred), 2)
        print(f"Sales Time Model Trained (R²: {self.r2}%, MAE: {self.mae} Months)")

    def predict_sales_time(self, material_type: str, month: int, waste_quantity: float):
        """
        Predicts total months to sell based on material type, target month, and quantity.
        """
        month = int(month)
        waste_quantity = float(waste_quantity)

        # Historical monthly performance lookup
        hist = self.df[(self.df['material_type'] == material_type) & (self.df['month'] == month)]
        
        if len(hist) > 0:
            avg_ratio = hist['sell_through_ratio'].mean()
            avg_rate = hist['monthly_sales_rate'].mean()
        else:
            mat_data = self.df[self.df['material_type'] == material_type]
            if len(mat_data) == 0:
                raise ValueError(f"Material '{material_type}' not found in dataset.")
            avg_ratio = mat_data['sell_through_ratio'].mean()
            avg_rate = mat_data['monthly_sales_rate'].mean()

        # Calculate expected sold quantity for this input batch
        expected_sold_qty = waste_quantity * avg_ratio
        
        # Cap training sample features to model bounds for standard ML prediction
        capped_waste = min(waste_quantity, float(self.df['waste_quantity'].max()))
        capped_sold = min(float(expected_sold_qty), float(self.df['sold_out_qty'].max()))

        sample = pd.DataFrame([{
            'material_type': material_type,
            'month': month,
            'waste_quantity': capped_waste,
            'sold_out_qty': capped_sold,
            'sell_through_ratio': float(avg_ratio)
        }])
        
        sample_encoded = pd.get_dummies(sample, columns=['material_type']).reindex(
            columns=self.feature_columns, fill_value=0
        )
        
        # Baseline Model Estimate
        base_months = self.model.predict(sample_encoded)[0]
        
        # Scale prediction if waste_quantity greatly exceeds average batch capacity
        volume_scale_factor = waste_quantity / self.df['waste_quantity'].mean()
        if volume_scale_factor > 1.5:
            estimated_months = max(int(np.ceil(expected_sold_qty / avg_rate)), int(np.round(base_months)))
        else:
            estimated_months = int(np.round(base_months))

        month_names = {
            1: "January", 2: "February", 3: "March", 4: "April",
            5: "May", 6: "June", 7: "July", 8: "August",
            9: "September", 10: "October", 11: "November", 12: "December"
        }

        return {
            "material_type": material_type,
            "month": f"{month} ({month_names.get(month, '')})",
            "waste_quantity": f"{waste_quantity:,.0f} kg",
            "estimated_months_to_sell": max(1, estimated_months)
        }