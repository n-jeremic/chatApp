$(document).ready(getUserLocation);

function getUserLocation() {
  const location = document.getElementById('user-location');
  if (location) {
    const data = JSON.parse(location.dataset.user_location);

    mapboxgl.accessToken = 'pk.eyJ1IjoidGhlamVyYSIsImEiOiJjazYweTd1aDAwYzIyM29ueTl0bnRjcDZpIn0.K9m3iot3krOL3Q7DBcd9Pg';
    var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      zoom: 5,
      center: [data.lng, data.lat]
    });

    map.addControl(new mapboxgl.NavigationControl());

    addMarker(data, map);
  }
}

function addMarker(lngLatObj, map) {
  let marker = new mapboxgl.Marker().setLngLat(lngLatObj);
  marker.addTo(map);
}
