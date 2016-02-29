// app.js

// googleMapas API callback function

function initMap() {

  var uluru = {lat: -25.363, lng: 131.044};

  var map = new google.maps.Map(document.getElementById('map'), {
    center: uluru,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.HYBRID
  });

  var infowindow = new google.maps.InfoWindow({
    content: "rssp"
  });

  var markers = [];

  var goldStar = {
   path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
   fillColor: 'yellow',
   fillOpacity: 0.8,
   scale: 0.1,
   strokeColor: 'red',
   strokeWeight: 2
 };

  var marker = new google.maps.Marker({
    position: uluru,
    map: map,
    title: 'Uluru (Ayers Rock)',
    icon: goldStar
  });

  markers.push(marker);


  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

}
