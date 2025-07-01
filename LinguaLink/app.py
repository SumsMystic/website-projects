from flask import Flask, render_template, request, jsonify, send_from_directory
from googletrans import Translator, LANGUAGES


app = Flask(__name__, static_folder='static', template_folder='templates')
translator = Translator()

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/privacy")
def privacy():
    return send_from_directory("static", "privacy.html")

@app.route("/about")
def about():
    return send_from_directory("static", "about.html")

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
    app.run(debug=True)
