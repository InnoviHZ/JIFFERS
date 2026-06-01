class EvacuationPlanner {
    constructor(map) {
        this.map = map;
        this.routeLayer = L.layerGroup().addTo(map);
    }

    async planRoute(from, to) {
        // Clear existing routes
        this.routeLayer.clearLayers();

        // Use OSRM for route planning
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        // Draw route on map
        L.geoJSON(data.routes[0].geometry, {
            style: {
                color: '#ef4444',
                weight: 4,
                opacity: 0.7
            }
        }).addTo(this.routeLayer);

        return {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration
        };
    }
}

export const evacuationPlanner = new EvacuationPlanner();
