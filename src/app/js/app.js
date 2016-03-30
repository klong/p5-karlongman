//---------------------------------------------------------
//    MusuemApp MODULE
//---------------------------------------------------------

var MusuemApp = function() {

  var defaultSearchLocation = {
    placeLoc: { // lng: lat: for Greenwich, UK
      lat: 51.4800,
      lng: 0
    },
    // placeSearchID goggle placeId for Greenwich, UK
    placeSearchID: "ChIJ83WZp86p2EcRbMrkYqGncBQ",
    // initial place obj is empty
    placeObj: {}
  };
  // initAppLibs array defines the external libraries
  // and initMusuemData defines the JSON data we need before our app can run
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
  var initMusuemData = [{
    // Victoria & Albert museum - REST service
    name: 'V&A Museum Collection - places with musuemobjects, 20km radius from Greenwich UK',
    dataType: 'json',
    search_parameters: {
      latitude: defaultSearchLocation.placeLoc.lat,
      longitude: defaultSearchLocation.placeLoc.lng,
      orderby: "distance",
      radius: 10,
      images: 1,
      limit: 12
    },
    url: 'http://www.vam.ac.uk/api/json/museumobject/search',
    isLoaded: 'no'
  }];

  // Get musuem data needed for ap to first run
  var searchLocation = {};
  var musuemData = [];
  // check if museum data already exists in localstorage from a previous app run
  // if localStorage is supported by browser
  if (typeof(Storage) !== "undefined") {
    // check if app has museum data stored from previous run
    if ((localStorage.musuemData) && (localStorage.searchLocation)) {
      // rehydrate the instant musuem data
      musuemData = (JSON.parse(localStorage.getItem("musuemData")));
      addMessage('Have existing localStorage: musuemData 😀');
      // rehydrate the search location
      //searchLocation =
      addMessage('Have existing localStorage: searchLocation 😀');
    } else {
      // no previously app stored data in localStorage then AJAX get resources
      addMessage('getting musuemobject data ...');
      $.each(initMusuemData, ajaxGetAppResource);
    }
  } else {
    // when localStorage is not supported by browser
    addMessage('Local Storage not allowed by browser 😞');
  }
  //---------------------------------------------------------
  // script resources for app
  addMessage('getting app script libraries ...');
  $.each(initAppLibs, ajaxGetAppResource);
  //---------------------------------------------------------

  function ajaxGetAppResource(index, obj) {
    //  load AJAX an external javascript or json data resource
    //console.log("start AJAX request for " + obj.url);
    var request = $.ajax({
      url: obj.url,
      type: "GET",
      data: obj.search_parameters,
      dataType: obj.dataType,
      timeout: (1 * 3000)
    });
    // GET AJAX DONE callback
    request.done(function(data, textStatus, jqXHR) {
      obj.isLoaded = 'loaded';
      if (obj.dataType === 'json') {
        musuemData.push(data);
        // store musuemData in browsesrs localStorage
        localStorage.setItem("musuemData", JSON.stringify(musuemData));
        addMessage(obj.name + ' JSON 😀 added to local storage:' + textStatus);
      }
      addMessage(obj.name + ' loaded 😀 with status:' + textStatus);
      //-----------------------------------------------------------------------
      // NOTE: try to initalise museum app, only returns a non-false (success)
      // value if all of the required libraries & museum data are loaded
      //-----------------------------------------------------------------------
      if (appLibsReadyP() && musuemDataReadyP()) {
        // initialsing the museum app needs all library API's and musuem data present
        var vm = new MusAppViewModel();
        // apply KNOCKOUT bindings
        ko.applyBindings(vm);
        // for debugging aid - can be commeted out
        window.MusuemViewModel = vm;
      }
      //-----------------------------------------------------------------------
    });
    // GET AJAX FAIL callback e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      // set the reqs 'isLoaded' key in appReqs to show not loaded
      obj.isLoaded = 'failed';
      addMessage(obj.name + ' not loaded 😞 with error:' + errorThrown);
    });
    // GET AJAX ALLWAYS callback
    request.always(function(jqXHR, textStatus, errorThrown) {
      //console.log(obj.name + ' ' + textStatus + ' ' + errorThrown);
    });
  }
  //---------------------------------------------------------

  // function to check all external javascript libraries have loaded
  function appLibsReadyP() {
    function isLoaded(element, index, obj) {
      return (element.isLoaded === 'loaded');
    }
    return initAppLibs.every(isLoaded);
  }
  // function to check all external json data have loaded
  function musuemDataReadyP() {
    return (musuemData.length == initMusuemData.length);
  }

  // helper to put a status paragraph and append to the pages log area
  function addMessage(msg) {
    var paragraph = '<p class="message">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }
  //---------------------------------------------------------
  // MusuemApp - export PUBLIC functions and variables
  //---------------------------------------------------------
  return {
    musuemData: musuemData,
    defaultSearchLocation: defaultSearchLocation,
    // NOTE: for debug
    addMessage: addMessage
      // initAppLibs: initAppLibs,
      // initMusuemData: initMusuemData,
  };
  //---------------------------------------------------------
}(MusuemApp); // NOTE: function is an Immediately-Invoked Function Expression
// END MODULE MusuemApp

