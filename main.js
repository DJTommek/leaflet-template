class Utils {
	static locationKey(latLng) {
		return Math.round(latLng.lat * 1_000_000) / 1_000_000 + ',' + Math.round(latLng.lng * 1_000_000) / 1_000_000;
	}
}

class BetterLocation {
	static popupContentPrefix(coords) {
		const lat = coords.lat.toFixed(6);
		const lon = coords.lng.toFixed(6);
		const latLon = Utils.locationKey(coords);

		let popupContent = '';
		popupContent += ' <code>' + latLon + '</code>';
		popupContent += ' <i class="bi bi-clipboard copy-to-clipboard" data-clipboard-text="' + latLon + '" title="Zkopíruj souřadnice do schránky"></i>';
		popupContent += ' | <a href="https://better-location.palider.cz/' + latLon + '" target="_blank" title="Otevřít web Better location">BetterLocation</a>'
		popupContent += '<br>';
		popupContent += '<a href="https://www.google.com/maps/place/' + latLon + '?q=' + latLon + '" target="_blank" title="Navigovat pomocí Google maps">Google maps</a>';
		popupContent += ' | ';
		popupContent += '<a href="https://mapy.cz/zakladni?y=' + lat + '&x=' + lon + '&source=coor&id=' + lon + '%2C' + lat + '" target="_blank" title="Navigovat pomocí Mapy.cz">Mapy.cz</a>';
		popupContent += ' | '
		popupContent += '<a href="https://www.waze.com/ul?ll=' + latLon + '&navigate=yes" target="_blank" title="Navigovat pomocí Waze">Waze</a>'
		popupContent += ' | '
		popupContent += '<a href="https://share.here.com/l/' + latLon + '?p=yes" target="_blank" title="Navigovat pomocí HERE WeGo">HERE</a>'
		return popupContent;
	}
}

/**
 * Nominatim indexes named (or numbered) features within the OpenStreetMap (OSM) dataset and a subset of other unnamed
 * features (pubs, hotels, churches, etc).
 *
 * @link https://nominatim.org/release-docs/latest/api/Overview/
 * @link https://github.com/osm-search/Nominatim
 * @link https://nominatim.openstreetmap.org/
 * @link https://operations.osmfoundation.org/
 */
class Nominatim {
	/**
	 * @param {string|URL} url
	 */
	constructor(url = 'https://nominatim.openstreetmap.org/') {
		this.url = new URL(url);
		this.url.searchParams.set('format', 'json');
	}

	/**
	 * Reverse geocoding generates an address from a latitude and longitude.
	 *
	 * @param {number} lat
	 * @param {number} lon
	 * @returns {Promise<Response>}
	 * @link https://nominatim.org/release-docs/latest/api/Reverse/
	 */
	async reverse(lat, lon) {
		const url = new URL(this.url);
		url.pathname = 'reverse';
		url.searchParams.set('lat', lat.toFixed(6));
		url.searchParams.set('lon', lon.toFixed(6));
		const request = new Request(url);
		return await fetch(request);
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
		this.scale = L.control.scale().addTo(this.map);
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
	mapManager.popup
		.setLatLng(event.latlng)
		.setContent(BetterLocation.popupContentPrefix(event.latlng))
		.openOn(mapManager.map)
});

/**
 * Enable copy-to-clipboard buttons
 */
if (ClipboardJS.isSupported()) {
	const clipboard = new ClipboardJS('.copy-to-clipboard');
	clipboard.on('success', function (event) { // temporary change icon to checkmark if copied successfully
		const classList = event.trigger.classList;
		if (classList.contains('bi-clipboard')) {
			classList.add('bi-clipboard-check');
			classList.remove('bi-clipboard');
			setTimeout(function () {
				classList.add('bi-clipboard');
				classList.remove('bi-clipboard-check');
			}, 1000);
		}
	});

	clipboard.on('error', function (event) {
		window.prompt('Error while copying text, you have to copy it manually:', event.text);
	});
}