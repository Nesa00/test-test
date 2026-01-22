from flask import Flask, send_from_directory, render_template_string
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# Serve index.html at root
@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

# Serve any file in the directory
@app.route('/<path:filename>')
def serve_file(filename):
    if os.path.exists(filename):
        return send_from_directory('.', filename)
    return 'File not found', 404

if __name__ == '__main__':
    app.run(debug=True)
