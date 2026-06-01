// Global variables and config
let mainMap, evacuationMap;
let predictionData = null;
const JIGAWA_CENTER = [11.7, 9.7];

// Load and initialize prediction data
async function loadPredictionData() {
    try {
        const response = await fetch('data/flood_predictions.json');
        const data = await response.json();
        predictionData = data;
        document.getElementById('lastUpdated').textContent = 
            new Date(data.timestamp).toLocaleString();
        return data;
    } catch (error) {
        console.error('Error loading predictions:', error);
        return generateSyntheticData();
    }
}

function generateSyntheticData() {
    const lgas = [
        'Auyo', 'Babura', 'Biriniwa', 'BirninKu', 'Buji', 'Dutse', 'Gagarawa',
        'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun',
        'KafinHau', 'Kaugama', 'Kazaure', 'KiriKasa', 'Kiyawa', 'Maigatari',
        'MalamMad', 'Miga', 'Ringim', 'Roni', 'Sule-Tan', 'Taura', 'Yankwashi'
    ];

    return {
        timestamp: new Date().toISOString(),
        predictions: lgas.map(lga => ({
            lga,
            risk_percentage: Math.floor(Math.random() * 100),
            factors: {
                elevation: Math.floor(Math.random() * 100) + 200,
                soil_moisture: Math.floor(Math.random() * 100),
                rainfall: Math.floor(Math.random() * 150),
                river_proximity: Math.random()
            }
        }))
    };
}

function getRiskStatus(risk) {
    if (risk >= 75) {
        return {
            text: 'Severe Risk',
            description: 'Immediate Action Required',
            color: 'bg-red-100 text-red-800'
        };
    } else if (risk >= 50) {
        return {
            text: 'High Risk',
            description: 'Prepare for Evacuation',
            color: 'bg-orange-100 text-orange-800'
        };
    } else if (risk >= 25) {
        return {
            text: 'Moderate Risk',
            description: 'Stay Alert',
            color: 'bg-yellow-100 text-yellow-800'
        };
    }
    return {
        text: 'Low Risk',
        description: 'Monitor Conditions',
        color: 'bg-green-100 text-green-800'
    };
}

// Update the showLocationDetails function
function showLocationDetails(location) {
    const sidebar = document.getElementById('detailsSidebar');
    const prediction = predictionData.predictions.find(p => p.lga === location);
    
    if (!prediction) return;

    const riskStatus = getRiskStatus(prediction.risk_percentage);
    
    // Update sidebar content
    document.getElementById('locationName').textContent = location;
    document.getElementById('riskScore').textContent = `${prediction.risk_percentage}%`;
    
    // Update risk status with new styling
    const riskStatusElement = document.getElementById('riskStatus');
    riskStatusElement.textContent = `${riskStatus.text} - ${riskStatus.description}`;
    riskStatusElement.className = `text-sm font-medium px-2 py-1 rounded-full ${riskStatus.color}`;

    // Update factors
    document.getElementById('elevation').textContent = `${prediction.factors.elevation}m`;
    document.getElementById('soilMoisture').textContent = `${prediction.factors.soil_moisture}%`;
    document.getElementById('rainfall').textContent = `${prediction.factors.rainfall}mm`;

    // Update progress bars with animation
    requestAnimationFrame(() => {
        document.getElementById('elevationBar').style.width = `${100 - (prediction.factors.elevation/300 * 100)}%`;
        document.getElementById('moistureBar').style.width = `${prediction.factors.soil_moisture}%`;
        document.getElementById('rainfallBar').style.width = `${(prediction.factors.rainfall/150) * 100}%`;
    });

    // Show sidebar with animation
    sidebar.classList.remove('hidden');
    sidebar.style.transform = 'translateX(0)';
    
    // Initialize evacuation map after sidebar is visible
    setTimeout(() => {
        initEvacuationMap(location, prediction);
    }, 300);
}

// Initialize maps
async function initMap() {
    if (!mainMap) {
        mainMap = L.map('map').setView(JIGAWA_CENTER, 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mainMap);

        try {
            const response = await fetch('jigawa_lga.json');
            const lgaData = await response.json();
            
            L.geoJSON(lgaData, {
                style: function(feature) {
                    const lga = feature.properties.NAME_2;
                    const prediction = predictionData.predictions.find(p => p.lga === lga);
                    const risk = prediction ? prediction.risk_percentage : 0;
                    
                    return {
                        fillColor: getRiskColor(risk),
                        weight: 1,
                        opacity: 1,
                        color: '#666',
                        fillOpacity: 0.7,
                        className: 'lga-layer'
                    };
                },
                onEachFeature: function(feature, layer) {
                    // Hover effects
                    layer.on({
                        mouseover: function(e) {
                            const layer = e.target;
                            layer.setStyle({
                                fillOpacity: 0.9,
                                weight: 2,
                                dashArray: ''
                            });
                            layer.bringToFront();
                        },
                        mouseout: function(e) {
                            const layer = e.target;
                            layer.setStyle({
                                fillOpacity: 0.7,
                                weight: 1,
                                dashArray: ''
                            });
                        },
                        click: function(e) {
                            const lga = e.target.feature.properties.NAME_2;
                            
                            // Update other layers' style
                            mainMap.eachLayer((layer) => {
                                if (layer.feature) {
                                    layer.setStyle({
                                        fillOpacity: 0.7,
                                        weight: 1
                                    });
                                }
                            });
                            
                            // Highlight clicked layer
                            e.target.setStyle({
                                fillOpacity: 0.9,
                                weight: 2
                            });
                            
                            // Center map on clicked LGA
                            mainMap.fitBounds(e.target.getBounds(), {
                                padding: [50, 50]
                            });

                            // Show location details in sidebar
                            showLocationDetails(lga);
                        }
                    });

                    // Add tooltip
                    layer.bindTooltip(feature.properties.NAME_2, {
                        permanent: false,
                        direction: 'center',
                        className: 'lga-tooltip'
                    });
                }
            }).addTo(mainMap);
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
            showNotification('Error loading map data', 'error');
        }
    }
}

