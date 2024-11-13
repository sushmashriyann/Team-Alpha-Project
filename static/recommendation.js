document.addEventListener("DOMContentLoaded", async function () {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const recommendedContainer = document.getElementById('recommended');
    const loginMessage = document.getElementById('loginMessage'); // Check for login message

    // If a login message is present, display it and skip loading recommendations
    if (loginMessage) {
        recommendedContainer.innerHTML = '<p>' + loginMessage.textContent + '</p>';
        return;
    }

    async function getUserPreferences() {
        try {
            const response = await fetch('/get_user_preferences');
            if (!response.ok) throw new Error('Failed to fetch user preferences');
            return await response.json();
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            return [];
        }
    }

    async function getRecommendations(preferences) {
        const genreIds = preferences.map(pref => pref.genre_id).join(',');
        console.log('Genre IDs:', genreIds);

        try {
            const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds}`);
            if (!response.ok) throw new Error('Failed to fetch recommendations');

            const recommendations = await response.json();
            console.log('TMDB Recommendations:', recommendations);

            return recommendations;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return { results: [] };
        }
    }

    function displayRecommendations(results) {
        recommendedContainer.innerHTML = ''; // Clear previous results
        if (results.length === 0) {
            recommendedContainer.innerHTML = '<p>No recommendations found.</p>';
            return;
        }

        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('movie-item');
            resultItem.setAttribute('data-id', item.id);

            const poster = document.createElement('img');
            poster.src = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'path/to/default/image.jpg';
            poster.alt = item.title || item.name;
            resultItem.appendChild(poster);

            const title = document.createElement('h3');
            title.textContent = item.title || item.name || item.original_title;
            resultItem.appendChild(title);

            const rating = document.createElement('p');
            rating.textContent = `Rating: ${item.vote_average || 'N/A'}/10`;
            resultItem.appendChild(rating);

            const overview = document.createElement('p');
            overview.textContent = item.overview || 'No overview available.';
            resultItem.appendChild(overview);

            // Add "Add to Watchlist" button
            const watchlistButton = document.createElement('button');
            watchlistButton.classList.add('watchlist-button', 'add');
            watchlistButton.textContent = 'Add to Watchlist';
            watchlistButton.onclick = (event) => {
                event.stopPropagation(); // Prevent click event from triggering redirection
                addToWatchlist(item.id, item.title, item.poster_path);
            };
            resultItem.appendChild(watchlistButton);

            resultItem.onclick = () => {
                window.location.href = `/movie/${item.id}`;
            };

            recommendedContainer.appendChild(resultItem);
        });
    }

    // Function to add a movie to the watchlist
    function addToWatchlist(movieId, title, posterPath) {
        fetch('/add_to_watchlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ movie_id: movieId, title: title, poster_path: posterPath })
        })
        .then(response => {
            if (response.ok) {
                alert('Movie added to watchlist!');
            } else {
                alert('Failed to add movie to watchlist.');
            }
        })
        .catch(error => {
            console.error('Error adding to watchlist:', error);
            alert('An error occurred. Please try again.');
        });
    }

    // Main function to fetch and display recommendations
    async function loadRecommendations() {
        const preferences = await getUserPreferences();
        const recommendations = await getRecommendations(preferences);
        displayRecommendations(recommendations.results);
    }

    loadRecommendations(); // Load recommendations on page load
});
