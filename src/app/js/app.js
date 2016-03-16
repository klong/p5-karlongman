/////////////////////////////////////////////////////
/// MusuemApp module
/////////////////////////////////////////////////////

var MusuemApp = function() {
  // initAppLibs array defines the external libraries
  // and initMusuemData defines the JSON data we need
  // before our app can run
  var self = this;
  var musuemData = []; // initial empty array for museum json REST objects
  var viewModel = false;

  var initAppLibs = [{
    // google maps api
    name: 'googleMaps',
    dataType: 'script',
    url: 'https://maps.googleapis.com/maps/api/js?v=3&libraries=places',
    isLoaded: 'no'
  }, {
    // knockout.js library
    name: 'knockout',
    dataType: 'script',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js',
    isLoaded: 'no'
  }];

  var initMusuemData = [{
    // silver bowls - victoria & albert museum rest json objects
    name: 'V&A Museum Collection - Silver Bowls',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=metal&limit=10',
    isLoaded: 'no'
  }, {
    // wooden chairs - victoria & albert museum rest json objects
    name: 'V&A Museum Collection - Wooden Chairs',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=chair&materialsearch=wooden&limit=10',
    isLoaded: 'no'
  }, {
    // sppons - victoria & albert museum rest json objects
    name: 'V&A Museum Collection - Spoons',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=spoon&limit=10',
    isLoaded: 'no'
  }];

  $.each(initAppLibs, ajaxGetAppResource); // asyn load the libraries needed for app
  $.each(initMusuemData, ajaxGetAppResource); // async load the initial museum data for app

  function ajaxGetAppResource(index, obj) {
    //  load async (AJAX) external javascript or json data for app
    var request = $.ajax({
      url: obj.url,
      type: "GET",
      dataType: obj.dataType,
      timeout: (1 * 3000)
    });
    // AJAX GET successful
    request.done(function(data, textStatus, jqXHR) {
      obj.isLoaded = 'loaded';
      if (obj.dataType === 'json') {
        musuemData.push(data);
      }
      addMessage(obj.name + ' loaded 😀 with status:' + textStatus);
      //////////////////////////////////////////////////////////////////
      // NOTE: try initViewModel
      // the actual init only returns a non-false value if all of the
      // required libraries & museum data is ready
      // ///////////////////////////////////////////////////////////////
      var result = initViewModel();
      if (result !== false) {
        MusuemApp.viewModel = result;
        MusuemApp.viewModel.init();
        ko.applyBindings(MusuemApp.viewModel);
        console.dir(MusuemApp.viewModel);
        console.log('initViewModel done');
      } else {
        console.log('initViewModel after ' + obj.name + ' ' + result);
      }
      /////////////////////////////////////////////////////////////////
    });
    // When AJAX GET FAIL e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      // set the reqs 'isLoaded' key in appReqs to show not loaded
      obj.isLoaded = 'failed';
      addMessage(obj.name + ' not loaded 😞 with error:' + errorThrown);
    });
    request.always(function(jqXHR, textStatus, errorThrown) {
      console.log(obj.name + ' ' + textStatus);
    });
  }

  // Put together a status paragraph and append to the pages log area
  function addMessage(msg) {
    var paragraph = '<p class="error">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }

  function musuemDataReady() {
    console.log(musuemData.length);
    return (musuemData.length == initMusuemData.length);
  }

  function initViewModel() {
    // initialsing the app needs certain async loaded libraries and API's to be present
    // so checks true for
    // Google - for Google Maps API present
    // ko - for knockout.js library
    // musuemData - has at least one musuem object results data

    if ((window.google) && (window.ko) && musuemDataReady()) {
      console.log('START initViewModel');
      var vm = new NeighborhoodApp();
      //initMap();
      return vm;
    } else {
      console.log('initViewModel not ready');
      return false;
    }
  }

  // Knockoutjs VIEWMODEL
  var NeighborhoodApp = function() {

    var localLocation = {
      // default local location is Bristol, UK
      lat: 51.4335763,
      lng: -2.6070057
    };

    // map model for google map
    var mapsModel = {
      // observable array for museum objects in app
      musuemObjects: ko.observableArray()
    };

    // generic model for musuem object
    var MuseumObjectModel = function() {
      this.marker = ko.observable();
      this.location = ko.observable();
      this.musuemObjID = ko.observable();
    };

    // method to try and retrieve the users local location
    var setLocalLocation = function() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            localLocation.lat = position.coords.latitude;
            localLocation.lng = position.coords.longitude;
            console.log("sucessfully retrieved local location. Lat [" + localLocation.lat + '] lng [' + localLocation.lng + ']');
          },
          function(error) {
            console.log('Could not get current coords, using Bristol as default: ' + error.message);
          });
      }
    };

    // Method to add custom binding handlers to knockout
    var configureBindingHandlers = function() {
      // custom binding for address auto complete
      ko.bindingHandlers.addressAutoComplete = {
        init: function(element, valueAccessor) {
          // create the autocomplete object
          var autocomplete = new google.maps.places.Autocomplete(element, {
            types: ['geocode']
          });
          // when the user selects an address from the dropdown, populate the address in the model.
          var value = valueAccessor();
          google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
            console.log(place); // log the google API place
            updateAddress(place, value);
          });
        }
      };
      // custom binding handler for maps panel
      ko.bindingHandlers.mapPanel = {
        init: function(element, valueAccessor) {
          map = new google.maps.Map(element, {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.TERRAIN
          });
          centerMap(localLocation);
        }
      };
    };

    // method to center map based on location
    var centerMap = function(location) {
      map.setCenter(location);
      google.maps.event.trigger(map, 'resize');
    };

    var init = function() {
      console.log("INITING");
      setLocalLocation(); // set browser location if service is allowed
      configureBindingHandlers();
      //registerSubscribers();
    };
    // expose module public functions and variables to global environment
    return {
      init: init,
      mapsModel: mapsModel,
      localLocation: localLocation
    };

  };

  return {
    musuemData: musuemData,
    viewModel: viewModel
  };

}(); // NOTE: this function is an Immediately-Invoked Function Expression IIFE
// END MusuemApp module

function initMap() {
  // initialise google map
  var bristolLatLong = {
    lat: 51.4500,
    lng: -2.5833
  };

  var map = new google.maps.Map(document.getElementById('map'), {
    center: bristolLatLong,
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.TERRAIN
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


function VaMarkerSummary(data) {
  var result = data.records;

  console.dir(data);
  console.log(result.length + ' results');

  for (var i = 0; i < result.length; i++) {
    var fields = result[i].fields;
    console.log(fields.object + ' ' + fields.place.toUpperCase() + ' lat:' + fields.latitude + ' long:' + fields.longitude);
  }
}
