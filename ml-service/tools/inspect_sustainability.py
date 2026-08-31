from app import sustainability_model as sm
import pandas as pd

row = {
 "fabric_type":"Cotton",
 "weight_kg":10.0,
 "health_score":85.0,
 "repairability":"Repairable",
 "condition":"Good",
 "district":"Colombo",
 "province":"Western",
 "industry_type":"Apparel Manufacturing",
}

base_df = pd.DataFrame([row])[sm.RAW_FEATURES]
print('RAW_FEATURES:', sm.RAW_FEATURES)
transformed = sm._preprocessor.transform(base_df)
print('Transformed shape:', transformed.shape)
raw_outputs = [float(est.predict(transformed)[0]) for est in sm._regressor_estimators]
print('raw_outputs list:', raw_outputs)
print('zipped outputs:')
for k,v in zip(sm.REGRESSOR_OUTPUT_NAMES, raw_outputs):
    print(k,':',v)
