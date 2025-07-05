from flask import Flask, render_template, request, jsonify, send_from_directory
from googletrans import Translator, LANGUAGES
import os


app = Flask(__name__, static_folder='static', template_folder='templates')
translator = Translator()

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/privacy")
def privacy():
    return send_from_directory(app.static_folder, "privacy.html")

@app.route("/about")
def about():
    return send_from_directory(app.static_folder, "about.html")

@app.route('/robots.txt')
def robots():
    return send_from_directory(app.static_folder, 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory(app.static_folder, 'sitemap.xml')

@app.route('/supported-languages')
def supported_languages():
    return jsonify({k: v.title() for k, v in LANGUAGES.items()})
    

@app.route('/api/translate', methods=['POST'])
def translate():
    data = request.json
    text = data.get('text', '')
    source = data.get('source', '')
    targets = data.get('targets', [])
    translations = {}

    for lang in targets:
        translated = translator.translate(text, src=source or 'auto', dest=lang)
        translations[lang] = translated.text

    return jsonify({'translations': translations})

if __name__ == '__main__':
    # This line is for local development only
    # app.run(debug=True)

    # For production, use a WSGI server like Gunicorn or uWSGI
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
