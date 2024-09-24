document.addEventListener("DOMContentLoaded", async function() {
    const signUpModal = document.getElementById('signUpModal');
    const signInModal = document.getElementById('signInModal');
    const signUpBtn = document.getElementById('signUpBtn');
    const signInBtn = document.getElementById('signInBtn');
    const closeButtons = document.querySelectorAll('.close');

    signUpModal.style.display = 'none';
    signInModal.style.display = 'none';

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

    function showModal(modal) {
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    signUpBtn.onclick = () => showModal(signUpModal);

    signInBtn.onclick = () => showModal(signInModal);

    closeButtons.forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    };

    async function handleFormSubmission(url, userData, modal) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                closeModal(modal); 

                if (url === 'http://localhost:5000/signin') {
                    document.getElementById('user-icon').style.display = 'block';
                    document.getElementById('user-icon').innerText = result.username; 
                }
            } else {
                alert(result.error || result.message); 
            }
        } catch (error) {
            console.error('Error during submission:', error);
            alert('An error occurred. Please try again.'); 
        }
    }


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

  
    document.getElementById('signInForm').onsubmit = (e) => {
        e.preventDefault();
        const user = {
            username: document.getElementById('signin_username').value,
            password: document.getElementById('signin_password').value,
        };

        handleFormSubmission('http://localhost:5000/signin', user, signInModal);
    };
});
