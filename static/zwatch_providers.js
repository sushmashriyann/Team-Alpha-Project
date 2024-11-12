// watch_providers.js

document.addEventListener("DOMContentLoaded", function () {
    // Extract the movie ID from the URL or a data attribute if available
    const movieId = window.location.pathname.split("/").pop();

    // Fetch and display the watch providers
    fetchWatchProviders(movieId);
});

// Function to fetch watch provider details for the US
function fetchWatchProviders(movieId) {
    const apiKey = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${apiKey}`;

    console.log(`Fetching watch providers for movie ID: ${movieId}`); // Log the movie ID
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data); // Log the API response
            if (data.results && data.results.US) {
                const providers = data.results.US;
                displayWatchProviders(providers);
            } else {
                console.log('No watch provider details available for the US.');
                // Fallback message if no US providers are found
                document.getElementById('watch-providers').innerText = 'No watch providers found for the US.';
            }
        })
        .catch(error => {
            console.error('Error fetching watch provider details:', error);
            // Fallback message in case of an error
            document.getElementById('watch-providers').innerText = 'Error loading watch provider details.';
        });
}

// Function to display watch providers
function displayWatchProviders(providers) {
    let rentHtml = '';
    let buyHtml = '';

    // Check for flatrate (streaming) providers
    if (providers.flatrate) {
        rentHtml += '<h3>Streaming Providers:</h3><ul>';
        providers.flatrate.forEach(provider => {
            rentHtml += `<li>${provider.provider_name}</li>`;
        });
        rentHtml += '</ul>';
    }

    // Check for rent providers
    if (providers.rent) {
        providers.rent.forEach(provider => {
            rentHtml += `<li>${provider.provider_name}</li>`;
        });
    }

    // Check for buy providers
    if (providers.buy) {
        providers.buy.forEach(provider => {
            buyHtml += `<li>${provider.provider_name}</li>`;
        });
    }

    // Update the HTML content of the lists
    document.getElementById('rent-providers').innerHTML = rentHtml;
    document.getElementById('buy-providers').innerHTML = buyHtml;
}
