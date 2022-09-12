class MapManager {
	constructor(elementId) {
		this.map = L.map(elementId);
	}
}

const mapManager = new MapManager('map');
mapManager.map.setView([50, 15], 8); // Czechia

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '© OpenStreetMap'
}).addTo(mapManager.map);

