//---------------------------------------------------------
//    MusuemApp MODULE
//---------------------------------------------------------

var MusuemApp = (function(window) {
  var MusuemViewModel = {};
  var musuemData = [];

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

  var initMusuemData = [{
    placeID: "ChIJ83WZp86p2EcRbMrkYqGncBQ", // Greenwich observatory UK, google PlaceID
    name: 'V&A Museum Collection - places with musuemobjects, 10km radius from Greenwich, uk',
    dataType: 'json',
    search_parameters: {
      latitude: 51.479052,
      longitude: -0.011074,
      orderby: "distance", // order results by closest distance to search loc
      radius: 10, //radius in km around loc to search for musuem collection.places
      images: 1, // only results that have photos
      limit: 12 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
    },
    url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
    isLoaded: 'no'
  }];

  //-------------------
  //  MUSUEM APP init
  //-------------------
  // inital musuemData initially [] or actual musuemData from localStorage if present
  function init(initalPlaceRef, InitalMusuemData) {
    //---------------------------------------------------------
    // get AJAX script resources for app
    addMessage('AJAX ' + initAppLibs.length + ' app script libraries ...');
    $.each(initAppLibs, initGetAppResources);
    //---------------------------------------------------------
    musuemData = InitalMusuemData;
    if (musuemData.length === 0) {
      // we have no musuem data from localStorage ;
      // so get data use an array of Victoria & Albert museum REST service requests
      // (only one initial request at moment but can be multiple requests)
      //---------------------------------------------------------
      // get AJAX Musuem Object place resources for app
      addMessage('AJAX ' + initMusuemData.length + ' app musuem data ...');
      $.each(initMusuemData, initGetAppResources);
      //---------------------------------------------------------
    }
  }
  //-------------------
  // END init
  //-------------------

  function initGetAppResources(index, resourceRefObj) {
    //  load AJAX an external javascript or json data resource
    var request = $.ajax({
      url: resourceRefObj.url,
      type: "GET",
      data: resourceRefObj.search_parameters,
      dataType: resourceRefObj.dataType,
      timeout: (1 * 10000) // 10 second timeout on getting a resource for app
    });
    // GET AJAX DONE callback
    request.done(function(data, textStatus, jqXHR) {
      resourceRefObj.isLoaded = 'loaded';
      if (resourceRefObj.dataType === 'json') {
        // when JSON data returned it will be musuem data
        var museumCollectionData = {
          googlePlaceID: resourceRefObj.placeID,
          musuemCollectionType: 'place',
          data: data
        };
        if (MusuemViewModel.initdata === undefined) {
          MusuemViewModel.initdata = museumCollectionData;
        } else {
          MusuemViewModel.initdata.push(museumCollectionData);
        }
        // add musuemData to browsers localStorage
        localStorage.setItem("musuemData", JSON.stringify(museumCollectionData));
        addMessage('😀 ' + resourceRefObj.name);
        addMessage('😀 musuemData added to local storage: ' + textStatus);
      } else {
        // when script resource
        addMessage(resourceRefObj.name + ' 😀 loaded  with status: ' + textStatus);
      }
      //-----------------------------------------------------------------
      // NOTE: on resource load success, try to initalise the museum app,
      // this can only happen when all app script libraries and are ready
      //-----------------------------------------------------------------
      if (appLibsReadyP() && musuemDataReadyP()) {
        MusuemViewModel.initdata = localStorage.musuemData;
        // initialsing Knockout viewmodel
        ko.options.deferUpdates = true;
        var vm = new MusAppViewModel();
        // apply KNOCKOUT bindings - should only be done once
        ko.applyBindings(vm);
        // NOTE: debug aid - can be commented out and app will still function
        MusuemViewModel.vm = vm;
        MusuemViewModel.status = true;
        addMessage(' 😀 initialised viewmodel');
      }
      //-----------------------------------------------------------------------
    });
    // GET AJAX FAIL callback e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      // set the reqs 'isLoaded' key in appReqs to show not loaded
      resourceRefObj.isLoaded = 'failed';
      addMessage(obj.name + ' 😞 not loaded with error: ' + errorThrown);
    });
    // GET AJAX ALLWAYS callback
    request.always(function(jqXHR, textStatus, errorThrown) {
      //console.log(obj.name + ' ' + textStatus + ' ' + errorThrown);
    });
  }
  //-----------------------------------------------------------------------

  function isLoaded(element, index, obj) {
    return (element.isLoaded === 'loaded');
  }

  // function to check all external javascript libraries have loaded
  function appLibsReadyP() {
    return initAppLibs.every(isLoaded);
  }

  // function to check all external json data have loaded
  function musuemDataReadyP() {
    return initMusuemData.every(isLoaded);
  }

  // helper to put a status paragraph and append to the pages log area
  function addMessage(msg) {
    var paragraph = '<p class="message">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }

  //----------------------------------------------------------------------------
  //   MusAppViewModel - Knockoutjs VIEWMODEL
  //----------------------------------------------------------------------------
  var MusAppViewModel = function() {
    //---------------------------
    //  maps Model
    //---------------------------
    var mapsModel = {
      // a re-usable marker to indicate the center of the musuemObject search
      searchLocMarker: null,
      // a map info window that will be reused to display different museum object details
      infowindow: new google.maps.InfoWindow({
        content: ''
      }),
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      placeName: ko.observable('typograph'),

      obsCurrentSearchPlaceId: ko.observable(),

      // obsUserLocalLocation is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalLocation: ko.observable(false),
      // observable OBSERVABLE ARRAY for museum objects within selected place
      obsMusuemPlaceObjects: ko.observableArray(),
      // obsMuseumObjPlaces OBSERVABLE ARRAY for the V&A place markers on map
      obsMuseumObjPlaces: ko.observableArray(),
      // google map place observable - is the geolocation for the musuemPlace search radius
      obsSearchGooglePlace: ko.observable(null)
    };

    // add knockout computed variables outside object literal definition of mapsModel
    // as referencing other ko.observables inside mapsModel not possible until defined
    mapsModel.obsPlaceLabel = ko.pureComputed(function() {
      var place = mapsModel.obsSearchGooglePlace();
      return (place === null) ? '' : simpleFormattedplaceIdName(place);
    });
    // END mapsModel
    //---------------------------------------------------------------------------

    var simpleFormattedplaceIdName = function(place) {
      if (place.hasOwnProperty('name')) {
        return place.name;
      } else {
        if (place.types[0] === 'postal_code') {
          var simplePostCodeName = place.address_components[1].long_name + ', ' + place.address_components[0].long_name;
          return simplePostCodeName;
        } else {
          var simpleFormatName = place.address_components[0].long_name + ', ' + place.address_components[1].long_name;
          return simpleFormatName;
        }
      }
    };

    //-----------------------------------------------------
    //  map helpers MODULE
    //-----------------------------------------------------
    var mapHelpers = function() {

      var pinMaker = function pinSymbol(color) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
          fillColor: color,
          fillOpacity: 0.5,
          strokeColor: 'salmon',
          strokeWeight: 4,
          scale: 1,
        };
      };

      var updateMapSearchLocation = function(place) {
        //--------------------------------------------------------------------
        // update mapsModel observable with new place from google place search
        //--------------------------------------------------------------------
        mapsModel.obsSearchGooglePlace(place);
        //-----------------------------------------------------
        // request V&A REST service for new museum Object places
        //-----------------------------------------------------
        console.dir(mapsModel.obsSearchGooglePlace());
        console.log('😀 start new V&A musuem place request for place ' + mapsModel.obsSearchGooglePlace.place_id);
      };

      var updateMapPlace = function(place) {
        //--------------------------------------------------------------------
        // update map for new place
        //--------------------------------------------------------------------
        // fitBounds or map zoom and center
        var newLoc = place.geometry.location;
        var addressText = place.formatted_address;
        if (place.geometry.viewport) {
          map.fitBounds(place.geometry.viewport);
        } else {
          map.setCenter(place.geometry.location);
          map.setZoom(13); // kind of city/town view bounds
        }
        // reposition and show the map searchLocMarker
        if (mapsModel.searchLocMarker !== null) {
          mapsModel.searchLocMarker.setOptions({
            position: place.geometry.location,
            title: addressText,
            visible: true
          });
        }
        // set the content and show map infowindow
        mapsModel.infowindow.setContent(addressText);
        mapsModel.infowindow.open(map, mapsModel.searchLocMarker);
      };

      var mapGoLocal = function() {
        // note: users geolocation was converted and stored as a valid google maps place
        // update search location observable to be the same as users geolocation
        updateMapSearchLocation(mapsModel.obsUserLocalLocation());
        updateMapPlace(mapsModel.obsUserLocalLocation());
      };

      // center map on location
      var centerMap = function(loc) {
        map.setCenter(loc);
        google.maps.event.trigger(map, 'resize');
      };

      return {
        // mapHelpers public functions
        updateMapSearchLocation: updateMapSearchLocation,
        mapGoLocal: mapGoLocal,
        //centerMap: centerMap,
        pinMaker: pinMaker,
        updateMapPlace: updateMapPlace
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

      ko.bindingHandlers.fadeInText = {
        update: function(element, valueAccessor) {
          $(element).hide();
          ko.bindingHandlers.text.update(element, valueAccessor);
          $(element).fadeIn();
        }
      };

      // custom knockout binding handler for address autocomplete
      // code modified from example in 'KnockoutJS by Example' by Adan Jaswal ISBN: 9781785288548
      ko.bindingHandlers.addressAutoComplete = {

        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          ////////////////////////////////////////////////////
          var serviceOptions = {
            input: 'chester, uk',
            types: ['geocode']
          };
          var autocompletePlaceService = new google.maps.places.AutocompleteService();

          var displaySuggestions = function(predictions, status) {
            if (status != google.maps.places.PlacesServiceStatus.OK) {
              alert(status);
              return;
            }
            var LabelText = (predictions[0].description);
            console.log('first prediction for autoplace ' + LabelText);
          };
          autocompletePlaceService.getQueryPredictions(serviceOptions, displaySuggestions);
          ////////////////////////////////////////////////////

          // create the autocomplete object
          var options = {
            types: ['geocode'], // only autocomplete addresses not general business type keyword search
            selectFirst: true
          };
          var autocomplete = new google.maps.places.Autocomplete(element, options);
          // add event Listener for when the user selects address from the autocomplete dropdown
          google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
            // if place is same paceID as currently displayed place do nothing
            if (place.place_id == mapsModel.obsCurrentSearchPlaceId()) {
              // exit function
              return;
            } else {
              // if the autocomplete place has data already in musuemData array do not call a new REST request

            }
            if (place.address_components !== undefined) {
              if (!place.geometry) {
                // if place has no geometry it cannot have a marker on the map, so exit
                console.log("Autocomplete's returned place contains no geometry");
                // exits handler
                return;
              }
              // update observable for google place for museum object search
              mapHelpers.updateMapSearchLocation(place);
            }
          });
        },

        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var value = valueAccessor();
          var valueUnwrapped = ko.unwrap(value);
          console.log('is:' + valueUnwrapped);
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
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            center: new google.maps.LatLng(51.478771, -0.011074),
            zoom: 1 // the whole world map before we have musuem data
          });

          mapsModel.googleMap = map; // debug helper
          mapsModel.geocoder = new google.maps.Geocoder(map);
          // var requestPlaceId = {
          //   placeId: MusuemApp.defaultSearchLocation.placeSearchID
          // };
          // // request a google place from geocoder service
          // mapsModel.geocoder.geocode(requestPlaceId, placeIdSucessCallback);
          //
          // function placeIdSucessCallback(results, status) {
          //   if (status === google.maps.GeocoderStatus.OK) {
          //     var firstPlace = results[0];
          //     if (firstPlace) {
          //       // create a reusable map marker to show search location
          //
          //       mapsModel.searchLocMarker = new google.maps.Marker({
          //         map: map,
          //         visible: false,
          //         icon: mapHelpers.pinMaker("yellow"),
          //         clickable: false // prevent mouse click events
          //       });
          //       // update observable for google place for museum object search
          //       mapHelpers.updateMapSearchLocation(firstPlace);
          //     }
          //   }
          // }
          // map zoom change event handler
          map.addListener('zoom_changed', function() {
            var zoomLevel = map.getZoom();
            mapsModel.infowindow.setContent('Zoom: ' + map.getZoom());
          });
          // map idle change event handler
          // map.addListener('idle', function() {
          //   var bounds = map.getBounds();
          //
          // });
        }
      };

      // var mapWords = function() {
      //   var noMusuemData = [
      //     ['no data', 1]
      //   ];
      //   // if (MusuemApp.musuemData !== []) {
      //   //   if (typeof(MusuemApp.musuemData == 'array')) {
      //   //     return wordMapList(MusuemApp.musuemData[0]);
      //   //   }
      //   // }
      //   return noMusuemData;
      // };
      //
      // var WordCloudOptions = {
      //   list: mapWords(),
      //   gridSize: 1,
      //   weightFactor: 1,
      //   fontFamily: 'Times, serif',
      //   color: null,
      //   rotateRatio: 0.4,
      //   backgroundColor: '#ffe0e0',
      //   hover: window.drawBox,
      // };
      //
      // // custom binding handler for WORDMAP div
      // ko.bindingHandlers.wordCloud = {
      //   init: function(element, valueAccessor) {
      //     this.numClicks = ko.observable(0);
      //     // set click function for words and create wordCount object
      //     WordCloudOptions.click = function(item, dimension, event) {
      //       var name = item[0];
      //       var count = item[1];
      //     };
      //     WordCloud(element, WordCloudOptions);
      //   }
      // };
    };

    // method to subscribe to observerable changes
    var koSubscribers = function() {
      // for event BEFORE obsPlaceLabel changed
      mapsModel.obsPlaceLabel.subscribe(function(oldValue) {
        // TODO:
      }, null, "beforeChange");

      // event for BEFORE obsUserLocalLocation changed
      mapsModel.obsUserLocalLocation.subscribe(function(oldValue) {
        // TODO:
      }, null, "beforeChange");

      // event for AFTER obsSearchGooglePlace changed
      // thats is, a new place has been got from google api callback
      mapsModel.obsSearchGooglePlace.subscribe(function(placeValue) {
        // google search place has changed so start AJAX get for new musuem objects
        //var places = MusuemApp.initGetAppResources();
        mapHelpers.updateMapPlace(mapsModel.obsSearchGooglePlace());
        // update mapsModel observable with unique placeID
        mapsModel.obsCurrentSearchPlaceId(placeValue.place_id);
      }, null, "change");
    };

    //-----------------------------------------------------
    //    museum data helper functions
    //-----------------------------------------------------
    function VaMarkerSummary(dataArray) {
      console.dir(dataArray);
      var data = dataArray[0];
      console.log(data.meta.result_count + ' places found');
      for (var i = 0; i < data.records.length; i++) {
        var musObj = data.records[i];
        console.log(musObj.model);
        console.log(musObj.fields.name);
        console.log(' :- lng:' + musObj.fields.longitude + ' lat:' + musObj.fields.latitude);
        console.log(' ' + musObj.fields.type + ' ' + musObj.fields.museumobject_count + ' musuem objects');
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
          // push item onto list
          list.push(item);
        }
      }
      console.log('wordMap ' + list.length + ' items of ' + totalCount);
      return list;
    }

    //-----------------------------------------------------
    // configure custom Knockout
    koBindingHandlers();
    koSubscribers();
    // get users browsers location if service allowed
    // will enable button in UI to go to user local location when pressed
    getLocalLocation();

    return {
      // export PUBLIC functions and variables for MusAppViewModel -
      mapsModel: mapsModel,
      mapHelpers: mapHelpers
    };
    //---------------------------------------------------------
  };
  // END MODULE MusAppViewModel
  //---------------------------------------------------------

  return {
    // MusuemApp - export PUBLIC functions and variables
    MusuemViewModel: MusuemViewModel,
    init: init,
    musuemData: musuemData,
    // NOTE: for debug aid
    addMessage: addMessage
    // initAppLibs: initAppLibs,
  };
  // END MODULE MusuemApp
  //---------------------------------------------------------
})();

//---------------------------------------------------------
// JQuery Bootstrap APP when document is ready
//---------------------------------------------------------
$(function() {
  var initPlaceRef = {
    placeSearchID: "ChIJ83WZp86p2EcRbMrkYqGncBQ", // Greenwich observatory UK, google PlaceID
    placeSearchLoc: {
      lat: 51.479052,
      lng: -0.011074
    } // Greenwich observatory UK loc
  };
  var musuemData = [];
  // check if localStorage is supported by browser
  if (typeof(Storage) !== "undefined") {
    // and if some museumData exists in localStorage from previous app run
    if (localStorage.musuemData) {
      // rehydrate the instant musuemData into the array
      musuemData = (JSON.parse(localStorage.getItem("musuemData")));
      console.log('got some existing musuemData from localStorage');
    } else {
      console.log('no existing musuemData in localStorage, will init data using google placeID object location ' + initPlaceRef.placeSearchID);
    }
  }
  // call app init with inital placeID - Greenwich, UK
  MusuemApp.init(initPlaceRef, musuemData);
});
//---------------------------------------------------------
