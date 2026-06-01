// Initialize charts and data
let riskChart, capacityChart, rainfallChart;
const charts = {};

// Load data from localStorage and initialize charts
function initializeAnalytics() {
    const safePlaces = JSON.parse(localStorage.getItem('safePlaces') || '[]');
    const lgaRiskData = JSON.parse(localStorage.getItem('lgaRiskData') || '{}');

    // Populate filters
    populateLGAFilter();
    updateSummaryCards(safePlaces, lgaRiskData);
    initializeCharts(safePlaces, lgaRiskData);
    updateAnalysisTable(safePlaces, lgaRiskData);
}

function populateLGAFilter() {
    fetch('../jigawa_lga.json')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('lgaFilter');
            const lgas = [...new Set(data.features.map(f => f.properties.NAME_2))].sort();
            
            lgas.forEach(lga => {
                const option = document.createElement('option');
                option.value = lga;
                option.textContent = lga;
                select.appendChild(option);
            });
        });
}

function updateSummaryCards(safePlaces, lgaRiskData) {
    const highRiskCount = Object.values(lgaRiskData).filter(risk => risk > 75).length;
    const totalCapacity = safePlaces.reduce((sum, place) => sum + place.capacity, 0);

    document.getElementById('highRiskCount').textContent = highRiskCount;
    document.getElementById('safePlacesCount').textContent = safePlaces.length;
    document.getElementById('totalCapacity').textContent = totalCapacity.toLocaleString();
}

function initializeCharts(safePlaces, lgaRiskData) {
    // Risk Level Distribution
    const riskCtx = document.getElementById('riskChart').getContext('2d');
    riskChart = new Chart(riskCtx, {
        type: 'pie',
        data: getRiskDistributionData(lgaRiskData),
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Safe Places Capacity
    const capacityCtx = document.getElementById('capacityChart').getContext('2d');
    capacityChart = new Chart(capacityCtx, {
        type: 'bar',
        data: getCapacityData(safePlaces),
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Rainfall Trends
    const rainfallCtx = document.getElementById('rainfallChart').getContext('2d');
    rainfallChart = new Chart(rainfallCtx, {
        type: 'line',
        data: getRainfallData(),
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateAnalysisTable(safePlaces, lgaRiskData) {
    const tbody = document.getElementById('analysisTable');
    tbody.innerHTML = '';

    Object.entries(lgaRiskData).forEach(([lga, risk]) => {
        const lgaSafePlaces = safePlaces.filter(place => place.lga === lga);
        const totalCapacity = lgaSafePlaces.reduce((sum, place) => sum + place.capacity, 0);
        const rainfall = Math.round(Math.random() * 100); // Mock data

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${lga}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="ml-2">${risk}%</div>
                    <div class="w-24 h-2 bg-gray-200 rounded-full ml-2">
                        <div class="h-full rounded-full ${getRiskColorClass(risk)}" style="width: ${risk}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${lgaSafePlaces.length}</td>
            <td class="px-6 py-4 whitespace-nowrap">${totalCapacity.toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">${rainfall} mm</td>
        `;
        tbody.appendChild(row);
    });
}

// Helper functions for chart data
function getRiskDistributionData(lgaRiskData) {
    const riskLevels = {
        'High Risk': 0,
        'Medium Risk': 0,
        'Low Risk': 0
    };

    Object.values(lgaRiskData).forEach(risk => {
        if (risk > 75) riskLevels['High Risk']++;
        else if (risk > 50) riskLevels['Medium Risk']++;
        else riskLevels['Low Risk']++;
    });

    return {
        labels: Object.keys(riskLevels),
        datasets: [{
            data: Object.values(riskLevels),
            backgroundColor: ['#dc2626', '#f97316', '#22c55e']
        }]
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeAnalytics);

// Add event listeners for filters
document.getElementById('timePeriod').addEventListener('change', updateCharts);
document.getElementById('lgaFilter').addEventListener('change', updateCharts);
