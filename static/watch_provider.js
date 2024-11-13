document.addEventListener("DOMContentLoaded", function () {
    const movieId = window.location.pathname.split("/").pop();
    const countryDropdown = document.getElementById('country-filter');

    // Populate the dropdown with country options
    populateCountries();

fetchOriginCountry(movieId);

    // Fetch providers for the default country (US)
    fetchWatchProviders(movieId, 'US');

// Call the function to fetch and display reviews
    
    // Debugging: Log the movie ID
    console.log(`Movie ID: ${movieId}`);

    fetchReviews(movieId);

    // Event listener for country selection
    countryDropdown.addEventListener('change', function () {
        const selectedCountry = this.value;
        fetchWatchProviders(movieId, selectedCountry);
    });
});

// Function to populate the countries dropdown using the TMDB API
async function populateCountries() {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/configuration/countries?api_key=${TMDB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const countryDropdown = document.getElementById('country-filter');

        // Top countries to be displayed first
        const topCountries = [
            { iso_3166_1: 'US', english_name: 'United States' },
	    { iso_3166_1: 'CA', english_name: 'Canada' },
            { iso_3166_1: 'KR', english_name: 'Korea' },
            { iso_3166_1: 'IN', english_name: 'India' }
        ];

        // Populate top countries
        topCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso_3166_1;
            option.textContent = country.english_name;
            countryDropdown.appendChild(option);
        });

        // Add the rest of the countries, excluding top ones
        data.forEach(country => {
            if (!['US', 'KR', 'IN'].includes(country.iso_3166_1)) {
                const option = document.createElement('option');
                option.value = country.iso_3166_1;
                option.textContent = country.english_name;
                countryDropdown.appendChild(option);
            }
        });

        // Set default country to US
        countryDropdown.value = 'US';
    } catch (error) {
        console.error('Error fetching countries:', error);
        countryDropdown.innerHTML = '<option>Error loading countries</option>';
    }
}

/*

// Function to fetch and display watch providers for the selected country
function fetchWatchProviders(movieId, countryCode) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results[countryCode]) {
                const providers = data.results[countryCode];
                displayWatchProviders(providers);
            } else {
                document.getElementById('rent-providers').innerHTML = '<p>No rent providers available.</p>';
                document.getElementById('buy-providers').innerHTML = '<p>No buy providers available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching watch provider details:', error);
            document.getElementById('rent-providers').innerHTML = '<p>Error loading watch provider details.</p>';
            document.getElementById('buy-providers').innerHTML = '<p>Error loading watch provider details.</p>';
        });
}

// Function to display watch providers
function displayWatchProviders(providers) {
    let rentHtml = '<ul>';
    let buyHtml = '<ul>';

    if (providers.rent) {
        providers.rent.forEach(provider => {
            rentHtml += `<li>${provider.provider_name}</li>`;
        });
    }

    if (providers.buy) {
        providers.buy.forEach(provider => {
            buyHtml += `<li>${provider.provider_name}</li>`;
        });
    }

    rentHtml += '</ul>';
    buyHtml += '</ul>';

    document.getElementById('rent-providers').innerHTML = rentHtml;
    document.getElementById('buy-providers').innerHTML = buyHtml;
}
*/

// Function to fetch and display watch providers for the selected country
function fetchWatchProviders(movieId, countryCode) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results[countryCode]) {
                const providers = data.results[countryCode];
                displayWatchProviders(providers);
            } else {
                document.getElementById('rent-providers').innerHTML = '<p>No rent providers available.</p>';
                document.getElementById('buy-providers').innerHTML = '<p>No buy providers available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching watch provider details:', error);
            document.getElementById('rent-providers').innerHTML = '<p>Error loading watch provider details.</p>';
            document.getElementById('buy-providers').innerHTML = '<p>Error loading watch provider details.</p>';
        });
}