//----------------------------------------------
//   MusAppViewModel - Knockoutjs VIEWMODEL
//----------------------------------------------
var MusAppViewModel = function() {
  var self = this;
  console.log('musuemData');
  console.log(MusuemApp.musuemData[0]);
  // VaMarkerSummary(MusuemApp.musuemData[0]);
  //console.log(wordMapList(MusuemApp.musuemData[0]));
  MusuemApp.addMessage('viemodel called 😀');

  //---------------------------------------------------------------------------
  //     maps Model
  //---------------------------------------------------------------------------
  var mapsModel = {

    googleMap: false,
    searchLocMarker: null,
    // a map info window that will be reused to display different museum object details
    infowindow: new google.maps.InfoWindow({
      content: ''
    }),
    //-----------------------------------------------------
    //  KnockoutJS observable & observableArray variables
    //-----------------------------------------------------
    // obsUserLocalLocation is used to allow a button to set map to the browser geolocation
    // if service not allowed then button is not visible
    obsUserLocalLocation: ko.observable(false),
    // observable OBSERVABLE ARRAY for museum objects within selected place
    obsMusuemPlaceObjects: ko.observableArray(),
    // obsMuseumObjPlaces OBSERVABLE ARRAY for the V&A place markers on map
    obsMuseumObjPlaces: ko.observableArray(),
    // Search observables
    obsSearchGooglePlace: ko.observable(''),
  };

  // add knockout computed variables memebrs of mapsModel outside object literal definition
  // as referencing other ko.observables inside mapsModel not possible until mapsModel defined
  mapsModel.obsPlaceLabel = ko.pureComputed(function() {
    var place = mapsModel.obsSearchGooglePlace();
    if (place !== '') {
        return place.formatted_address;
    }
  });
  // END mapsModel
  //
  //-----------------------------------------------------
  // generic V&A musuem place object for
  // obsMuseumObjPlaces observable Array
  //-----------------------------------------------------
  var vaMuseumPlaceModel = function() {
    self = this;
    self.marker = {};
    self.geoLoc = {};
    self.pk = {};
  };
  //-----------------------------------------------------
  // generic V&A musuem model object for
  // obsMusuemObjects observable Array
  //-----------------------------------------------------
  var vaMuseumObjectModel = function() {
    self = this;
    self.marker = {};
    self.geoLoc = {};
    self.pk = {};
  };
  //-----------------------------------------------------
  //  map helpers MODULE
  //-----------------------------------------------------
  var mapHelpers = function() {

    var updateMapSearchLocation = function(place) {
      var newLoc = place.geometry.location;
      mapsModel.obsSearchGooglePlace = place;
      console.dir(place);
      map.setZoom(11);
      var marker = new google.maps.Marker({
        position: newLoc,
        map: map
      });
      mapsModel.infowindow.setContent(place.formatted_address);
      mapsModel.infowindow.open(map, marker);
      mapHelpers.centerMap(newLoc);
    };

    var mapGoLocal = function() {
      //// to do
    };

    // center map based on location
    var centerMap = function(loc) {
      map.setCenter(loc);
      google.maps.event.trigger(map, 'resize');
    };

    return {
      //-----------------------------------------------------
      // mapHelpers public functions
      //-----------------------------------------------------
      updateMapSearchLocation: updateMapSearchLocation,
      mapGoLocal: mapGoLocal,
      centerMap: centerMap
        //-----------------------------------------------------
    };

  }(mapHelpers);
  //-----------------------------------------------------

  // try and retrieve the users GEOLOCATION
  var getLocalLocation = function() {
    if ("geolocation" in navigator) {
      var startPos;
      var geoOptions = {
        maximumAge: 10 * 60 * 1000, // debug option: will return quicker if geoloc has been run in last 10mins
        timeout: 15 * 1000 // cancel try location if over 15 secs and no response
      };
      // GEOLOCATION success callback
      var geoSuccess = function(position) {
        startPos = position;
        MusuemApp.addMessage('got users local geolocation ' + startPos.coords.latitude + ' ' + startPos.coords.longitude);
        var lnglatLiteral = {
          lat: startPos.coords.latitude,
          lng: startPos.coords.longitude
        };
        // call google maps geocoder service to get place from lng lat
        mapsModel.geocoder.geocode({
          'location': lnglatLiteral
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              // local predicate function for JQuery.grep function - see below
              // iterates through the address types in each of the place objects returned by geocoder service
              // looking for postal code locations
              var postalCodeP = function(curElement, index) {
                //console.log('in test :', curElement, index);
                var curTypes = curElement.types;
                for (var i = 0; i < curTypes.length; i++) {
                  if (curTypes[i] === "postal_code") {
                    return true;
                  }
                }
                return false;
              };
              // try and get a more general postalcode type of addresses
              var postCodeResults = $.grep(results, postalCodeP);
              if (postCodeResults.length > 0) {
                var newPostCodePlace = postCodeResults[0];
                mapsModel.obsUserLocalLocation(newPostCodePlace);
              } else {
                // no postcode address available
                // so use first address in results as new place (usually a 'rooftop' type address)
                var newRoofTopPlace = results[0];
                mapsModel.obsUserLocalLocation(newRoofTopPlace);
              }
            } else {
              MusuemApp.addMessage('No local address results found');
            }
          } else {
            MusuemApp.addMessage('Google maps geocoder failed: ' + status);
          }
        });
      };
      // GEOLOCATION error callback
      var geoError = function(error) {
        var errorCodes = {
          0: 'inknown Error',
          1: 'permission denied',
          2: 'postion unavailable',
          3: 'timed out',
        };
        MusuemApp.addMessage('local location not found 😞 with error: ' + errorCodes[error]);
      };
      // try and get users geolocation from browser service
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
    }
  };
  //-----------------------------------------------------
  // Method to add custom knockout binding handlers
  //-----------------------------------------------------
  var koBindingHandlers = function() {
    // custom binding for address auto complete
    // code modified from book 'KnockoutJS by Example' by Adan Jaswal ISBN: 9781785288548

    // custom knockout binding handler for input autocomplete
    ko.bindingHandlers.addressAutoComplete = {
      init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // create the autocomplete object
        var autocomplete = new google.maps.places.Autocomplete(element, {
          types: ['geocode']
        });
        // when the user selects an address from the dropdown, populate the place in the model.
        // var value = valueAccessor();
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
          var place = autocomplete.getPlace();
          console.log('place from addressAutoComplete');
          console.dir(place);
          if (place.address_components !== undefined) {
            if (!place.geometry) {
              // if place has no geometry it cannot have a marker on the map
              console.log("Autocomplete's returned place contains no geometry");
              // exits handler
              return;
            }
            // update observable for google place for museum object search
            mapHelpers.updateMapSearchLocation(place);
          }
        });
      }
    };

    // custom knockout binding handler for MAP div
    ko.bindingHandlers.mapPanel = {
      init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        map = new google.maps.Map(element, {
          disableDefaultUI: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
          },
          mapTypeId: google.maps.MapTypeId.TERRAIN
        });
        mapsModel.googleMap = map; // debug helper
        mapsModel.geocoder = new google.maps.Geocoder(map);
        var request = {
          placeId: MusuemApp.defaultSearchLocation.placeSearchID
        };
        mapsModel.geocoder.geocode(request, placeIdCallback);

        function placeIdCallback(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            console.log('placeId Callback: ');
            var firstPlace = results[0];
            console.log('firstPlace:');
            console.dir(firstPlace);
            if (firstPlace) {
              // update observable for google place for museum object search
              mapHelpers.updateMapSearchLocation(firstPlace);
            }
          }
        }
        // zoom change event handler
        map.addListener('zoom_changed', function() {
          //mapsModel.infowindow.setContent('Zoom: ' + map.getZoom());
        });
        map.addListener('idle', function() {
          var bounds = map.getBounds();

          // Call you server with ajax passing it the bounds

          // In the ajax callback delete the current markers and add new markers

        });
      }
    };

    var mapWords = wordMapList(MusuemApp.musuemData[0]);

    var WordCloudOptions = {
      list: mapWords,
      gridSize: 1,
      weightFactor: 1,
      fontFamily: 'Times, serif',
      color: null,
      rotateRatio: 0.4,
      backgroundColor: '#ffe0e0',
      hover: window.drawBox,
    };

    // custom binding handler for WORDMAP div
    ko.bindingHandlers.wordCloud = {
      init: function(element, valueAccessor) {
        this.numClicks = ko.observable(0);
        // set click function for words and create wordCount object
        WordCloudOptions.click = function(item, dimension, event) {
          var name = item[0];
          var count = item[1];
        };
        WordCloud(element, WordCloudOptions);
      }
    };
  };

  // method to subscribe to place changes
  var koSubscribers = function() {
    // fire before place is changed
    mapsModel.obsPlaceLabel.subscribe(function(oldValue) {
      //removeMarker(oldValue);
      console.log('users place label was ');
      console.dir(oldValue);
    }, null, "beforeChange");
    // fire before local Location is changed
    mapsModel.obsUserLocalLocation.subscribe(function(oldValue) {
      //removeMarker(oldValue);
      //console.log('users local location  was ');
      //console.dir(oldValue);
    }, null, "beforeChange");
    // fire before google place is changed
    mapsModel.obsSearchGooglePlace.subscribe(function(placeVal) {
      //removeMarker(oldValue);
      console.log('fire new musuem data AJAX ');
      console.dir(placeVal);
      if (placeVal.geometry.viewport) {
        map.fitBounds(placeVal.geometry.viewport);
      } else {
        map.setCenter(placeVal.geometry.location);
        map.setZoom(11);
      }
      mapsModel.infowindow.setContent(placeVal.formatted_address);
      mapsModel.infowindow.open(map, marker);

    }, null, "change");
  };
  //-----------------------------------------------------
  //    museum data helper functions
  //-----------------------------------------------------
  function VaMarkerSummary(data) {
    console.log(data.meta.result_count + ' places found');
    for (var i = 0; i < data.records.length; i++) {
      var fields = data.records[i].fields;
      console.log(fields.name);
      console.log(' :- lng:' + fields.longitude + ' lat:' + fields.latitude);
      console.log(' ' + fields.type + ' ' + fields.museumobject_count + ' musuem objects');
      //console.log(fields.object + ' ' + fields.place.toUpperCase() + ' lat:' + fields.latitude + ' long:' + fields.longitude);
    }
  }

  function wordMapList(data) {
    var totalCount = data.records.length;
    var list = [];
    for (var i = 0; i < data.records.length; i++) {
      var fields = data.records[i].fields,
        name = fields.name,
        count = fields.museumobject_count;
      if (count !== 0) {
        // only use places that have some musuemObjects
        var item = [];
        item.push(name);
        item.push(count);
        list.push(item);
      }
    }
    console.log(list.length + ' items of ' + totalCount);
    return list;
  }

  //-----------------------------------------------------
  // configure custom Knockout
  koBindingHandlers();
  koSubscribers();
  // get users browsers location if service allowed
  // will enable button in UI to go to user local location when pressed
  getLocalLocation();

  //---------------------------------------------------------
  // MusAppViewModel - export PUBLIC functions and variables
  //---------------------------------------------------------
  return {
    // maps viewmodel
    mapsModel: mapsModel,
    mapHelpers: mapHelpers
  };
  //---------------------------------------------------------
};
// END MODULE MusAppViewModel
