document.addEventListener("DOMContentLoaded", async function () {
    const watchlistContainer = document.getElementById('watchlist');

async function getWatchlist() {
    if (!watchlistContainer) return; 

    try {
        const response = await fetch('/get_watchlist');

        if (response.status === 401) {
            // User is not logged in, display a message
            watchlistContainer.innerHTML = '<p>Please log in to see your watchlist.</p>';
            return;
        }

        const watchlist = await response.json();

        // Check if the watchlist is an array
        if (!Array.isArray(watchlist)) {
            throw new Error('Watchlist data is not an array');
        }

        // Check if the watchlist is empty
        if (!watchlist.length) {
            watchlistContainer.innerHTML = '<p>Your watchlist is empty.</p>';
            return;
        }

        // Populate the watchlist container with movies
        watchlistContainer.innerHTML = ''; // Clear existing content

        watchlist.forEach(movie => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item'); // Use the same class as displayResults
            resultItem.setAttribute('data-id', movie.movie_id); // Set movie_id as data-id 

            const poster = document.createElement('img');
            poster.src = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : 'path/to/default/image.jpg';
            poster.alt = movie.title;
            resultItem.appendChild(poster);

            const title = document.createElement('h3');
            title.textContent = movie.title; // Use the title from the watchlist
            resultItem.appendChild(title);


            // button to remove from watchlist
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove from Watchlist';
            removeButton.classList.add('watchlist-button', 'remove');
            removeButton.setAttribute('data-movie-id', movie.movie_id); // Store movie ID for removal
            resultItem.appendChild(removeButton);

            // event handler for removing the movie from watchlist
            removeButton.onclick = async (e) => {
                e.stopPropagation(); // Prevent redirect
                await removeFromWatchlist(movie.movie_id); // Call the removal function
            };

            resultItem.onclick = () => {
                window.location.href = `/movie/${movie.movie_id}`; // Redirect to movie details page
            };

            watchlistContainer.appendChild(resultItem);
        });

    } catch (error) {
        console.error('Error fetching watchlist:', error);
        watchlistContainer.innerHTML = '<p>Error loading watchlist.</p>';
    }
}

    async function removeFromWatchlist(movieId) {
        try {
            const response = await fetch('/remove_from_watchlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movie_id: movieId })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                getWatchlist(); // Refresh the watchlist after removal
            } else {
                alert(result.error);
            }
        } catch (error) {
            console.error('Error removing from watchlist:', error);
        }
    }

    // Check user session and display the watchlist if the user is logged in
    try {
        const sessionResponse = await fetch('/check_session');
        const sessionData = await sessionResponse.json();

        if (sessionData.logged_in) {
            // User is logged in, load the watchlist
            await getWatchlist();
        } else {
            // User is not logged in, show a message
            watchlistContainer.innerHTML = '<p>Please log in to see your watchlist.</p>';
        }
    } catch (error) {
        console.error('Error checking session:', error);
        watchlistContainer.innerHTML = '<p>Error loading watchlist.</p>';
    }
});
