document.addEventListener("DOMContentLoaded", async function () {
    // Modal and Button Elements
    const signUpModal = document.getElementById('signUpModal');
    const signInModal = document.getElementById('signInModal');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const closeButtons = document.querySelectorAll('.close');
    const userInfoDiv = document.getElementById('user-info');
    const updatePreferenceLink = document.getElementById('updatePreferenceLink');

    // Search and Filter Elements
    const searchBtn = document.getElementById('searchBtn');
    const searchBox = document.getElementById('searchBox');
    const resultsDiv = document.getElementById('results');
    const refreshBtn = document.getElementById('refreshBtn');
    const genreDropdown = document.getElementById('genre-dropdown');
    const yearDropdown = document.getElementById('year-dropdown');
    const countryDropdown = document.getElementById('country-dropdown');
    const languageDropdown = document.getElementById('language-dropdown');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const trendingLink = document.getElementById('trendingLink');

    // TMDB API Key
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509';
    
    let isLoggedIn = false;

    // Utility Functions
    function showModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function updateUserInfo(initials) {
        isLoggedIn = true;
        userInfoDiv.innerHTML = `<span>${initials}</span> <button id="logoutBtn">Logout</button>`;
        document.getElementById('logoutBtn').onclick = logout;
    }

    function hideSignInUpButtons() {
        signUpBtn.style.display = 'none';
        signInBtn.style.display = 'none';
        updatePreferenceLink.style.display = 'block'; // Show Update Preference link
    }

    function showSignInUpButtons() {
        signUpBtn.style.display = 'block';
        signInBtn.style.display = 'block';
    }

    async function logout() {
        try {
            await fetch('/logout', { method: 'POST' });
            userInfoDiv.innerHTML = ''; // Clear user info on logout
            alert('You have logged out successfully.');
            showSignInUpButtons(); // Show Sign-Up and Sign-In buttons after logout
            updatePreferenceLink.style.display = 'none'; // Hide Update Preference link
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Handle Sign-Up form submission
    document.getElementById('signUpForm').onsubmit = async function (e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (password !== confirmPassword) {
            document.getElementById('password-error').style.display = 'block';
        } else {
            document.getElementById('password-error').style.display = 'none';
            const user = {
                first_name: document.getElementById('first_name').value,
                last_name: document.getElementById('last_name').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: password,
            };

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message); // Show success message
                    closeModal(signUpModal); // Close Sign-Up modal
                } else {
                    alert(result.error); // Show error message
                }
            } catch (error) {
                console.error('Sign-Up error:', error);
            }
        }
    };

    // Handle Sign-In form submission
    document.getElementById('signInForm').onsubmit = async function (e) {
        e.preventDefault();
        const user = {
            username: document.getElementById('signin_username').value,
            password: document.getElementById('signin_password').value,
        };

        try {
            const response = await fetch('/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            const result = await response.json();
            if (response.ok) {
                updateUserInfo(result.initials || "User"); // Show initials or default to "User"
                closeModal(signInModal); // Close the sign-in modal
                hideSignInUpButtons(); // Hide Sign-Up and Sign-In buttons after successful login
            } else {
                alert(result.error); // Show error message
            }
        } catch (error) {
            console.error('Sign-In error:', error);
        }
    };

    // Check session status on page load
    try {
        const response = await fetch('/check_session');
        const data = await response.json();
        if (data.logged_in) {
            updateUserInfo(data.initials || "User"); // Show initials or default to "User"
            hideSignInUpButtons(); // Hide the Sign-In and Sign-Up buttons
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }

    // Show modals when buttons are clicked
    signUpBtn.onclick = () => showModal(signUpModal);
    signInBtn.onclick = () => showModal(signInModal);

    // Close modals on clicking the close button
    closeButtons.forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });

    // Close modals using specific buttons inside modals
    document.getElementById('closeSignUp').onclick = () => closeModal(signUpModal);
    document.getElementById('closeSignIn').onclick = () => closeModal(signInModal);

    // Show Update Preference Form or prompt sign-in
    updatePreferenceLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (!isLoggedIn) {
            showModal(signInModal); // Prompt sign-in if not logged in
        } else {
            showUpdatePreferenceForm(); // Otherwise show preference form
        }
    });
