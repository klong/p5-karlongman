// app.js
// only run if JQuery has loaded sucessfully
$(document).ready(function() {
  var sampleData = [];

  var appReqs = [{
    name: 'googleMaps',
    dataType: 'script',
    url: 'https://maps.googleapis.com/maps/api/js?v=3&libraries=places',
    isLoaded: 'no'
  }, {
    name: 'knockout',
    dataType: 'script',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js',
    isLoaded: 'no'
  }, {
    name: 'V&A Museum Collection - Silver Bowls',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=metal&limit=10',
    isLoaded: 'no'
  }, {
    name: 'V&A Museum Collection - Wooden Chairs',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=chair&materialsearch=wooden&limit=10',
    isLoaded: 'no'
  }];

  // NOTE: for debugging aid ////
  window.appData = sampleData;
  window.appReqs = appReqs;
  ///////////////////////////////

  $.each(appReqs, getAppReq);

  function getAppReq(index, obj) {
    // async (AJAX) load an external javascript or json data the app needs
    var request = $.ajax({
      url: obj.url,
      type: "GET",
      dataType: obj.dataType,
      timeout: (1 * 3000)
    });
    // AJAX GET successful
    request.done(function(data, textStatus, jqXHR) {
      // set the reqs 'isLoaded' key in appReqs
      obj.isLoaded = 'yes';
      if (obj.dataType === 'json') {
        window.appData.push(data);
      }

      addMessage(obj.name + ' loaded 😀 with status:' + textStatus);

      // NOTE: try calling initApp
      // App initalising is only done if all required scripts & data is present
      var result = initApp();
      console.log('AppInit returns: ' + result);
    });
    // AJAX GET fails e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      // set the reqs 'isLoaded' key in appReqs to show not loaded
      obj.isLoaded = 'failed';
      addMessage(obj.name + ' not loaded 😞 with error:' + errorThrown);
    });
    request.always(function(jqXHR, textStatus, errorThrown) {
      console.log(obj.name + ' always: ' + textStatus);
    });
  }

  // Put together a status paragraph and append to the page log area
  function addMessage(msg) {
    var paragraph = '<p class="error">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }

  // INTIALISE APP

  function initApp() {
    // initialsing the app needs certain async libraries and API's to be present
    // GoogleMaps
    // Knockout
    // V&A REST service

    if ((window.google) && (window.ko) && (window.appData.length > 0)) {
      console.log('INIT APP Running');
      initMap();
      console.log(window.appData);
      //getVAData('http://www.vam.ac.uk/api/json/museumobject/search?q=' + 'cats');
      //getVAData('http://www.vam.ac.uk/api/json/museumobject/search?namesearch=josiah+wedgwood');
      //getVAData('http://www.vam.ac.uk/api/json/museumobject/search?placesearch=stockton');
      // getVAData('http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=silver&limit=30');
      // getVAData('http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=silver&limit=30&offset=30');
      //getVAData('http://www.vam.ac.uk/api/json/museumobject/?q=rat&radius=10&images=1');

      //
      return true;
    } else {

      return false;
    }


  }

  /////////////////////////
  /// V & A data request
  /////////////////////////
  function getVAData(url) {

    request = $.ajax({
      url: url,
      dataType: "json",
      timeout: 5 * 1000
    });

    request.done(function(data, textStatus, jqXHR) {
      console.log('done:' + textStatus);
      VaMarkerSummary(data);
      sampleData = data;
      return data;
    });

    request.fail(function(jqXHR, textStatus, errorThrown) {
      console.log('fail:' + textStatus + ' ' + errorThrown);
      return false;
    });

    request.always(function(jqXHR, textStatus, errorThrown) {
      //console.log('complete:' + textStatus + ' ' + errorThrown);
    });
  }

  function VaMarkerSummary(data) {
    var result = data.records;

    console.dir(data);
    console.log(result.length + ' results');

    for (var i = 0; i < result.length; i++) {
      var fields = result[i].fields;
      console.log(fields.object + ' ' + fields.place.toUpperCase() + ' lat:' + fields.latitude + ' long:' + fields.longitude);
    }
  }

  /// KNOCKOUT VIEWMODEL
  function AppViewModel() {

    var self = this;

    // the default neighborhood
    var defaultNeighborhood = 'Bristol';

    self.place = ko.observable(defaultNeighborhood);

  }

  function initMap() {
    // INITIALISE GOOGLE MAP
    var bristolLatLong = {
      lat: 51.4500,
      lng: -2.5833
    };

    var map = new google.maps.Map(document.getElementById('map'), {
      center: bristolLatLong,
      zoom: 13
    });

    var infowindow = new google.maps.InfoWindow({
      content: ""
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    // array for map markers
    var markers = [];

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places;

      places = searchBox.getPlaces();
      // google maps API call returns array of 'places' from keyword/s
      if (places.length === 0) {
        return;
      }
      //console.dir(places);

      // Clear current markers off the map
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      // reset the markers array
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();

      places.forEach(function(place) {
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(50, 50)
        };

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });
  }



});
