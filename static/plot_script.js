
document.addEventListener('DOMContentLoaded', () => {
    // Plot based search and recommendations
    const plotSearchBtn = document.getElementById('plotSearchBtn');
    const plotSearchBox = document.getElementById('plotSearchBox');
    const recommendationBtn = document.getElementById('recommendationBtn');
    const resultsContainer = document.getElementById('results');

    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';


    // For Guessing the plot

    plotSearchBtn.addEventListener('click', async () => {
        const plot = plotSearchBox.value.trim();  // Trim to remove extra spaces

        if (!plot) {
            displayplotMessage('Please enter a plot description.');
            return;
        }

        searchSpinner.style.display = 'inline-block';

        try {
            const guess = await fetchGuess(plot);
            displayplotResults(guess);
        } catch (error) {
            displayplotMessage(`Error: ${error.message}`);
        } finally {
            searchSpinner.style.display = 'none';
        }
    });

    // Function to send POST request to /recommend endpoint
    async function fetchGuess(plot) {
        const response = await fetch('/plot_guess', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plot }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch guess. Please try again.');
        }

        const data = await response.json();
        return data.guess;
    }

    // Function to display results on the page
    async function displayplotResults(guess) {
        resultsContainer.innerHTML = '';  // Clear previous results

        if (!guess || guess.length === 0) {
            displayplotMessage('No recommendations found.');
            return;
        }

        const list = document.createElement('ul');  // Create a list to display movies
        
        
        for(const movie of guess){
            console.log(movie)
            const query = movie;
            if (query) {
                const results = await fetchMoviesOrSeries(query);
                displayResults(results);
            }
        }

        resultsContainer.appendChild(list);  // Append the list to the container
    }

    // For recommendations 

    recommendationBtn.addEventListener('click', async () => {
        const plot = plotSearchBox.value.trim();  // Trim to remove extra spaces

        if (!plot) {
            displayplotMessage('Please enter a plot description.');
            return;
        }

        searchSpinner.style.display = 'inline-block';

        try {
            const recommendations = await fetchRecommendations(plot);
            displayplotResults(recommendations);
        } catch (error) {
            displayplotMessage(`Error: ${error.message}`);
        } finally {
            searchSpinner.style.display = 'none';
        }
    });

    // Function to send POST request to /recommend endpoint
    async function fetchRecommendations(plot) {
        const response = await fetch('/plot_recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ plot }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch guess. Please try again.');
        }

        const data = await response.json();
        return data.recommendations;
    }

    // Function to display results on the page
    async function displayplotResults(recommendations) {
        resultsContainer.innerHTML = '';  // Clear previous results

        if (!recommendations || recommendations.length === 0) {
            displayplotMessage('No recommendations found.');
            return;
        }

        const list = document.createElement('ul');  // Create a list to display movies
        
        
        for(const movie of recommendations){
            //const listItem = document.createElement('li');
            //listItem.textContent = movie;
            //list.appendChild(listItem);
            console.log(movie)
            const query = movie;
            if (query) {
                const results = await fetchMoviesOrSeries(query);
                displayResults(results);
            }
        }

        resultsContainer.appendChild(list);  // Append the list to the container
    }

    async function fetchMoviesOrSeries(query) {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`);
        const data = await response.json();
        return data.results.slice(0); // Limit to top 20 results
    }

    function displayResults(results) {
        //resultsContainer.innerHTML = ''; // Clear previous results
        console.log(results)
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p>No results found.</p>'; // No results message
            return;
        }

            const item = results[0];

            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
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

            resultItem.onclick = () => {
                window.location.href = `/movie/${item.id}`; // Redirect to movie details page
            };

            resultsContainer.appendChild(resultItem);
        }
    
    // Function to display a message
    function displayplotMessage(message) {
        resultsContainer.innerHTML = `<p>${message}</p>`;
    }
});