// Function to display watch providers
function displayWatchProviders(providers) {
    let rentHtml = '<ul>';
    let buyHtml = '<ul>';

    // Loop through rent providers and add them to the list
    if (providers.rent && providers.rent.length > 0) {
        providers.rent.forEach(provider => {
            rentHtml += `<li>${provider.provider_name}</li>`;
        });
    } else {
        rentHtml += '<li>No rent providers available.</li>';
    }

    // Loop through buy providers and add them to the list
    if (providers.buy && providers.buy.length > 0) {
        providers.buy.forEach(provider => {
            buyHtml += `<li>${provider.provider_name}</li>`;
        });
    } else {
        buyHtml += '<li>No buy providers available.</li>';
    }

    rentHtml += '</ul>';
    buyHtml += '</ul>';

    // Insert the generated HTML into the respective sections
    document.getElementById('rent-providers').innerHTML = rentHtml;
    document.getElementById('buy-providers').innerHTML = buyHtml;
}


// Function to fetch and display the origin country
async function fetchOriginCountry(movieId) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.production_countries && data.production_countries.length > 0) {
            const originCountry = data.production_countries[0].name;
            document.getElementById('origin-country').textContent = `Country: ${originCountry}`;
        } else {
            document.getElementById('origin-country').textContent = 'Country: Not available';
        }
    } catch (error) {
        console.error('Error fetching origin country:', error);
        document.getElementById('origin-country').textContent = 'Country: Error loading';
    }
}


/*

// Function to fetch and display reviews
async function fetchReviews(movieId) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=${TMDB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const reviewsContainer = document.getElementById('reviews-container');

        if (data.results && data.results.length > 0) {
            reviewsContainer.innerHTML = ''; // Clear the loading message
            displayReviews(data.results);
        } else {
            reviewsContainer.textContent = 'No reviews available.';
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        reviewsContainer.textContent = 'Error loading reviews.';
    }
}

*/
/*
async function fetchReviews(movieId) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=${TMDB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const reviewsContainer = document.getElementById('reviews-container');
        const reviewSummaryElement = document.getElementById('review-summary');

        if (data.results && data.results.length > 0) {
            reviewsContainer.innerHTML = ''; // Clear the loading message
            displayReviews(data.results);

            // Generate and display the summary
            const summary = generateReviewSummary(data.results);
            reviewSummaryElement.textContent = `What users think: ${summary}`;
        } else {
            reviewsContainer.textContent = 'No reviews available.';
            reviewSummaryElement.textContent = 'What users think: No reviews to summarize.';
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        reviewsContainer.textContent = 'Error loading reviews.';
        reviewSummaryElement.textContent = 'What users think: Error loading summary.';
    }
}

*/

async function fetchReviews(movieId) {
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    const url = `https://api.themoviedb.org/3/movie/${movieId}/reviews?api_key=${TMDB_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        const reviewsContainer = document.getElementById('reviews-container');
        const reviewSummaryElement = document.getElementById('review-summary');

        if (data.results && data.results.length > 0) {
            reviewsContainer.innerHTML = ''; // Clear the loading message
            displayReviews(data.results);

            // Generate and display the sophisticated summary
            const summary = generateReviewSummary(data.results);
            reviewSummaryElement.textContent = `What users think: ${summary}`;
        } else {
            reviewsContainer.textContent = 'No reviews available.';
            reviewSummaryElement.textContent = 'What users think: No reviews to summarize.';
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
        reviewsContainer.textContent = 'Error loading reviews.';
        reviewSummaryElement.textContent = 'What users think: Error loading summary.';
    }
}


function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviews-container');
    reviewsContainer.innerHTML = ''; // Clear any existing reviews

    let currentIndex = 0;
    const batchSize = 10;

    // Function to render a batch of reviews
    function renderBatch() {
        const endIndex = Math.min(currentIndex + batchSize, reviews.length);
        for (let i = currentIndex; i < endIndex; i++) {
            const review = reviews[i];
            const reviewElement = document.createElement('div');
            reviewElement.classList.add('review');

            // Display the full review content
            reviewElement.innerHTML = `
                <h4>${review.author}</h4>
                <p>${review.content}</p>
            `;

            reviewsContainer.appendChild(reviewElement);
        }
        currentIndex = endIndex;

        // Show or hide the "Load More" button
        if (currentIndex < reviews.length) {
            loadMoreButton.style.display = 'block';
        } else {
            loadMoreButton.style.display = 'none';
        }
    }

    // Initial render
    renderBatch();

    // Create a "Load More" button
    const loadMoreButton = document.createElement('button');
    loadMoreButton.textContent = 'Load More';
    loadMoreButton.classList.add('load-more');
    loadMoreButton.addEventListener('click', renderBatch);

    reviewsContainer.appendChild(loadMoreButton);
}


