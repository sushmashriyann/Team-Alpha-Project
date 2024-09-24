document.addEventListener("DOMContentLoaded", async function() {
    const signUpModal = document.getElementById('signUpModal');
    const signInModal = document.getElementById('signInModal');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const closeButtons = document.querySelectorAll('.close');

    // Hide modals on page load
    signUpModal.style.display = 'none';
    signInModal.style.display = 'none';

    // Check session status
    try {
        const response = await fetch('http://localhost:5000/check_session');
        const data = await response.json();
        if (data.logged_in) {
            document.getElementById('user-icon').style.display = 'block';
            document.getElementById('user-icon').innerText = data.username; 
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }

    // Function to show a modal
    function showModal(modal) {
        modal.style.display = 'block';
    }

    // Function to close a modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Show Sign Up modal
    signUpBtn.onclick = () => showModal(signUpModal);

    // Show Sign In modal
    signInBtn.onclick = () => showModal(signInModal);

    // Close modals
    closeButtons.forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });

    // Close modal when clicking outside of it
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    };

    // Function to handle form submission
    async function handleFormSubmission(url, userData, modal) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(result.message); // Display success message
                closeModal(modal); // Close modal only on successful submission

                // If sign-in was successful, show the user icon
                if (url === 'http://localhost:5000/signin') {
                    document.getElementById('user-icon').style.display = 'block';
                    document.getElementById('user-icon').innerText = result.username; // Display the username
                }
            } else {
                alert(result.error || result.message); // Display error message
            }
        } catch (error) {
            console.error('Error during submission:', error);
            alert('An error occurred. Please try again.'); // Generic error message
        }
    }

    // Sign Up form submission
    document.getElementById('signUpForm').onsubmit = (e) => {
        e.preventDefault();
        const user = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };

        handleFormSubmission('http://localhost:5000/signup', user, signUpModal);
    };

    // Sign In form submission
    document.getElementById('signInForm').onsubmit = (e) => {
        e.preventDefault();
        const user = {
            username: document.getElementById('signin_username').value,
            password: document.getElementById('signin_password').value,
        };

        handleFormSubmission('http://localhost:5000/signin', user, signInModal);
    };
});
