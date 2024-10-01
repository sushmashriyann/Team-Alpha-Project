document.addEventListener("DOMContentLoaded", async function () {
    const signUpModal = document.getElementById('signUpModal');
    const signInModal = document.getElementById('signInModal');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const closeButtons = document.querySelectorAll('.close');
    const userInfoDiv = document.getElementById('user-info');
    const searchBtn = document.getElementById('searchBtn');
    const genreButtons = document.querySelectorAll('.genre-btn');
    const searchBox = document.getElementById('searchBox');
    const TMDB_API_KEY = '242a2ba5f4ab590b9cc98651955f4509'; // Your API key

    // Hide modals on page load
    signUpModal.style.display = 'none';
    signInModal.style.display = 'none';

    // Check session status on page load
    try {
        const response = await fetch('/check_session');
        const data = await response.json();
        if (data.logged_in) {
            updateUserInfo(data.initials); // Show initials
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }

    // Function to show modals
    function showModal(modal) {
        modal.style.display = 'block';
    }

    // Function to close modals
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Show Sign-Up modal
    signUpBtn.onclick = () => showModal(signUpModal);

    // Show Sign-In modal
    signInBtn.onclick = () => showModal(signInModal);

    // Close modals on clicking the close button
    closeButtons.forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });

    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    };

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
                updateUserInfo(result.initials); // Show initials upon sign-in
                closeModal(signInModal); // Close Sign-In modal
                hideSignInUpButtons(); // Hide Sign-Up and Sign-In buttons after successful login
            } else {
                alert(result.error); // Show error message
            }
        } catch (error) {
            console.error('Sign-In error:', error);
        }
    };

    // Function to hide Sign-Up and Sign-In buttons
    function hideSignInUpButtons() {
        signUpBtn.style.display = 'none';
        signInBtn.style.display = 'none';
    }

    // Update user info with initials
    function updateUserInfo(initials) {
        userInfoDiv.innerHTML = `
            <span>${initials}</span>
            <button id="logoutBtn">Logout</button>
        `;
        document.getElementById('logoutBtn').onclick = logout;
    }

    // Logout function
    async function logout() {
        try {
            await fetch('/logout', { method: 'POST' });
            userInfoDiv.innerHTML = ``; // Clear user info on logout
            alert('You have logged out successfully.');
            showSignInUpButtons(); // Show Sign-Up and Sign-In buttons after logout
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }

    // Function to show Sign-Up and Sign-In buttons after logout
    function showSignInUpButtons() {
        signUpBtn.style.display = 'block';
        signInBtn.style.display = 'block';
    }

    // Search Button Functionality
    searchBtn.onclick = async function () {
        const query = searchBox.value;
        if (query) {
            const results = await fetchMoviesOrSeries(query);
            displayResults(results);
        }
    };

    // Fetch movies/series by search query
    async function fetchMoviesOrSeries(query) {
        const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${query}`);
        const data = await response.json();
        return data.results.slice(0, 5);  // Limit to top 5 results
    }

    // Display results of search
    function displayResults(results) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';  // Clear previous results

        results.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');

            const poster = document.createElement('img');
            poster.src = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
            poster.alt = item.title || item.name;
            resultItem.appendChild(poster);

            const title = document.createElement('h3');
            title.textContent = item.title || item.name;
            resultItem.appendChild(title);

            const rating = document.createElement('p');
            rating.textContent = `Rating: ${item.vote_average}/10`;
            resultItem.appendChild(rating);

            const overview = document.createElement('p');
            overview.textContent = item.overview;
            resultItem.appendChild(overview);

            resultsDiv.appendChild(resultItem);
        });
    }

    // Genre Button Functionality
    genreButtons.forEach(button => {
        button.onclick = async function () {
            const genreId = button.getAttribute('data-genre');
            const results = await fetchTrendingByGenre(genreId);
            displayResults(results);
        };
    });

    // Fetch top trending movies by genre
    async function fetchTrendingByGenre(genreId) {
        const response = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}`);
        const data = await response.json();
        return data.results.slice(0, 5);  // Limit to top 5 trending movies
    }
});
