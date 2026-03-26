from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.', template_folder='.')

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory(BASE_DIR, filename)

if __name__ == '__main__':
    print("=" * 60)
    print("SwiftAID Frontend Server")
    print("=" * 60)
    print("\n✓ Frontend running at: http://localhost:5000")
    print("✓ Make sure backend is running at: http://localhost:8000")
    print("\nPress Ctrl+C to stop the server\n")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
