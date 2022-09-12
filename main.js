class Utils {
	static locationKey(latLng) {
		return Math.round(latLng.lat * 1_000_000) / 1_000_000 + ',' + Math.round(latLng.lng * 1_000_000) / 1_000_000;
	}
}

class AppStorage {
	static PREFIX = 'djtommek-leaflet-template';

	static KEY_MAP_INIT = 'mapInit';
	static KEY_MAP_BASE_LAYER = 'mapBaseLayer';

	/**
	 * @param {string} key
	 */
	static load(key) {
		return localStorage.getItem(AppStorage.PREFIX + key);
	}

	/**
	 * @param {string} key
	 * @param value
	 */
	static save(key, value) {
		localStorage.setItem(AppStorage.PREFIX + key, value)
	}
}

class MapManager {
	constructor(elementId) {
		this.map = L.map(elementId);
		this.popup = L.popup();
		this.layerControl = L.control.layers(this.tileLayers, []).addTo(this.map)
	}

	tileLayers = {
		'OSM default': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
		}),
		'Mapy.cz base': L.tileLayer('https://mapserver.mapy.cz/base-en/{z}-{x}-{y}?sdk={sdk}', {
			minZoom: 2,
			maxZoom: 18,
			attribution: '<a href="https://o.seznam.cz" target="_blank" rel="noopener">Seznam.cz, a.s.</a>',
			tileSize: 256,
			zoomOffset: 0,
			sdk: 'HgUbCgUbGkgqAQkYBxYEHQNHQlJdQFRbR11TQA==', // 2022-09-12
		}),
		'Mapy.cz hiking': L.tileLayer('https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}?sdk={sdk}', {
			minZoom: 2,
			maxZoom: 18,
			attribution: '<a href="https://o.seznam.cz" target="_blank" rel="noopener">Seznam.cz, a.s.</a>',
			tileSize: 256,
			zoomOffset: 0,
			sdk: 'HgUbCgUbGkgqAQkYBxYEHQNHQlJdQFRbR11TQA==', // 2022-09-12
		}),
	};
}

const mapManager = new MapManager('map');

const storedMapInit = AppStorage.load(AppStorage.KEY_MAP_INIT);
if (storedMapInit) {
	const [latLngRaw, zoom] = storedMapInit.split(';');
	const latLng = latLngRaw.split(',');
	mapManager.map.setView(latLng, zoom);
} else {
	mapManager.map.setView([50, 15], 8); // Czechia
}

const storedMapBaseLayer = AppStorage.load(AppStorage.KEY_MAP_BASE_LAYER);
if (storedMapBaseLayer && storedMapBaseLayer in mapManager.tileLayers) {
    mapManager.tileLayers[storedMapBaseLayer].addTo(mapManager.map);
} else {
    mapManager.tileLayers['OSM default'].addTo(mapManager.map);
}

mapManager.map.on('load zoomend moveend', function (event) {
	const mapCenter = mapManager.map.getCenter();
	AppStorage.save(AppStorage.KEY_MAP_INIT, [
		mapCenter.lat + ',' + mapCenter.lng,
		mapManager.map.getZoom(),
	].join(';'))
})

mapManager.map.on('baselayerchange', function (event) {
    AppStorage.save(AppStorage.KEY_MAP_BASE_LAYER, event.name);
})

mapManager.map.on('click', function (event) {
	const locationKey = Utils.locationKey(event.latlng);
	mapManager.popup
		.setLatLng(event.latlng)
		.setContent('Coordinates: ' + locationKey)
		.openOn(mapManager.map)
});
