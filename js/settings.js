let pickLocationMap;
let selectedLocation = null;

// Initialize local storage with sample data if empty
function initializeLocalStorage() {
    if (!localStorage.getItem('safePlaces')) {
        localStorage.setItem('safePlaces', JSON.stringify([
            {
                id: 1,
                name: "Dutse General Hospital",
                type: "Hospital",
                lga: "Dutse",
                capacity: 500,
                lat: 11.7,
                lng: 9.3,
                contact_person: "Dr. Ahmed",
                contact_phone: "+234123456789"
            }
        ]));
    }
}

// Initialize map for location picking
function initializeMap() {
    pickLocationMap = L.map('pickLocationMap').setView([11.7, 9.7], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickLocationMap);

    pickLocationMap.on('click', (e) => {
        if (selectedLocation) {
            pickLocationMap.removeLayer(selectedLocation);
        }
        selectedLocation = L.marker(e.latlng).addTo(pickLocationMap);
    });
}

// Load existing safe places from localStorage
function loadSafePlaces() {
    const places = JSON.parse(localStorage.getItem('safePlaces') || '[]');
    const tbody = document.getElementById('placesTableBody');
    tbody.innerHTML = places.map(place => `
        <tr>
            <td class="px-6 py-4">${place.name}</td>
            <td class="px-6 py-4">${place.type}</td>
            <td class="px-6 py-4">${place.lga}</td>
            <td class="px-6 py-4">${place.capacity}</td>
            <td class="px-6 py-4">
                <button onclick="deletePlace(${place.id})" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Populate LGA dropdown
function populateLGADropdown() {
    // Update the fetch path to be relative
    fetch('../jigawa_lga.json')
        .then(response => response.json())
        .then(data => {
            const lgas = data.features
                .map(feature => feature.properties.NAME_2)
                .filter(name => name) // Filter out any undefined/null values
                .sort((a, b) => a.localeCompare(b));

            const lgaSelect = document.getElementById('lgaSelect');
            lgaSelect.innerHTML = '<option value="">Select LGA</option>';
            
            lgas.forEach(lga => {
                const option = document.createElement('option');
                option.value = lga;
                option.textContent = lga.replace(/([A-Z])/g, ' $1').trim();
                lgaSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading LGAs:', error);
            // Add fallback data in case JSON fails to load
            const fallbackLGAs = ['Dutse', 'Hadejia', 'Kazaure', 'Gumel', 'Ringim'];
            const lgaSelect = document.getElementById('lgaSelect');
            lgaSelect.innerHTML = '<option value="">Select LGA</option>' +
                fallbackLGAs.map(lga => `<option value="${lga}">${lga}</option>`).join('');
        });
}

// Handle form submission
document.getElementById('addPlaceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedLocation) {
        alert('Please pick a location on the map');
        return;
    }

    const formData = new FormData(e.target);
    const places = JSON.parse(localStorage.getItem('safePlaces') || '[]');
    const data = {
        id: places.length + 1,
        name: formData.get('name'),
        type: formData.get('type'),
        lga: formData.get('lga'),
        capacity: parseInt(formData.get('capacity')),
        lat: selectedLocation.getLatLng().lat,
        lng: selectedLocation.getLatLng().lng,
        contact_person: formData.get('contact_person'),
        contact_phone: formData.get('contact_phone')
    };

    places.push(data);
    localStorage.setItem('safePlaces', JSON.stringify(places));
    
    loadSafePlaces();
    e.target.reset();
    selectedLocation.remove();
    selectedLocation = null;
});

// Delete a safe place
function deletePlace(id) {
    if (confirm('Are you sure you want to delete this safe place?')) {
        const places = JSON.parse(localStorage.getItem('safePlaces') || '[]');
        const updatedPlaces = places.filter(place => place.id !== id);
        localStorage.setItem('safePlaces', JSON.stringify(updatedPlaces));
        loadSafePlaces();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeLocalStorage();
    initializeMap();
    loadSafePlaces();
    populateLGADropdown();
});