async function showUpdatePreferenceForm() {
    try {
        // Fetch the preference form HTML from the backend
        const response = await fetch('/get_preferences_form');
        const formHtml = await response.text();
        
        // Append the form to the body without replacing existing content
        document.body.insertAdjacentHTML('beforeend', formHtml);

        // Fetch genres and subgenres from your PostgreSQL database
        const genreResponse = await fetch('/api/get_genres_and_subgenres');
        if (!genreResponse.ok) {
            throw new Error('Failed to fetch genres and subgenres');
        }
        const genresData = await genreResponse.json();

        const genresContainer = document.getElementById('genresContainer');

        // **Clear existing content to avoid duplicates**
        genresContainer.innerHTML = '';  // Add this line

        // Populate genres and subgenres
        genresData.forEach(genre => {
            const genreDiv = document.createElement('div');
            genreDiv.classList.add('genre-section');
            genreDiv.setAttribute('data-genre-id', genre.genre_id);

            const genreLabel = document.createElement('label');
            genreLabel.textContent = genre.genre_name;
            genreDiv.appendChild(genreLabel);

            const subgenreContainer = document.createElement('div');
            subgenreContainer.classList.add('subgenre-section');

            genre.subgenres.forEach(subgenre => {
                const subgenreDiv = document.createElement('div');
                subgenreDiv.classList.add('subgenre-item');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `subgenre-${subgenre.sub_genre_id}`;
                checkbox.name = 'subgenres';
                checkbox.value = subgenre.sub_genre_id;

                const label = document.createElement('label');
                label.htmlFor = `subgenre-${subgenre.sub_genre_id}`;
                label.textContent = subgenre.sub_genre_name;

                subgenreDiv.appendChild(checkbox);
                subgenreDiv.appendChild(label);
                subgenreContainer.appendChild(subgenreDiv);
            });

            genreDiv.appendChild(subgenreContainer);
            genresContainer.appendChild(genreDiv);
        });

        document.getElementById('preferencesModal').style.display = 'block';

        // Attach the onsubmit handler after the form is in the DOM
     document.getElementById('preferencesForm').onsubmit = async function (e) {
    e.preventDefault();
    
    const checkboxes = document.querySelectorAll('input[name="subgenres"]:checked');
    const preferences = Array.from(checkboxes).map(checkbox => ({
        genre_id: checkbox.closest('.genre-section').dataset.genreId,  // Correctly get genre_id from dataset
        sub_genre_id: checkbox.value
    }));

    try {
        const response = await fetch('/submit_preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferences })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error submitting preferences:', error);
    }
};


    } catch (error) {
        console.error('Error fetching preferences form:', error);
    }
};


    // Fetch trending movies
    trendingLink.onclick = async function (e) {
        e.preventDefault();
        const results = await fetchTrendingMovies();
        displayResults(results);
    };

    async function fetchTrendingMovies() {
        const response = await fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        return data.results.slice(0, 20); // Get top 20 trending results
    }

    // Search Button Functionality
    searchBtn.onclick = async function () {
        const query = searchBox.value;
        if (query) {
            const results = await fetchMoviesOrSeries(query);
            displayResults(results);
        }
    };

    async function fetchMoviesOrSeries(query) {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${query}`);
        const data = await response.json();
        return data.results.slice(0, 20); // Limit to top 20 results
    }

/*    function displayResults(results) {
        resultsDiv.innerHTML = ''; // Clear previous results
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p>No results found.</p>'; // No results message
            return;
        }

        results.forEach(item => {
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

            resultsDiv.appendChild(resultItem);
        });
    }

<<<<<<< Updated upstream
*/
    // Genre Button Functionality
    genreButtons.forEach(button => {
        button.onclick = async function () {
            const genreId = button.getAttribute('data-genre');
            const results = await fetchTrendingByGenre(genreId);
            console.log(results)
            displayResults(results);
        };
    });

function displayResults(results) {
    resultsDiv.innerHTML = ''; // Clear previous results
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No results found.</p>'; // No results message
        return;
    }

    async function fetchMovieData(recommendations) {
            let moviesData = []
            const moviePromises = recommendations.map(async (rec) => {
                const query = encodeURIComponent(rec.title);
                const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${query}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        moviesData.push(data.results[0]); // Push the first result into moviesData
                    }
                    return data.results[0]; 
                }
                console.error('Error fetching from TMDB:', response.statusText);
                return null; 
            });
        
        const movieResults = await Promise.allSettled(moviePromises); 
        const filteredResults = movieResults.filter(movie => movie);       
        displayResults(moviesData); 
    }

    // Plot Search button functionality
    plotSearchBtn.addEventListener('click', async function () {
        const userPlot = plotSearch.value.trim();

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

        // Add button to add to watchlist
        const addButton = document.createElement('button');
        addButton.textContent = 'Add to Watchlist';
    //    addButton.onclick = () => addToWatchlist(item);
 resultItem.appendChild(addButton);
addButton.onclick = (e) => {
addToWatchlist(item); // Call the function to add to watchlist
    e.stopPropagation(); // Prevent the event from bubbling up
    
};
       

        resultItem.onclick = () => {
            window.location.href = `/movie/${item.id}`; // Redirect to movie details page
        };

        resultsDiv.appendChild(resultItem);
    });
}

   const watchlistDiv = document.getElementById('watchlist');
    if (watchlistDiv) {
        get_watchlist(); // Call this only if `#watchlist` exists
    }

    const signUpForm = document.getElementById('signUpForm');
    if (signUpForm) {
        signUpForm.onsubmit = async function (e) {
            // Handle form submission
        };
    }

