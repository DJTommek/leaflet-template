class Utils {
	static locationKey(latLng) {
		return Math.round(latLng.lat * 1_000_000) / 1_000_000 + ',' + Math.round(latLng.lng * 1_000_000) / 1_000_000;
	}
}

class MapManager {
	constructor(elementId) {
		this.map = L.map(elementId);
		this.popup = L.popup();
	}
}

const mapManager = new MapManager('map');
mapManager.map.setView([50, 15], 8); // Czechia

mapManager.map.on('click', function (event) {
	const locationKey = Utils.locationKey(event.latlng);
	mapManager.popup
		.setLatLng(event.latlng)
		.setContent('Coordinates: ' + locationKey)
		.openOn(mapManager.map)
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '© OpenStreetMap'
}).addTo(mapManager.map);

