import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error

class DynamicPricingModel:
    def __init__(self):
        # Locate dataset path cleanly
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dataset_path = os.path.join(base_dir, "data", "marketplace_data.csv")
        
        if not os.path.exists(dataset_path):
            raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

        self.df = pd.read_csv(dataset_path)

        #Historical Feature Engineering
        self.df['sell_through_ratio'] = self.df['sold_out_qty'] / self.df['waste_quantity']
        self.df['unit_price'] = self.df['unit_price_lkr']
        
        # Ground Truth target formula
        self.df['recommended_unit_price'] = self.df['unit_price'] * (0.85 + 0.30 * self.df['sell_through_ratio'])

        # Grouped Historical Averages
        self.material_month_stats = self.df.groupby(['material_type', 'month']).agg({
            'unit_price': 'mean',
            'sell_through_ratio': 'mean'
        }).reset_index().rename(columns={
            'unit_price': 'hist_avg_price',
            'sell_through_ratio': 'hist_avg_ratio'
        })

        self.material_overall_stats = self.df.groupby('material_type').agg({
            'unit_price': 'mean',
            'sell_through_ratio': 'mean'
        }).reset_index().rename(columns={
            'unit_price': 'hist_avg_price',
            'sell_through_ratio': 'hist_avg_ratio'
        })

        # Merge historical averages
        self.df = pd.merge(self.df, self.material_month_stats, on=['material_type', 'month'], how='left')

        # Features & Target
        X = self.df[['material_type', 'month', 'waste_quantity', 'hist_avg_price', 'hist_avg_ratio']]
        y = self.df['recommended_unit_price']

        # One-Hot Encoding
        X_encoded = pd.get_dummies(X, columns=['material_type'])
        self.feature_columns = X_encoded.columns

        # Train Model
        X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.20, random_state=42)
        
        self.model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
        self.model.fit(X_train, y_train)

        # Evaluation metrics
        y_pred = self.model.predict(X_test)
        self.r2 = round(r2_score(y_test, y_pred) * 100, 2)
        self.mae = round(mean_absolute_error(y_test, y_pred), 2)
        
        print(f"Dynamic Pricing Model Trained (R² Score: {self.r2}%, MAE: Rs. {self.mae})")

    def predict(self, material_type: str, waste_quantity: float, month: int):
        waste_quantity = float(waste_quantity)
        month = int(month)

        # Lookup historical averages
        stats = self.material_month_stats[
            (self.material_month_stats['material_type'] == material_type) & 
            (self.material_month_stats['month'] == month)
        ]

        if len(stats) == 0:
            stats = self.material_overall_stats[
                self.material_overall_stats['material_type'] == material_type
            ]

        if len(stats) == 0:
            raise ValueError(f"Material '{material_type}' not recognized in historical dataset.")

        hist_price = float(stats['hist_avg_price'].values[0])
        hist_ratio = float(stats['hist_avg_ratio'].values[0])

        # Construct input sample
        sample = pd.DataFrame([{
            'material_type': material_type,
            'month': month,
            'waste_quantity': waste_quantity,
            'hist_avg_price': hist_price,
            'hist_avg_ratio': hist_ratio
        }])

        sample_encoded = pd.get_dummies(sample, columns=['material_type']).reindex(
            columns=self.feature_columns, fill_value=0
        )

        # Predict
        predicted_price = round(float(self.model.predict(sample_encoded)[0]), 2)
        total_revenue = round(predicted_price * waste_quantity, 2)

        price_change_pct = ((predicted_price - hist_price) / hist_price) * 100

        if price_change_pct > 2.0:
            strategy = f"High demand in Month {month} ({hist_ratio*100:.1f}% historical clearance). Marked up by +{price_change_pct:.1f}%."
        elif price_change_pct < -2.0:
            strategy = f"Discounting by {abs(price_change_pct):.1f}% to encourage faster inventory clearance."
        else:
            strategy = f"Maintain standard baseline rate for Month {month}."

        return {
            "material_type": material_type,
            "waste_quantity_kg": waste_quantity,
            "month": month,
            "historical_avg_unit_price": f"Rs. {hist_price:.2f} / kg",
            "historical_clearance_rate": f"{hist_ratio * 100:.1f}%",
            "recommended_unit_price": f"Rs. {predicted_price:.2f} / kg",
            "estimated_total_revenue": f"Rs. {total_revenue:,.2f}",
            "pricing_strategy": strategy
        }