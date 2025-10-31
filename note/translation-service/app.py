from flask import Flask, request, jsonify
from deep_translator import GoogleTranslator

app = Flask(__name__)

@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get('text')
    target_lang = data.get('targetLang')
    if not text or not target_lang:
        return jsonify({'error': 'Missing text or targetLang'}), 400
    try:
        translated = GoogleTranslator(target=target_lang).translate(text)
        return jsonify({'translatedText': translated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
