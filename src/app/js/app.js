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
        //console.dir(MusuemApp.viewModel);
        //console.log('initViewModel done');
      } else {
        //console.log('initViewModel after ' + obj.name + ' ' + result);
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
      //console.log(obj.name + ' ' + textStatus);
    });
  }

  // Put together a status paragraph and append to the pages log area
  function addMessage(msg) {
    var paragraph = '<p class="error">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }

  function musuemDataReady() {
    return (musuemData.length == initMusuemData.length);
  }

  function initViewModel() {
    // initialsing the app needs certain async loaded libraries and API's to be present
    // so checks true for
    // Google - for Google Maps API present
    // ko - for knockout.js library
    // musuemData - has at least one musuem object results data

    if ((window.google) && (window.ko) && musuemDataReady()) {
      var vm = new NeighborhoodViewModel();
      return vm;
    } else {
      //console.log('initViewModel not ready');
      return false;
    }
  }

  // Knockoutjs VIEWMODEL
  var NeighborhoodViewModel = function() {

    var localLocation = {
      // default locallocation is Bristol, UK
      lat: 51.4335763,
      lng: -2.6070057
    };

    // map model for google map
    var mapsModel = {
      // observable array for museum objects in app
      musuemObjects: ko.observableArray(),
      // single map info window will be used to display museum object details
      infowindow: new google.maps.InfoWindow({
        content: ""
      }),
      searchPlace: ko.observable(),
      placeLabel: "pop"
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
            if (place.hasOwnProperty("address_components")) {
              updateLocation(place, value);
            }
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

    // method to subscribe address changes
    var registerSubscribers = function() {
      // fire before from address is changed
      mapsModel.fromAddress.subscribe(function(oldValue) {
        removeMarker(oldValue);
      }, null, "beforeChange");

      // fire before to address is changed
      mapsModel.toAddress.subscribe(function(oldValue) {
        removeMarker(oldValue);
      }, null, "beforeChange");
    };


    var updateLocation = function(place, value) {
      var newLoc = place.geometry.location;
      mapsModel.searchPlace = newLoc;
      centerMap(place.geometry.location);
    };

    // method to center map based on location
    var centerMap = function(location) {
      map.setCenter(location);
      google.maps.event.trigger(map, 'resize');
    };

    var init = function() {
      setLocalLocation(); // set browser location if service is allowed
      configureBindingHandlers();
      //registerSubscribers();
    };
    // NeighborhoodViewModel module public functions and variables
    return {
      init: init,
      mapsModel: mapsModel,
      localLocation: localLocation
    };

  };
  // MuseumApp module public functions and variables
  return {
    musuemData: musuemData,
    viewModel: viewModel
  };

}(); // NOTE: this function is an Immediately-Invoked Function Expression IIFE
// END MusuemApp MODULE


function VaMarkerSummary(data) {
  var result = data.records;

  console.dir(data);
  console.log(result.length + ' results');

  for (var i = 0; i < result.length; i++) {
    var fields = result[i].fields;
    console.log(fields.object + ' ' + fields.place.toUpperCase() + ' lat:' + fields.latitude + ' long:' + fields.longitude);
  }
}