function getRiskColor(risk) {
    if (risk > 75) return '#dc2626'; // High risk - red
    if (risk > 50) return '#f97316'; // Medium risk - orange
    if (risk > 25) return '#eab308'; // Low risk - yellow
    return '#22c55e'; // Very low risk - green
}

function showNotification(message, type = 'info') {
    // Basic notification - you can enhance this later
    console.log(`${type}: ${message}`);
}

// Initialize evacuation map
function initEvacuationMap(location, prediction) {
    if (!evacuationMap) {
        evacuationMap = L.map('evacuationMap').setView(JIGAWA_CENTER, 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(evacuationMap);
    }
    
    evacuationMap.invalidateSize();
    
    // Clear existing layers
    evacuationMap.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            evacuationMap.removeLayer(layer);
        }
    });

    // Add markers for safe places (if available)
    const safePlaces = JSON.parse(localStorage.getItem('safePlaces') || '[]')
        .filter(place => place.lga === location);

    safePlaces.forEach(place => {
        const icon = L.divIcon({
            html: `<div class="bg-white p-2 rounded-full shadow">
                ${place.type === 'Hospital' ? '🏥' : place.type === 'School' ? '🏫' : '🏢'}
            </div>`,
            className: 'safe-place-icon'
        });

        L.marker([place.lat, place.lng], { icon })
            .bindPopup(`
                <strong>${place.name}</strong><br>
                Type: ${place.type}<br>
                Capacity: ${place.capacity}<br>
                Contact: ${place.contact_person}<br>
                Phone: ${place.contact_phone}
            `)
            .addTo(evacuationMap);
    });
}

function applyFilters() {
    const locationFilter = document.getElementById('locationFilter').value;
    const riskFilter = document.getElementById('riskFilter').value;
    const sidebar = document.getElementById('detailsSidebar');

    // Hide sidebar if no location is selected
    if (!locationFilter) {
        sidebar.classList.add('hidden');
    }

    mainMap.eachLayer((layer) => {
        if (!layer.feature) return;

        const lga = layer.feature.properties.NAME_2;
        const prediction = predictionData.predictions.find(p => p.lga === lga);
        const risk = prediction ? prediction.risk_percentage : 0;
        let isVisible = true;

        // Apply location filter
        if (locationFilter && locationFilter.toLowerCase() !== lga.toLowerCase()) {
            isVisible = false;
        }

        // Apply risk filter
        if (riskFilter) {
            switch(riskFilter) {
                case 'high':
                    isVisible = isVisible && risk >= 75;
                    break;
                case 'medium':
                    isVisible = isVisible && risk >= 50 && risk < 75;
                    break;
                case 'low':
                    isVisible = isVisible && risk < 50;
                    break;
            }
        }

        // Update layer style
        layer.setStyle({
            fillOpacity: isVisible ? 0.7 : 0.1,
            weight: isVisible ? 2 : 0.5
        });

        // Zoom to filtered location if specified
        if (locationFilter && locationFilter.toLowerCase() === lga.toLowerCase()) {
            mainMap.fitBounds(layer.getBounds());
            showLocationDetails(lga);
        }
    });

    // Show loading state
    const button = document.getElementById('applyFilters');
    button.disabled = true;
    button.innerHTML = `<div class="spinner"></div>Applying...`;

    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Apply Filters
        `;
    }, 300);
}

function resetFilters() {
    // Reset select elements
    document.getElementById('locationFilter').value = '';
    document.getElementById('riskFilter').value = '';

    // Reset map layers
    mainMap.eachLayer((layer) => {
        if (layer.feature) {
            const lga = layer.feature.properties.NAME_2;
            const prediction = predictionData.predictions.find(p => p.lga === lga);
            const risk = prediction ? prediction.risk_percentage : 0;
            
            layer.setStyle({
                fillOpacity: 0.7,
                weight: 0.5,
                fillColor: getRiskColor(risk)
            });
        }
    });

    // Reset map view
    mainMap.setView(JIGAWA_CENTER, 8);
    
    // Hide details sidebar
    const sidebar = document.getElementById('detailsSidebar');
    sidebar.style.transform = 'translateX(100%)';
    setTimeout(() => {
        sidebar.classList.add('hidden');
        sidebar.style.transform = '';
    }, 300);
}

// Add these styles to ensure smooth transitions
document.head.insertAdjacentHTML('beforeend', `
    <style>
        #detailsSidebar {
            transition: transform 0.3s ease-in-out;
        }
        #detailsSidebar.hidden {
            display: none;
        }
        .lga-layer {
            transition: all 0.3s ease;
            outline: none !important;
        }
        .lga-tooltip {
            background: rgba(0, 0, 0, 0.8);
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 12px;
            padding: 4px 8px;
        }
        .leaflet-container {
            outline: none !important;
        }
    </style>
`);

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    predictionData = await loadPredictionData();
    initMap();
    
    // Initialize filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Handle sidebar close button
    document.getElementById('closeDetails').addEventListener('click', () => {
        document.getElementById('detailsSidebar').classList.add('hidden');
    });
    
    // Handle mobile sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });
});
