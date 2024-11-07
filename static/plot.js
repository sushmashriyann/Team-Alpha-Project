document.addEventListener('DOMContentLoaded', () => {
    // Plot based search
    const plotSearchBtn = document.getElementById('plotSearchBtn');
    const plotSearchBox = document.getElementById('plotSearchBox');
    const resultsContainer = document.getElementById('results-container');
    // Plot based Search bar 
    plotSearchBtn.addEventListener('click', async () => {
        const plot = plotSearchBox.value.trim();  // Trim to remove extra spaces

        if (!plot) {
            displayplotMessage('Please enter a plot description.');
            return;
        }

        try {
            const recommendations = await fetchRecommendations(plot);
            displayplotResults(recommendations);
        } catch (error) {
            displayplotMessage(`Error: ${error.message}`);
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
            throw new Error('Failed to fetch recommendations. Please try again.');
        }

        const data = await response.json();
        return data.recommendations;
    }

    // Function to display results on the page
    function displayplotResults(recommendations) {
        resultsContainer.innerHTML = '';  // Clear previous results

        if (!recommendations || recommendations.length === 0) {
            displayplotMessage('No recommendations found.');
            return;
        }

        const list = document.createElement('ul');  // Create a list to display movies
        recommendations.forEach(movie => {
            const listItem = document.createElement('li');
            listItem.textContent = movie;
            list.appendChild(listItem);
        });

        resultsContainer.appendChild(list);  // Append the list to the container
    }

    // Function to display a message
    function displayplotMessage(message) {
        resultsContainer.innerHTML = `<p>${message}</p>`;
    }
});
