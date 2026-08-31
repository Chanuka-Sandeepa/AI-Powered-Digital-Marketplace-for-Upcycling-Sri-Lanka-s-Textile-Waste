from flask_pymongo import PyMongo
import gridfs
from datetime import datetime

mongo = None
fs = None

def init_db(app):
    global mongo, fs
    app.config["MONGO_URI"] = "mongodb://localhost:27017/fabric_defect_db"
    mongo = PyMongo(app)
    fs = gridfs.GridFS(mongo.db)
    return mongo

def save_prediction(image_data, result, confidence, user_id=None):
    prediction = {
        'image': image_data,
        'result': result,
        'confidence': confidence,
        'user_id': user_id,
        'timestamp': datetime.utcnow(),
        'is_defect': result == 'defect'
    }
    return mongo.db.predictions.insert_one(prediction)

def get_prediction_history(user_id=None, limit=50):
    query = {}
    if user_id:
        query['user_id'] = user_id
    
    predictions = mongo.db.predictions.find(query).sort('timestamp', -1).limit(limit)
    return list(predictions)

def get_statistics():
    total = mongo.db.predictions.count_documents({})
    defects = mongo.db.predictions.count_documents({'is_defect': True})
    good = mongo.db.predictions.count_documents({'is_defect': False})
    
    return {
        'total': total,
        'defects': defects,
        'good': good,
        'defect_rate': (defects / total * 100) if total > 0 else 0
    }