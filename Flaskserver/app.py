from flask import Flask, request, jsonify
from py.product_recommender import ProductRecommender
import pymysql

app = Flask(__name__)

# DB Configuration
db_config = {
    'host': 'project-db-campus.smhrd.com',
    'user': 'cgi_25K_donga1_p2_5',
    'password': 'smhrd5',
    'database': 'cgi_25K_donga1_p2_5',
    'port': 3307,
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# Initialize Recommender
# Note: This loads the model and connects to DB, which might take a second.
recommender = ProductRecommender(db_config=db_config)

@app.route('/')
def home():
    return "Green Signal Flask Server (AI Models) Running!"

@app.route('/predict/recommend', methods=['POST', 'GET'])
def recommend():
    """
    Get recommendations based on a query text (e.g., product name + ingredients).
    Request Body: { "query": "새우깡 밀가루 새우" }
    """
    try:
        data = request.args if request.method == 'GET' else request.json
        query_text = data.get('query', '')
        
        if not query_text:
            return jsonify({'error': 'No query provided'}), 400

        # Perform search using the recommender class
        # It uses TF-IDF + Cosine Similarity
        results = recommender.search(query_text, top_n=6)
        
        return jsonify(results)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)