async function addToWatchlist(movie) {
    try {
        const response = await fetch('/add_to_watchlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                movie_id: movie.id,
                title: movie.title || movie.name,
                poster_path: movie.poster_path
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
                if (response.ok) {
                    const recommendations = await response.json();
                    await fetchMovieData(recommendations);
                } 
                else {
                    const errorData = await response.json();
                    alert(errorData.error || 'An error occurred');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('There was a problem with the request.');
            }
        } else {
            alert(result.error || result.message);
        }
    } catch (error) {
        console.error('Error adding to watchlist:', error);
    }


    // Populate filters (genres, years, countries, languages) from TMDB
    await populateGenres();  // This is the TMDB API genre call
    populateYears();
    await populateCountries();
    await populateLanguages();

    // Apply Filters Button
    applyFiltersBtn.onclick = async function () {
        const genreParam = genreDropdown.value !== 'All' ? `&with_genres=${genreDropdown.value}` : '';
        const yearParam = yearDropdown.value !== 'All' ? `&primary_release_year=${yearDropdown.value}` : '';
        const countryParam = countryDropdown.value !== 'All' ? `&region=${countryDropdown.value}` : '';
        const languageParam = languageDropdown.value !== 'All' ? `&with_original_language=${languageDropdown.value}` : '';

        const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}${genreParam}${yearParam}${countryParam}${languageParam}&sort_by=vote_average.desc&vote_count.gte=1000`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            displayResults(data.results.slice(0, 20)); // Display top 20 results
        } catch (error) {
            console.error("Error fetching filtered movies:", error);
        }
    };

    // Refresh Movie List
    refreshBtn.addEventListener('click', async function () {
        const genreParam = genreDropdown.value !== 'All' ? `&with_genres=${genreDropdown.value}` : '';
        const countryParam = countryDropdown.value !== 'All' ? `&region=${countryDropdown.value}` : '';
        const languageParam = languageDropdown.value !== 'All' ? `&with_original_language=${languageDropdown.value}` : '';

        const currentDate = new Date();
        const endDate = currentDate.toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 24); // 24 months ago
        const formattedStartDate = startDate.toISOString().split('T')[0];

        const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}${genreParam}${countryParam}${languageParam}&sort_by=vote_average.desc&vote_count.gte=1000&primary_release_date.gte=${formattedStartDate}&primary_release_date.lte=${endDate}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            displayResults(data.results.slice(0, 20));
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    });

    // TMDB API genre population (already exists)
    async function populateGenres() {
        const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`);
        const data = await response.json();

        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All Genres';
        genreDropdown.appendChild(allOption);

        data.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            genreDropdown.appendChild(option);
        });
    }

    // Years dropdown population
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All Years';
        yearDropdown.appendChild(allOption);

        for (let year = currentYear; year >= 1900; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearDropdown.appendChild(option);
        }
    }

    // Countries dropdown population from TMDB
    async function populateCountries() {
        const response = await fetch(`https://api.themoviedb.org/3/configuration/countries?api_key=${TMDB_API_KEY}`);
        const data = await response.json();

        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All Countries';
        countryDropdown.appendChild(allOption);

        const topCountries = [
            { iso_3166_1: 'US', english_name: 'United States' },
            { iso_3166_1: 'KR', english_name: 'Korea' },
            { iso_3166_1: 'IN', english_name: 'India' }
        ];

        topCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso_3166_1;
            option.textContent = country.english_name;
            countryDropdown.appendChild(option);
        });

        data.forEach(country => {
            if (!['US', 'KR', 'IN'].includes(country.iso_3166_1)) {
                const option = document.createElement('option');
                option.value = country.iso_3166_1;
                option.textContent = country.english_name;
                countryDropdown.appendChild(option);
            }
        });

        countryDropdown.value = 'US';
    }

    // Languages dropdown population from TMDB
    async function populateLanguages() {
        const response = await fetch(`https://api.themoviedb.org/3/configuration/languages?api_key=${TMDB_API_KEY}`);
        const data = await response.json();

        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All Languages';
        languageDropdown.appendChild(allOption);

        const topLanguages = [
            { iso_639_1: 'en', english_name: 'English' },
            { iso_639_1: 'hi', english_name: 'Hindi' },
            { iso_639_1: 'ko', english_name: 'Korean' },
            { iso_639_1: 'tr', english_name: 'Turkish' }
        ];

        topLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = language.iso_639_1;
            option.textContent = language.english_name;
            languageDropdown.appendChild(option);
        });

        data.forEach(language => {
            if (!['en', 'hi', 'ko', 'tr'].includes(language.iso_639_1)) {
                const option = document.createElement('option');
                option.value = language.iso_639_1;
                option.textContent = language.english_name;
                languageDropdown.appendChild(option);
            }
        });

        languageDropdown.value = 'en';
    }

    // Load trending movies on page load
    const initialMovies = await fetchTrendingMovies();
    displayResults(initialMovies);
=======
>>>>>>> Stashed changes
});
