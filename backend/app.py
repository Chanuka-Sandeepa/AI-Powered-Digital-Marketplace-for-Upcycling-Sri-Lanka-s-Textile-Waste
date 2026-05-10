from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from database import init_db, save_prediction, get_prediction_history, get_statistics
from models import get_model
import base64
from werkzeug.utils import secure_filename
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Initialize MongoDB
init_db(app)

# Get model instance
model = get_model()

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'app': 'Fabric Defect Detection API',
        'version': '1.0.0',
        'test_page': '/test',
        'endpoints': {
            'GET /api/health': 'Health check',
            'POST /api/predict': 'Predict fabric defects from image',
            'GET /api/history': 'Get prediction history',
            'GET /api/statistics': 'Get overall statistics',
            'POST /api/upload': 'Upload image and get prediction'
        }
    })

@app.route('/test', methods=['GET'])
def test_page():
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fabric Defect Detection API - Test</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1000px; margin: 0 auto; }
            .section { background: white; padding: 20px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            .endpoint { background: #f9f9f9; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; }
            button:hover { background: #0056b3; }
            input, textarea { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
            .result { background: #e8f4f8; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; overflow-x: auto; }
            .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 3px; margin: 10px 0; }
            .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 3px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧵 Fabric Defect Detection API - Test Panel</h1>
            
            <div class="section">
                <h2>1. Health Check</h2>
                <p>Test if the API is running</p>
                <button onclick="testHealth()">Test Health Check</button>
                <div id="health-result"></div>
            </div>
            
            <div class="section">
                <h2>2. Statistics</h2>
                <p>Get prediction statistics</p>
                <button onclick="testStats()">Get Statistics</button>
                <div id="stats-result"></div>
            </div>
            
            <div class="section">
                <h2>3. Prediction History</h2>
                <p>Get past predictions (optional: user_id, limit)</p>
                <input type="text" id="user-id" placeholder="User ID (optional)">
                <input type="number" id="limit" placeholder="Limit (default: 50)" value="10">
                <button onclick="testHistory()">Get History</button>
                <div id="history-result"></div>
            </div>
            
            <div class="section">
                <h2>4. Upload Image</h2>
                <p>Upload an image file for prediction</p>
                <input type="file" id="image-file" accept="image/*">
                <button onclick="testUpload()">Upload & Predict</button>
                <div id="upload-result"></div>
            </div>
        </div>
        
        <script>
            async function testHealth() {
                try {
                    const res = await fetch('/api/health');
                    const data = await res.json();
                    document.getElementById('health-result').innerHTML = 
                        '<div class="success"><strong>✓ Success</strong><br>' + 
                        JSON.stringify(data, null, 2) + '</div>';
                } catch (e) {
                    document.getElementById('health-result').innerHTML = 
                        '<div class="error"><strong>✗ Error</strong><br>' + e.message + '</div>';
                }
            }
            
            async function testStats() {
                try {
                    const res = await fetch('/api/statistics');
                    const data = await res.json();
                    document.getElementById('stats-result').innerHTML = 
                        '<div class="success"><strong>✓ Success</strong><br>' + 
                        JSON.stringify(data, null, 2) + '</div>';
                } catch (e) {
                    document.getElementById('stats-result').innerHTML = 
                        '<div class="error"><strong>✗ Error</strong><br>' + e.message + '</div>';
                }
            }
            
            async function testHistory() {
                try {
                    let url = '/api/history?limit=' + (document.getElementById('limit').value || 50);
                    const userId = document.getElementById('user-id').value;
                    if (userId) url += '&user_id=' + userId;
                    
                    const res = await fetch(url);
                    const data = await res.json();
                    document.getElementById('history-result').innerHTML = 
                        '<div class="success"><strong>✓ Success</strong><br>' + 
                        JSON.stringify(data, null, 2) + '</div>';
                } catch (e) {
                    document.getElementById('history-result').innerHTML = 
                        '<div class="error"><strong>✗ Error</strong><br>' + e.message + '</div>';
                }
            }
            
            async function testUpload() {
                try {
                    const file = document.getElementById('image-file').files[0];
                    if (!file) {
                        document.getElementById('upload-result').innerHTML = 
                            '<div class="error">Please select an image file</div>';
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    
                    if (res.ok) {
                        document.getElementById('upload-result').innerHTML = 
                            '<div class="success"><strong>✓ Prediction Success</strong><br>' + 
                            JSON.stringify(data, null, 2) + '</div>';
                    } else {
                        document.getElementById('upload-result').innerHTML = 
                            '<div class="error"><strong>✗ Error</strong><br>' + 
                            JSON.stringify(data, null, 2) + '</div>';
                    }
                } catch (e) {
                    document.getElementById('upload-result').innerHTML = 
                        '<div class="error"><strong>✗ Error</strong><br>' + e.message + '</div>';
                }
            }
        </script>
    </body>
    </html>
    '''
    return render_template_string(html)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        if 'image' in data:
            # Base64 image
            image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
            image_bytes = base64.b64decode(image_data)
        elif 'file' in request.files:
            # File upload
            file = request.files['file']
            image_bytes = file.read()
        else:
            return jsonify({'error': 'No image provided'}), 400
        
        # Make prediction
        result = model.predict(image_bytes)
        
        # Save to database
        save_prediction(
            image_data=base64.b64encode(image_bytes).decode('utf-8'),
            result=result['class'],
            confidence=result['confidence'],
            user_id=data.get('user_id')
        )
        
        return jsonify({
            'success': True,
            'prediction': result['class'],
            'confidence': result['confidence'],
            'is_defect': result['is_defect'],
            'timestamp': datetime.utcnow().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    user_id = request.args.get('user_id')
    limit = int(request.args.get('limit', 50))
    
    predictions = get_prediction_history(user_id, limit)
    
    # Convert ObjectId to string for JSON serialization
    for pred in predictions:
        pred['_id'] = str(pred['_id'])
        pred['timestamp'] = pred['timestamp'].isoformat()
    
    return jsonify({'predictions': predictions})

@app.route('/api/statistics', methods=['GET'])
def get_stats():
    stats = get_statistics()
    return jsonify(stats)

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Read and predict
    with open(filepath, 'rb') as f:
        image_bytes = f.read()
    
    result = model.predict(image_bytes)
    
    return jsonify({
        'success': True,
        'filename': filename,
        'prediction': result['class'],
        'confidence': result['confidence']
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)