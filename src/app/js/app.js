/////////////////////////////////////////////////////
/// MusuemApp module
/////////////////////////////////////////////////////

var MusuemApp = function() {
  //initAppLibs array defines the external libraries
  // and initMusuemData defines the JSON data we need
  // before our app can run
  var self = this;
  var defaultLocation = {
    // Greenwich, UK
    lat: 51.4800,
    lng: 0
  };
  var musuemData = [];
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
  }, {
    // wordcloud2 api
    name: 'wordcloud2',
    dataType: 'script',
    url: '/js/library/wordcloud2.js',
    isLoaded: 'no'
  }];
  /// V&A museum REST JSON data -

  // var initMusuemData = [{
  //   name: 'V&A Museum Collection for default location',
  //   dataType: 'json',
  //   url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=metal&limit=10',
  //   isLoaded: 'no'
  // }];
  var initMusuemData = [{
    // silve-r bowls - victoria & albert museum rest json objects
    name: 'V&A Museum Collection - places 50km near Leeds',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/place/search?latitude=53.799722&longitude=-1.549167&radius=50&orderby=distance',
    isLoaded: 'no'
  }, {
    // wooden chairs - victoria & albert museum rest json objects
    name: 'V&A Museum Collection - Wooden Chairs',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=chair&materialsearch=wooden&limit=10',
    isLoaded: 'no'
  }, {
    name: 'V&A Museum Collection - museum object',
    dataType: 'json',
    url: 'http://www.vam.ac.uk/api/json/museumobject/O1240872',
    isLoaded: 'no'
  }];

  // var initMusuemData = [{
  //   // silve-r bowls - victoria & albert museum rest json objects
  //   name: 'V&A Museum Collection - Silve-r Bowls',
  //   dataType: 'json',
  //   url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=bowl&materialsearch=metal&limit=10',
  //   isLoaded: 'no'
  // }, {
  //   // wooden chairs - victoria & albert museum rest json objects
  //   name: 'V&A Museum Collection - Wooden Chairs',
  //   dataType: 'json',
  //   url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=chair&materialsearch=wooden&limit=10',
  //   isLoaded: 'no'
  // }, {
  //   // sppons - victoria & albert museum rest json objects
  //   name: 'V&A Museum Collection - Spoons',
  //   dataType: 'json',
  //   url: 'http://www.vam.ac.uk/api/json/museumobject/search?q=spoon&limit=10',
  //   isLoaded: 'no'
  // }];

  $.each(initAppLibs, ajaxGetAppResource); // asyn get/load javascript libraries needed by app

  if (typeof(Storage) !== "undefined") {
    // if localStorage is supported by browser
    if (localStorage.musuemData) {
      // if app has stored musuemData in localStorage from a previous run
      musuemData = (JSON.parse(localStorage.getItem("musuemData")));
    } else {
      //no previous museum data in localStorage
      $.each(initMusuemData, ajaxGetAppResource);   // asyn get JSON musuem data needed by app
    }
  }

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
        // store musuemData in browsesrs localStorage
        localStorage.setItem("musuemData", JSON.stringify(musuemData));
        addMessage(obj.name + ' JSON 😀 added to local storage:' + textStatus);
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

  function appLibsReady() {
    function isLoaded (element, index, obj) {
      return (element.isLoaded === 'loaded');
    }
    return initAppLibs.every(isLoaded);
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
    //((window.google) && (window.ko) && (window.WordCloud) && musuemDataReady())
    if  (appLibsReady() && musuemDataReady()) {
      var vm = new NeighborhoodViewModel();
      return vm;
    } else {
      //console.log('app not able to initialise');
      return false;
    }
  }

  // Knockoutjs VIEWMODEL
  var NeighborhoodViewModel = function() {

    // method to try and retrieve the users local location
    var getLocalLocation = function() {
      if (mapsModel.koLocalLocation() !== false) {

      }
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(geoPosition) {
            var newLoc = {
              lat: 0,
              lng: 0
            };
            newLoc.lat = geoPosition.coords.latitude;
            newLoc.lng = geoPosition.coords.longitude;
            console.log('sucessfully retrieved local location ' + newLoc.lat + ' ' + newLoc.lng);
            mapsModel.koLocalLocation(newLoc);
          },
          function(error) {
            console.log('Could not get current local coords ' + error.message);
          });
      }
    };

    // maps model for google map
    var mapsModel = {
      // koLocalLocation is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      koLocalLocation: ko.observable(false),
      // a map info window that will be reused to display different museum object details
      infowindow: new google.maps.InfoWindow({
        content: ""
      }),
      // observable array for museum objects within selected place
      koMusuemObjects: ko.observableArray(),
      // koMuseumObjPlaces observable array holds
      // for the V&A place markers on map
      koMuseumObjPlaces: ko.observableArray(),
      //
      koPlaceLabel: ko.observable('world')
    };

    // generic model for V&A musuem object
    var vaMuseumObjectModel = function() {
      self = this;
      self.marker = {};
      self.geoLoc = {};
      self.vaMusuemObjectNum = {};
    };

    // Method to add custom binding handlers to knockout
    var configureBindingHandlers = function() {
      // custom binding for address auto complete
      // code modified from book 'KnockoutJS by Example' by Adan Jaswal ISBN: 9781785288548

      // custom knockout binding handler for input autocomplete
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
            if (!place.geometry) {
              console.log("Autocomplete's returned place contains no geometry");

              return;
            }
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(11);
            }
            if (place.address_components) {
              address = place.address_components[0] && place.address_components[0].short_name || '';
              mapsModel.koPlaceLabel(address); // update ko.observable form label
            }
          });
        }
      };
      // custom knockout binding handler for map panel
      ko.bindingHandlers.mapPanel = {
        init: function(element, valueAccessor) {
          map = new google.maps.Map(element, {
            zoom: 1, // show whole world map by default
            //mapTypeId: google.maps.MapTypeId.TERRAIN
          });
          centerMap(MusuemApp.defaultLocation);
        }
      };
      // custom binding handler for wordMap panel
      ko.bindingHandlers.wordCloud = {
        init: function(element, valueAccessor) {
          var options = {
            list: [
              ['piggy', 13],
              ['wolf', 3],
              ['house', 4],
              ['teapot', 43],
              ['hounder', 10],
              ['flat iron', 5]
            ],
            gridSize: 18,
            weightFactor: 3,
            fontFamily: 'Finger Paint, cursive, sans-serif',
            color: '#f0f0c0',
            hover: window.drawBox,
            click: function(item) {
              console.log(item[0] + ': ' + item[1]);
            },
            backgroundColor: '#001f00'
          };
          WordCloud(element, options);
        }
      };
    };

    // method to subscribe address changes
    var registerSubscribers = function() {
      // fire before place is changed
      mapsModel.koPlaceLabel.subscribe(function(oldValue) {
        //removeMarker(oldValue);
        console.log('place was '+ oldValue);
      }, null, "beforeChange");
      // fire before local Location is changed
      mapsModel.koLocalLocation.subscribe(function(oldValue) {
        //removeMarker(oldValue);
        console.log('local location was '+ oldValue);

      }, null, "beforeChange");

    };

    var updateMapLocation = function(place, value) {
      var newLoc = place.geometry.location;
      mapsModel.searchPlace = newLoc;
      map.panTo(newLoc);
    };

    var mapGoLocal = function () {
      console.log(mapsModel.koLocalLocation());
    };

    // method to center map based on location
    var centerMap = function(location) {
      map.setCenter(location);
      google.maps.event.trigger(map, 'resize');
    };

    var init = function() {
      configureBindingHandlers();
      registerSubscribers();
      getLocalLocation(); // get users browser location service allowed
    };
    // NeighborhoodViewModel module public functions and variables
    return {
      init: init,
      mapsModel: mapsModel
    };

  };
  // MuseumApp module public functions and variables
  return {
    NeighborhoodViewModel: NeighborhoodViewModel,
    musuemData: musuemData,
    viewModel: viewModel,
    defaultLocation: defaultLocation,
    initAppLibs: initAppLibs,
    initMusuemData: initMusuemData,
    appLibsReady: appLibsReady
  };

}(); // NOTE: this function is an Immediately-Invoked Function Expression IIFE
// END MusuemApp MODULE


function VaMarkerSummary(data) {
  for (var i = 0; i < data.records.length; i++) {
    var fields = data.records[i].fields;
    console.log(fields.object + ' ' + fields.place.toUpperCase() + ' lat:' + fields.latitude + ' long:' + fields.longitude);
  }
}
