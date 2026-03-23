function showHistory(login) {
    document.getElementById('historyLoginName').innerText = login;
    
    fetch(`/history/${login}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = '';

            // 'index' to create unique IDs for the collapsible rows
            data.forEach((attempt, index) => {
                let formattedDistance = parseFloat(attempt.distance).toFixed(2);
                let collapseId = `descCollapse_${index}`;
                
                // Create the button (only if they actually wrote a description)
                let descButton = attempt.description 
                    ? `<button class="btn btn-primary rounded-pill text-white px-3 btn-toggle-notes" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}"></button>` 
                    : `<span class="text-muted small">None</span>`;

                // Create the hidden row (only if they actually wrote a description)
                let descRow = attempt.description
                    ? `
                    <tr class="collapse" id="${collapseId}">
                        <td colspan="4" class="bg-light bg-opacity-10 px-4 py-3 border-bottom">
                            <span class="text-muted small fw-bold text-uppercase d-block mb-1">Implementation Notes:</span>
                            <span class="text-dark small">${attempt.description}</span>
                        </td>
                    </tr>
                    ` : '';

                // Inject both rows into the table
                tbody.innerHTML += `
                    <tr>
                        <td class="ps-4 fw-semibold text-success">${formattedDistance}</td>
                        <td class="small text-muted">${attempt.algorithm}</td> 
                        <td class="small text-muted">${attempt.submission_time}</td>
                        <td class="text-center pe-4">${descButton}</td>
                    </tr>
                    ${descRow}
                `;
            });
            
            const modal = new bootstrap.Modal(document.getElementById('historyModal'));
            modal.show();
        })
        .catch(error => {
            alert("Could not load history. Please try again.");
        });
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- FORM SUBMISSION ---
    const tspForm = document.getElementById('tspForm');
    if (tspForm) {
        tspForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const formData = new FormData(this);
            
            fetch('/submit', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'error') {
                    alert("Submission Failed:\n\n" + data.message);
                } else {
                    window.location.reload();
                }
            })
            .catch(error => {
                alert("An unexpected error occurred. Please try again.");
            });
        });
    }

    // --- CANVAS DRAWING ---
    if (window.TSP_DATA && window.TSP_DATA.bestRouteStr !== "") {
        const canvas = document.getElementById('tspCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const cities = window.TSP_DATA.cities;
        let rawRoute = window.TSP_DATA.bestRouteStr;
        // Remove ONLY the square brackets at the very beginning and end
        rawRoute = rawRoute.replace(/^\[|\]$/g, ''); 
        
        // Split by comma, then clean up each city name individually
        const route = rawRoute.split(',').map(city => {
            // Remove extra spaces on the far left and right
            let cleaned = city.trim(); 
            // Remove ONLY the quotes at the very start and very end of the word
            cleaned = cleaned.replace(/^['"]|['"]$/g, ''); 
            return cleaned;
        });

        const bgImage = new Image();
        bgImage.src = window.TSP_DATA.mapUrl;
        
        bgImage.onload = () => {
            canvas.width = bgImage.width;
            canvas.height = bgImage.height;
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

            // Draw Route Lines
            ctx.beginPath();
            ctx.lineWidth = 3.5; 
            ctx.strokeStyle = 'rgba(13, 110, 253, 0.9)'; 
            ctx.lineJoin = 'round';
            
            for (let i = 0; i < route.length; i++) {
                const city = cities[route[i]];
                if (!city) continue;
                
                if (i === 0) ctx.moveTo(city.x, city.y);
                else ctx.lineTo(city.x, city.y);
            }
            ctx.stroke();

            // Draw Highlight Dots
            for (let i = 0; i < route.length; i++) {
                const city = cities[route[i]];
                if (!city) continue;
                
                ctx.beginPath();
                ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffc107'; 
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#1a1a1a';
                ctx.stroke();
            }
        };
    }

    // Initial Setup and Event Listener
    if (limitSelect && barplotDiv) {
        // Draw the chart for the first time using the default dropdown value
        renderBarChart(limitSelect.value);

        // Listen for the user changing the dropdown
        limitSelect.addEventListener('change', function(event) {
            renderBarChart(event.target.value);
        });
    }
});
