from sentence_transformers import SentenceTransformer, util
import numpy as np
import pandas as pd
import csv
import torch

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    model = SentenceTransformer('paraphrase-MiniLM-L6-v2').to(device)
    return model

def load_data():
    movies = []
    with open('combined_movies_dataset.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            title = row['title']
            overview = row['overview']
            release_date = row.get('release_date', 'N/A')
            if release_date == 'None' or not release_date.strip():
                release_date = 'N/A'
            movies.append({"title": title, "overview": overview, "release_date": release_date})
    return movies
    
def get_plot_embedding(model, movies):
    movie_plots = [movie['overview'] for movie in movies]
    plot_embeddings = model.encode(movie_plots, convert_to_tensor=True).to(device)
    return plot_embeddings
    
def get_output_results(model, movies, user_plot, plot_embeddings):
    movie_plots = [movie['overview'] for movie in movies]
    user_embedding = model.encode(user_plot, convert_to_tensor=True).to(device)
    cosine_scores = util.pytorch_cos_sim(user_embedding, plot_embeddings)[0]
    cosine_scores_np = cosine_scores.cpu().numpy()
    top_k = 10
    top_results = np.argsort(cosine_scores_np)[-top_k:][::-1]
    recommendations = []
    # Display the top-k recommended movies
    print("\nTop movie recommendations based on the plot:")
    for idx in top_results:
        title = movies[idx]['title']
        release_date = movies[idx].get('release_date')
        similarity_score = cosine_scores_np[idx]
        print(f"Title: {title}, Release Date: {release_date}, Similarity Score: {similarity_score:.4f}")
        recommendations.append({
            "title": title,
            "release_date": release_date,
            "similarity_score": f"{similarity_score:.4f}"
        })
    return recommendations  # Return top results for potential further processing

# Example usage:
if __name__ == "__main__":
    model = load_model()
    movies = load_data()
    plot_embeddings = get_plot_embedding(model, movies)
    user_plot = "A thrilling sci-fi adventure set in a dystopian future"
    top_results = get_output_results(model, movies, user_plot, plot_embeddings)