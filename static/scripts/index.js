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
                
                // 1. Create the button (only if they actually wrote a description)
                let descButton = attempt.description 
                    ? `<button class="btn btn-primary rounded-pill text-white px-3 btn-toggle-notes" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}"></button>` 
                    : `<span class="text-muted small">None</span>`;

                // 2. Create the hidden row (only if they actually wrote a description)
                let descRow = attempt.description
                    ? `
                    <tr class="collapse" id="${collapseId}">
                        <td colspan="4" class="bg-light bg-opacity-10 px-4 py-3 border-bottom">
                            <span class="text-muted small fw-bold text-uppercase d-block mb-1">Implementation Notes:</span>
                            <span class="text-dark small">${attempt.description}</span>
                        </td>
                    </tr>
                    ` : '';

                // 3. Inject both rows into the table
                tbody.innerHTML += `
                    <tr>
                        <td class="ps-4 fw-semibold text-success">${formattedDistance}</td>
                        <td class="small text-muted">${attempt.algorithm}</td> 
                        <td class="small text-muted">${attempt.submission_time}</td>
                        <td class="text-end pe-4">${descButton}</td>
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

    // --- BOXPLOT DRAWING ---
    const boxData = window.TSP_DATA.boxplotData;
    const boxplotDiv = document.getElementById('boxplotDiv');

    // Only draw the chart if there is actually data in the database
    if (boxData && Object.keys(boxData).length > 0 && boxplotDiv) {
        const plotTraces = [];

        // Loop through our dictionary and create a "Trace" (a boxplot) for each algorithm
        for (const [algo, distances] of Object.entries(boxData)) {
            plotTraces.push({
                y: distances,       
                type: 'box',        
                name: algo,         
                boxpoints: 'all',   
                jitter: 0.3,        
                pointpos: -1.8 
            });
        }

        const layout = {
            margin: { t: 20, b: 80, l: 60, r: 20 },
            yaxis: { title: 'Total Distance', zeroline: false },
            showlegend: false,      // Hide the legend since the x-axis labels are enough
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot('boxplotDiv', plotTraces, layout, {responsive: true});
    } else if (boxplotDiv) {
        // If the database is empty
        boxplotDiv.innerHTML = '<div class="d-flex h-100 justify-content-center align-items-center text-muted">Submit routes to generate comparison charts!</div>';
    }

    // --- HORIZONTAL BAR PLOT DRAWING ---
    const barData = window.TSP_DATA.barplotData;
    const barplotDiv = document.getElementById('barplotDiv');
    const limitSelect = document.getElementById('resultLimit');

    function renderBarChart(limitValue) {
        if (!barData || !barData.labels || barData.labels.length === 0 || !barplotDiv) {
            if (barplotDiv) barplotDiv.innerHTML = '<div class="d-flex justify-content-center align-items-center text-muted" style="height: 200px;">Submit routes to generate the standings chart!</div>';
            return;
        }

        // Slice the data based on the dropdown selection
        let numItems = barData.labels.length;
        if (limitValue !== 'all') {
            numItems = Math.min(parseInt(limitValue), numItems);
        }

        const slicedLabels = barData.labels.slice(0, numItems);
        const slicedDistances = barData.distances.slice(0, numItems);
        
        // Generate the invisible row numbers for the sliced data
        const rowIndices = slicedLabels.map((_, index) => index);

        // Calculate dynamic height based ONLY on the number of bars we are showing
        const chartHeight = Math.max(300, numItems * 35);

        const trace = {
            x: slicedDistances,
            y: rowIndices,
            type: 'bar',
            orientation: 'h', 
            marker: { color: '#0d6efd', opacity: 0.8 },
            text: slicedDistances.map(d => d.toFixed(2)),
            textposition: 'auto',
            hovertemplate: '%{customdata}<br>Distance: %{x}<extra></extra>',
            customdata: slicedLabels 
        };

        const layout = {
            height: chartHeight,
            margin: { t: 20, b: 40, l: 140, r: 40 }, 
            yaxis: { 
                autorange: 'reversed', 
                tickfont: { size: 11, weight: 'bold' },
                automargin: true,
                tickmode: 'array',
                tickvals: rowIndices,
                ticktext: slicedLabels
            },
            xaxis: { title: 'Distance', zeroline: false },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        Plotly.newPlot('barplotDiv', [trace], layout, {responsive: true});
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
