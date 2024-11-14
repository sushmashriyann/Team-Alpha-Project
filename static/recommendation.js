document.addEventListener("DOMContentLoaded", async function () {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const recommendedContainer = document.getElementById('recommended');
    const getRecommendationsBtn = document.getElementById('getRecommendationsBtn');

    if (getRecommendationsBtn) {
        getRecommendationsBtn.onclick = async function () {
            try {
                const response = await fetch('/api/get_recommended_movies');
                const recommendedMovies = await response.json();
                displayRecommendations(recommendedMovies);
            } catch (error) {
                console.error('Error fetching recommended movies:', error);
            }
        };
    }

    if (recommendedContainer) {
        // Load recommendations 
        await loadRecommendations();
    }

    // Function to check login status
    async function checkLoginStatus() {
        try {
            const response = await fetch('/is_logged_in');
            if (!response.ok) throw new Error('Failed to check login status');

            const status = await response.json();
            return status.logged_in;
        } catch (error) {
            console.error('Error checking login status:', error);
            return false;
        }
    }

    // Function to fetch user preferences
    async function getUserPreferences() {
        try {
            const response = await fetch('/get_user_preferences');
            if (!response.ok) throw new Error('Failed to fetch user preferences');

            const preferences = await response.json();
            if (preferences.length === 0) {
                recommendedContainer.innerHTML = '<p>Please update preference.</p>';
                return null; // No preferences found
            }
            return preferences;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            recommendedContainer.innerHTML = '<p>Please log in for personalized recommendation.</p>';
            return null;
        }
    }

    async function getRecommendations(preferences) {
        const genreIds = preferences.map(pref => pref.genre_id).filter(Boolean).join(',');
        const subGenreKeywords = preferences.map(pref => pref.sub_genre_name).filter(Boolean);
        let allResults = [];

        // Get the current year and calculate the start year (last 50 years)
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 50;

        // Fetch recommendations by main genres with filters
        if (genreIds) {
            try {
                const genreResponse = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreIds}&primary_release_date.gte=${startYear}-01-01&vote_average.gte=6.5&region=US&with_original_language=en&sort_by=popularity.desc`
                );
                if (!genreResponse.ok) throw new Error('Failed to fetch recommendations by genres');

                const genreRecommendations = await genreResponse.json();
                allResults = [...allResults, ...genreRecommendations.results];
            } catch (error) {
                console.error('Error fetching genre recommendations:', error);
            }
        }

        // Loop through each sub-genre keyword and fetch recommendations
        for (const keyword of subGenreKeywords) {
            try {
                // fetch using the search API
                let keywordResponse = await fetch(
                    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}&primary_release_date.gte=${startYear}-01-01&vote_average.gte=6.5&region=US&with_original_language=en&sort_by=popularity.desc`
                );
                if (!keywordResponse.ok) throw new Error(`Failed to fetch recommendations for keyword: ${keyword}`);

                let keywordRecommendations = await keywordResponse.json();

                // If no results are found, use the discover API 
                if (keywordRecommendations.results.length === 0) {
                    console.warn(`No results for keyword "${keyword}", trying Discover API instead.`);
                    keywordResponse = await fetch(
                        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_keywords=${encodeURIComponent(keyword)}&primary_release_date.gte=${startYear}-01-01&vote_average.gte=6.5&region=US&with_original_language=en&sort_by=popularity.desc`
                    );
                    if (!keywordResponse.ok) throw new Error(`Failed to fetch recommendations using Discover API for keyword: ${keyword}`);

                    keywordRecommendations = await keywordResponse.json();
                }

                allResults = [...allResults, ...keywordRecommendations.results];
            } catch (error) {
                console.error(`Error fetching recommendations for keyword "${keyword}":`, error);
            }
        }

        // Filter out duplicate movies based on their ID
        const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());

        // Filter movies to exclude those without a valid rating or trailer
        const filteredResults = [];
        for (const movie of uniqueResults) {
            try {
                const videoResponse = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}`);
                if (!videoResponse.ok) throw new Error('Failed to fetch video details');

                const videoData = await videoResponse.json();
                const trailers = videoData.results.filter(video => video.type === 'Trailer' && video.site === 'YouTube');

                // Exclude movies with no trailer or a low rating
                if (trailers.length > 0 && movie.vote_average && movie.vote_average >= 6.5) {
                    filteredResults.push(movie); // add movies that meet the criteria
                }
            } catch (error) {
                console.error(`Error fetching trailer for movie ID ${movie.id}:`, error);
            }
        }

        // Sort the filtered results by popularity or user rating in descending order
        filteredResults.sort((a, b) => b.popularity - a.popularity || b.vote_average - a.vote_average);

        return filteredResults; // Return the filtered results
    }

    // Function to display recommendations
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
            poster.src = item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : '/default-image';
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
    .then(response => response.json())
    .then(data => {
        if (data.message === "Movie already in watchlist") {
            alert("Movie already in watchlist");
        } else if (data.message === "Movie added to watchlist") {
            alert("Movie added to watchlist!");
        } else {
            alert("Failed to add movie to watchlist.");
        }
    })
    .catch(error => {
        console.error('Error adding to watchlist:', error);
        alert('An error occurred. Please try again.');
    });
}

    // Function to load recommendations
    async function loadRecommendations() {
        const loggedIn = await checkLoginStatus();
        if (!loggedIn) {
            if (recommendedContainer) {
                recommendedContainer.innerHTML = '<p>Please log in for personalized recommendation.</p>';
            }
            return; // Exit if the user is not logged in
        }

        const preferences = await getUserPreferences();
        if (!preferences) return; // Exit if no preferences (even if logged in)

        const recommendations = await getRecommendations(preferences);
        displayRecommendations(recommendations);
    }
});
