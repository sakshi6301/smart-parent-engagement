from flask import Flask
from flask_cors import CORS
from routes.ai_routes import ai_routes
from models.risk_model import load_model

app = Flask(__name__)
CORS(app)

app.register_blueprint(ai_routes)

@app.route('/health')
def health():
    return {'status': 'ok', 'service': 'SCOPE AI Service'}

if __name__ == '__main__':
    print("Loading/training model...")
    load_model()
    app.run(host='0.0.0.0', port=8000, debug=False)
