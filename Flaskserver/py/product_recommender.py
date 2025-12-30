
import os
import joblib
import pymysql
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

class ProductRecommender:
    def __init__(self, db_config=None, vectorizer_path=None):
        # 1. DB 설정 (기본값)
        self.db_config = db_config or {
            'host': 'localhost',
            'user': 'root',
            'password': '1234',
            'database': 'app_db',
            'port': 3306,
            'charset': 'utf8mb4',
            'cursorclass': pymysql.cursors.DictCursor
        }
        
        # 2. 경로 설정
        # 이 파일(product_recommender.py)은 'py' 폴더 안에 있으므로,
        # 같은 폴더에 있는 pkl 파일을 찾습니다.
        if vectorizer_path:
            self.vectorizer_path = vectorizer_path
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.vectorizer_path = os.path.join(base_dir, 'tfidf_vectorizer.pkl')

        self.vectorizer = None
        self.df_products = pd.DataFrame()
        self.is_ready = False

        # 3. 초기화 (자동 로드)
        self._load_resources()
        self._load_db_data()

    def _load_resources(self):
        """AI 모델(벡터라이저) 파일 로딩"""
        try:
            if os.path.exists(self.vectorizer_path):
                self.vectorizer = joblib.load(self.vectorizer_path)
                # print(f"✅ [Module] 벡터라이저 로드 완료: {self.vectorizer_path}")
            else:
                print(f"❌ [Module] 파일 없음: {self.vectorizer_path}")
        except Exception as e:
            print(f"❌ [Module] 벡터라이저 로딩 실패: {e}")

    def _load_db_data(self):
        """DB에서 제품 데이터를 미리 메모리에 올림"""
        conn = None
        try:
            conn = pymysql.connect(**self.db_config)
            cursor = conn.cursor()
            # [수정] 제조사, 영양성분 정보도 같이 가져옴
            sql = "SELECT report_no, product_name, raw_materials_text, manufacturer, nutrient_text FROM products"
            cursor.execute(sql)
            rows = cursor.fetchall()
            
            self.df_products = pd.DataFrame(rows)
            if not self.df_products.empty:
                self.df_products.fillna('', inplace=True)
                # 검색용 텍스트 미리 결합 (제품명 + 원재료)
                self.df_products['search_text'] = (
                    self.df_products['product_name'] + " " + self.df_products['raw_materials_text']
                )
                self.is_ready = True
                # print(f"✅ [Module] DB 데이터 로드 완료 ({len(self.df_products)}개)")
            else:
                print("⚠️ [Module] DB에 제품 데이터가 없습니다.")
        except Exception as e:
            print(f"❌ [Module] DB 접속/조회 실패: {e}")
        finally:
            if conn:
                conn.close()

    def search(self, query_text, top_n=5):
        """
        외부에서 호출하는 검색 메서드
        return: [{'product_name':..., 'score':...}, ...]
        """
        if not self.is_ready or self.vectorizer is None:
            print("⚠️ 모델이나 데이터가 준비되지 않았습니다.")
            return []

        try:
            # 1. 전체 DB 데이터 벡터화
            db_vectors = self.vectorizer.transform(self.df_products['search_text'])

            # 2. 검색어 벡터화
            query_vector = self.vectorizer.transform([query_text])

            # 3. 유사도 계산
            similarity_scores = cosine_similarity(query_vector, db_vectors).flatten()

            # 4. 상위 N개 추출
            top_indices = similarity_scores.argsort()[-top_n:][::-1]

            results = []
            for idx in top_indices:
                score = similarity_scores[idx]
                if score < 0.05: # 유사도가 너무 낮으면 제외
                    continue
                    
                row = self.df_products.iloc[idx]
                results.append({
                    'rank_score': float(score),
                    'product_name': row['product_name'],
                    'report_no': row['report_no'],
                    'raw_materials': row['raw_materials_text'],
                    # [추가] 상세 정보 포함
                    'manufacturer': row['manufacturer'],
                    'nutrient_text': row['nutrient_text']
                })
            return results

        except Exception as e:
            print(f"❌ 검색 도중 오류 발생: {e}")
            return []
