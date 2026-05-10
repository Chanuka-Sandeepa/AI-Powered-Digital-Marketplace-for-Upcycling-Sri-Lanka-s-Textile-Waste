import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
import base64
import os

class FabricDefectModel:
    def __init__(self, model_path='fabric_defect_model.pth'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = model_path
        self.model = None
        self._model_loaded = False
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
        
        self.class_names = ['defect', 'good']
    
    def _create_model(self):
        model = models.mobilenet_v2(weights=None)
        model.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(model.last_channel, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 2),
        )
        return model
    
    def _load_model(self):
        """Lazy load model on first use"""
        if self._model_loaded:
            return
        
        self.model = self._create_model()
        
        # Only load weights if file exists
        if os.path.exists(self.model_path):
            try:
                self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
                print(f"Model weights loaded from {self.model_path}")
            except Exception as e:
                print(f"Warning: Could not load model weights from {self.model_path}: {e}")
        else:
            print(f"Warning: Model file not found at {self.model_path}. Using untrained model.")
        
        self.model = self.model.to(self.device)
        self.model.eval()
        self._model_loaded = True
    
    def predict(self, image_bytes):
        self._load_model()  # Ensure model is loaded before prediction
        
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(image_tensor)
            probs = torch.softmax(outputs, dim=1)[0]
            pred_idx = probs.argmax().item()
            confidence = probs[pred_idx].item() * 100
        
        return {
            'class': self.class_names[pred_idx],
            'confidence': round(confidence, 2),
            'is_defect': pred_idx == 0
        }

model_instance = None

def get_model():
    global model_instance
    if model_instance is None:
        model_instance = FabricDefectModel()
    return model_instance