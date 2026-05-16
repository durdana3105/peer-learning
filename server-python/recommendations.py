import os
from supabase import create_client, Client
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def get_supabase_client() -> Client:
    """Initialize and return the Supabase client."""
    url: str = os.environ.get("SUPABASE_URL", "")
    key: str = os.environ.get("SUPABASE_KEY", "")
    if not url or not key:
        raise ValueError("Supabase credentials not found in environment variables (SUPABASE_URL, SUPABASE_KEY).")
    return create_client(url, key)

def get_recommendations(user_id: str, top_n: int = 5) -> list[str]:
    """
    Get peer recommendations using TF-IDF and Cosine Similarity.
    
    Args:
        user_id (str): The logged-in/target user's profile ID.
        top_n (int): Number of recommended profile IDs to return.
        
    Returns:
        list[str]: A list of recommended profile_ids.
    """
    supabase = get_supabase_client()
    
    # Fetch all user metadata from the view we created
    response = supabase.table("user_recommendation_metadata").select("user_id, metadata_string").execute()
    profiles_data = response.data
    
    if not profiles_data:
        return []
        
    user_ids = [profile['user_id'] for profile in profiles_data]
    metadata_strings = [profile.get('metadata_string', '') for profile in profiles_data]
    
    # Ensure the target user exists in the dataset
    if user_id not in user_ids:
        print(f"Warning: User ID {user_id} not found in recommendation metadata.")
        return []
        
    target_index = user_ids.index(user_id)
    
    # 1. Vectorization: Use TfidfVectorizer to convert metadata into numerical vectors
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(metadata_strings)
    
    # 2. Similarity: Calculate cosine similarity between logged-in user and all others
    target_vector = tfidf_matrix[target_index:target_index+1]
    similarities = cosine_similarity(target_vector, tfidf_matrix).flatten()
    
    # 3. Ranking: Sort the results by score (descending)
    # argsort returns indices in ascending order, so we reverse with [::-1]
    ranked_indices = similarities.argsort()[::-1]
    
    recommended_profile_ids = []
    
    for i in ranked_indices:
        current_profile_id = user_ids[i]
        
        # Exclude the current user from recommendations
        if current_profile_id == user_id:
            continue
            
        recommended_profile_ids.append(current_profile_id)
            
        # Stop once we reach the requested number of recommendations
        if len(recommended_profile_ids) >= top_n:
            break
            
    return recommended_profile_ids

# Example Usage:
# if __name__ == "__main__":
#     # Ensure you have set SUPABASE_URL and SUPABASE_KEY in your env
#     recommended_ids = get_recommendations("some-user-uuid", top_n=5)
#     print("Recommended Profile IDs:", recommended_ids)
