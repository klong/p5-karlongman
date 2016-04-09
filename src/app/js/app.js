//---------------------------------------------------------
//    MusuemApp MODULE
//---------------------------------------------------------

var MusuemApp = (function(window) {
  var MusuemViewModel = {
    status: false
  };
  var musuemData = {};
  var musuemDataReady = {
    status: false
  };
  //----------------------------------------------------------------------------
  // initAppLibs array defines external script need before our app can run
  //----------------------------------------------------------------------------
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
  // {
  //   // wordcloud2 api
  //   name: 'wordcloud2',
  //   dataType: 'script',
  //   url: '/js/library/wordcloud2.js',
  //   isLoaded: 'no'
  // }

  //----------------------------------------------------------------------
  // initMusuemData defines the JSON data we need before our app can run
  //----------------------------------------------------------------------
  var initMusuemData = [{
    placeID: "ChIJJc-4yymo2EcRwqZo5HwjGEk", // London Borough of Lewisham UK, google PlaceID
    placeName: 'Greenwich, uk',
    name: 'V&A places with musuem objects, 10km around Greenwich observatory UK',
    modelCollection: 'place',
    dataType: 'json',
    search_parameters: {
      latitude: 51.479052,
      longitude: -0.011074,
      orderby: "distance", // order results by closest distance to search loc
      radius: 10, //radius in km around loc to search for musuem collection.places
      limit: 45 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
    },
    url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
    isLoaded: 'no'
  }, {
    placeID: "ChIJXWE9EuyNcUgRYKOZ1COLDQQ", // City of Bristol, UK, google PlaceID
    placeName: 'Bristol, uk',
    name: 'V&A places with musuem objects, 10km around Bristol, UK',
    modelCollection: 'place',
    dataType: 'json',
    search_parameters: {
      latitude: 51.468468,
      longitude: -2.6609199,
      orderby: "distance", // order results by closest distance to search loc
      radius: 10, //radius in km around loc to search for musuem collection.places
      limit: 45 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
    },
    url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
    isLoaded: 'no'
  }];

  function localStorageP() {
    // function test for localStorage browser service and not disabled by user
    var storage = !! function() {
      var result;
      var uid = +new Date();
      try {
        localStorage.setItem(uid, uid);
        result = localStorage.getItem(uid) == uid;
        localStorage.removeItem(uid);
        return result;
      } catch (exception) {}
    }() && localStorage;
    return storage;
  }

  //-------------------
  //  init MUSUEM APP
  //-------------------
  function init(initalPlaceRef) {
    // add a property to viewmodel obj to use when binding the map in the knockout vm
    MusuemViewModel.startMapPlaceRef = initalPlaceRef;
    //-----------------------------------
    // get AJAX JAVASCRIPT resources
    //-----------------------------------
    $.each(initAppLibs, getAsyncResource);
    // for (var obj in initAppLibs) {
    //   getAsyncResource(initAppLibs[obj]);
    // }
    addMessage('AJAX javascript LOAD REQUESTS : ' + initAppLibs.length);
    //---------------------------------------------------------
    // get JSON resources required for musuem app
    //---------------------------------------------------------
    if (localStorageP()) {
      if (localStorage.musuemDataStorage) {
        console.log('GOT SOME LOCAL musuemDataStorage');
        // have some exisiting localStorage.musuemDataStorage
        // rehydrate the local stringify stored JSON data
        // NOTE: needed to add new property on musuemData obj for this to work ??
        musuemData.data = JSON.parse(localStorage.musuemDataStorage);
        // add property to musuemData object to store JSON data
        musuemDataReady.status = true;
      } else {
        // no exisitng museum data in localstorage
        //---------------------------------
        //  get AJAX JSON data resources
        //---------------------------------
        $.each(initMusuemData, getAsyncResource);
        addMessage('localStorage musuemDataStorage not present');
        addMessage('AJAX Musuem Data LOAD REQUESTS : ' + initMusuemData.length);
      }
    } else {
      // localStorage service not available or disabled by user
      // so get AJAX JSON data resources
      //---------------------------------
      $.each(initMusuemData, getAsyncResource);
      console.log('localstorage: FALSE');
      addMessage('AJAX Musuem Data LOAD REQUESTS : ' + initMusuemData.length);
    }
  }
  //-------------------
  // END init
  //-------------------

  function getAsyncResource(index, resourceRefObj) {
    // AJAX ASYNC load external resource
    var request = $.ajax({
      url: resourceRefObj.url,
      type: "GET",
      data: resourceRefObj.search_parameters,
      dataType: resourceRefObj.dataType,
      timeout: (1 * 10000) // 10 second timeout on getting a resource for app
    });
    // GET AJAX DONE async callback
    request.done(function(resultData, textStatus, jqXHR) {
      // set init resource parameter to show load success
      resourceRefObj.isLoaded = 'loaded';
      if (resourceRefObj.dataType === 'json') {
        //-----------------------------------------------
        // got a JSON musuem data resource
        // setup a new object literal to store musuem data
        var museumCollectionDataObj = {
          resourceRefObj: resourceRefObj,
          musuemCollectionType: resourceRefObj.modelCollection,
          musuemData: resultData
        };
        storeMusuemData(resourceRefObj.modelCollection, museumCollectionDataObj);
      }
      //------------------------------------------------------------------------------
      // sorry, this code below seems a bit of hack to handle both the async callbacks and
      // requirement to only create and applyBindings to the knockout viewModel once
      // NOTE: so on load resource success, we try to initalise the museum app,
      // this can only happen when all required scripts and musuemData for app have loaded
      //------------------------------------------------------------------------------
      if (!MusuemViewModel.status) { // skip the tests if the app viewmodel exists
        initViewModelP();
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
      addMessage('😀 ' + resourceRefObj.name + ' :- AJAX ' + resourceRefObj.dataType + ' ' + textStatus);
    });
  }

  function initViewModelP () {
    // only if All scripts and musuem data resources for the app are loaded
    if (appLibsReadyP() && musuemDataReadyP()) {
      musuemDataReady.status = true;
      addMessage('😀 Musuem App RESOURCES READY');
      //-----------------------------------
      // create Knockout options & APP VIEWMODEL
      ko.options.deferUpdates = true;
      var vm = new MusAppViewModel();
      MusuemViewModel.vm = vm;
      //-----------------------------------
      // apply bindings APP VIEWMODEL
      ko.applyBindings(MusuemViewModel.vm);
      MusuemViewModel.status = true;
      addMessage(' 😀 viewmodel READY');
      return true;
    } else {
      return false;
    }
  }

  function storeMusuemData (storageName, museumCollectionDataObj) {
    // keep museumCollectionDataObj for app use
    if (!musuemData.data) {
      // make a new 'data' array object property on musuemData to store musuem data
      musuemData.data = {};
      // store in new musuem data property
      musuemData.data[storageName] = [];
      musuemData.data[storageName].push(museumCollectionDataObj);
    } else {
      if (musuemData.data.hasOwnProperty(storageName)) {
        // append the musuem data onto exisiting array property
        musuemData.data[storageName].push(museumCollectionDataObj);
      } else {
        musuemData.data[storageName] = [];
        musuemData.data[storageName].push(museumCollectionDataObj);
      }
    }
  }
  //-----------------------------------------------------------------------

  function isLoaded(element, index, obj) {
    return (element.isLoaded === 'loaded');
  }

  // function to check all external javascript libraries have loaded
  function appLibsReadyP() {
    return initAppLibs.every(isLoaded);
  }

  // function to check if localStorage present or all external json data loaded
  function musuemDataReadyP() {
    if (musuemDataReady.status || initMusuemData.every(isLoaded)) {
      //--------------------------------------------------------------
      // store array of musuem data resources objects in localStorage
      //--------------------------------------------------------------
      // localStorage is avaiable and not user disabled so store
      // app int musuem data for future app runs
      if (localStorageP()) {
        if (!localStorage.musuemDataStorage) {
          // when no existing localStorage.musuemDataStorage
          // save stringified version of musuemdata obj for future app runs
          localStorage.musuemDataStorage = JSON.stringify(musuemData.data);
        }
      }
      return true;
    } else {
      return false;
    }
  }

  // helper function to append a status paragraph to webpage log area
  function addMessage(msg) {
    var paragraph = '<p class="message">' + msg + '</p>';
    $('#log-area').append(paragraph);
  }

  //----------------------------------------------------------------------------
  //  Musuem App VIEWMODEL creator
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
      mapMarkers: [], // array to store all map marker objects
      placeTypeInPrefOrder: ["administrative_area_level_3", "administrative_area_level_2", "postal_town", "neighborhood"],
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      placeName: ko.observable('typograph'),
      // google map place observable - the geolocation for the musuemPlace search radius
      obsSelectedPlace: ko.observable(null),
      // obsUserLocalPlace is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalPlace: ko.observable(null),
      // observable OBSERVABLE ARRAY for museum objects within selected place
      obsMusuemMarkerObjects: ko.observableArray([]),
      // // obsMuseumObjPlaces OBSERVABLE ARRAY for the V&A place markers on map
      // obsMuseumObjPlaces: ko.observableArray()
    };

    // add knockout computed variables outside object literal definition of mapsModel
    // as referencing other ko.observables inside mapsModel not possible until defined
    mapsModel.compPlaceLabel = ko.pureComputed(function() {
      var place = mapsModel.obsSelectedPlace();
      return (place === null) ? '' : simpleFormattedplaceIdName(place);
    });

    mapsModel.compCurrentPlaceId = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSelectedPlace();
      // update mapsModel observable with unique placeID
      return (curSearchPlace === null) ? '' : curSearchPlace.place_id;
    });

    mapsModel.compCurrentPlaceIdLngLat = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSelectedPlace();
      // update mapsModel observable with location
      return (curSearchPlace === null) ? '' : mapsModel.obsSelectedPlace().geometry.location;
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
    //  musuemDataHelpers MODULE
    //-----------------------------------------------------
    var musuemDataHelpers = function() {

      function getMusuemPlaces (preferedPlace) {
        console.log('getMusuemPlaces');
        console.dir(preferedPlace);
        var index = 0; // NOTE needed as first argument to getAsyncResource function
        var resourceName = 'V&A collection.places, 10km around ' + preferedPlace.formatted_address;
        var resourceRefObj = {
          placeID: preferedPlace.place_id, // a google PlaceID
          placeName: preferedPlace.formatted_address,
          name: resourceName,
          modelCollection: 'place',
          dataType: 'json',
          search_parameters: {
            latitude: preferedPlace.geometry.location.lat,
            longitude: preferedPlace.geometry.location.lng,
            orderby: "distance", // order results by closest distance to search loc
            radius: 10, //radius in km around loc to search for musuem collection.places
            limit: 45 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
          },
          url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
          isLoaded: 'no'
        };
        //------------------------------------------
        // Async call for REST musuem data
        getAsyncResource(index, resourceRefObj);
        //------------------------------------------
      }

      function getMusuemPlaceObjects () {
        console.log('getMusuemPlaceObjects');
      }

      return {
        getMusuemPlaces: getMusuemPlaces,
        getMusuemPlaceObjects: getMusuemPlaceObjects
      };
    }(musuemDataHelpers);
    //  END musuemDataHelpers MODULE
    //-----------------------------------------------------

    //-----------------------------------------------------
    //  mapHelpers MODULE
    //-----------------------------------------------------
    var mapHelpers = function() {

      var pinMaker = function pinSymbol(colour) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
          fillColor: colour,
          fillOpacity: 0.5,
          strokeColor: 'salmon',
          strokeWeight: 4,
          scale: 1,
        };
      };

      var selectPlace = function(place) {
        mapsModel.obsSelectedPlace(place);
        //-----------------------------------------------------
        // request V&A REST service for new museum Object places
        //-----------------------------------------------------
        //console.dir(mapsModel.obsSelectedPlace());
        //console.log('😀 start new V&A musuem place request for place ' + mapsModel.obsSelectedPlace.place_id);
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
          //map.setZoom(13); // kind of city/town view bounds
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
        var localCoords = mapsModel.obsUserLocalPlace().geoPosition.coords;
        var localPos = {
          lat: localCoords.latitude,
          lng: localCoords.longitude
        };
        console.log('pppp ---');
        centerMap(localPos);
      };

      var panMapToPlace = function(place) {
        map.panTo(place.geometry.location);
        //map.setCenter(place.geometry.location);
        map.fitBounds(place.geometry.viewport);
        google.maps.event.trigger(map, 'resize');
      };

      // center map on location
      var centerMap = function(loc) {
        map.setCenter(loc);
        google.maps.event.trigger(map, 'resize');
      };

      //--------------------------------------------------------------------------------
      // Function: makePreferedPlaceMarker - make a map marker to hold all musuem data
      //--------------------------------------------------------------------------------
      var makePreferedPlaceMarker = function(bestPlace) {
        // create a map marker for bestPlace
        var marker = new google.maps.Marker({
          position: bestPlace.geometry.location,
          map: map,
          icon: mapHelpers.pinMaker("yellow"),
          id: bestPlace.place_id
        });
        marker.metadata = {
          // store the prefered place in its marker's metadata
          place: bestPlace,
          musuemPlaces: {} // object property for async musuem REST data
        };
        // add click handler to marker
        marker.addListener('click', function(e) {
          var myPlace = marker.metadata.place;
          var content = myPlace.types[0] + ' ' + myPlace.formatted_address + ' ' + marker.id;
          content = content + ' ' + myPlace.geometry.location;
          mapsModel.infowindow.setContent(content);
          mapsModel.infowindow.open(map, marker);
        });
        // add marker to vm observableArray - which display it in the place list
        mapsModel.obsMusuemMarkerObjects.push(marker);
        // add marker to mapMarkers array to track it for disposal etc
        mapsModel.mapMarkers.push(marker);

        // TODO open infowindow to show some debug data
        var infoContent = ".. getting musuem places";
        mapsModel.infowindow.setContent(infoContent);
        mapsModel.infowindow.open(map, marker); // display marker on map
        // 1. Async get up to 45 places based on bestPlace location
        musuemDataHelpers.getMusuemPlaces(bestPlace);
        // 2. Async get up to 45 musuem objects from bestPlace location
        musuemDataHelpers.getMusuemPlaceObjects(bestPlace);
        // note: (REST results are ordered by distance from marker location)
      };
      //-------------------------------------------------------------

      function searchHere(location) {
        var map = mapsModel.googleMap;
        // use geocoder to find the preferred place
        mapsModel.geocoder.geocode({
          'location': location,
          'bounds': map.bounds // bias the search results to the visible area of map
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              var peferedPlaceP = function(curElement, index) {
                // local function used by JQuery.grep function - see below
                // iterates through the address types in the google places returned by geocoder service
                // and looks for prefereed types of addresses
                var curTypes = curElement.types;
                for (var i = 0; i < curTypes.length; i++) {
                  var place = curTypes[i];
                  var count = mapsModel.placeTypeInPrefOrder.indexOf(place);
                  if (count !== -1) {
                    return true;
                  }
                }
                return false;
              };
              // try and get prefered type of addresses if possible
              // as more general place name better for collecting together the museun objectplaces
              var bestPlaceResults = $.grep(results, peferedPlaceP);
              var bestPlace = null;
              if (bestPlaceResults.length > 0) {
                // use prefered place
                bestPlace = bestPlaceResults[0];
              } else {
                // there is no preferred address available so
                // use the first address in the geocode results (usually a 'rooftop' type place)
                console.log('no peferedPlaceP address');
                bestPlace = results[0];
              }
              if (true) {
                // prefered place has existing marker
              }
              // create a new map marker
              makePreferedPlaceMarker(bestPlace);
            } else {
              window.alert('No results found');
            }
          } else {
            window.alert('Geocoder failed due to: ' + status);
          }
        });

      }
      //-----------------------------------------------------
      //  mapHelpers - public vars & functions
      //-----------------------------------------------------
      return {
        selectPlace: selectPlace,
        mapGoLocal: mapGoLocal,
        searchHere: searchHere,
        centerMap: centerMap,
        pinMaker: pinMaker,
        updateMapPlace: updateMapPlace,
        panMapToPlace: panMapToPlace
      };
    }(mapHelpers);
    //  END mapHelpers MODULE
    //-----------------------------------------------------

    // try and retrieve the users GEOLOCATION and then upscale to a preferred google place
    var getUsersLocalPlace = function() {
      if ("geolocation" in navigator) {
        var startPos;
        var geoOptions = {
          maximumAge: 10 * 60 * 1000, // debug option: will return quicker if geoloc has been run in last 10mins
          timeout: 15 * 1000 // timeout call if over 15 secs and no success
        };
        // callback function to set mapsModel.obsUserLocalPlace
        var geoSuccess = function(geoPosition) {
          // create and store a new object & property for the users current geoposition
          mapsModel.obsUserLocalPlace({
            geoPosition: geoPosition
          });
        };
        // GEOLOCATION error callback
        var geoError = function(error) {
          MusuemApp.addMessage('local location not found 😞 with error: ' + geolocationErrorCodes[error]);
        };
        var geolocationErrorCodes = {
          0: 'inknown Error',
          1: 'permission denied',
          2: 'postion unavailable',
          3: 'timed out',
        };
        // try and get users geolocation from browser service
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
      }
    };
    //-----------------------------------------------------
    // Method to add custom knockout binding handlers
    //-----------------------------------------------------
    var koBindingHandlers = function() {

      // debug helper that jquery fades text in/out when its binding value changes
      ko.bindingHandlers.fadeInText = {
        update: function(element, valueAccessor) {
          $(element).hide();
          ko.bindingHandlers.text.update(element, valueAccessor);
          $(element).fadeIn();
        }
      };

      // custom knockout binding handler for GOOGLE MAP
      ko.bindingHandlers.mapPanel = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          // default map display location
          if (mapsModel.mapMarkers) {
            console.dir(mapsModel.mapMarkers);
            if (mapsModel.mapMarkers.length > 0) {
              // default location is first marker in mapMarkers
              var firstPlace = mapsModel.mapMarkers[0].metadata.place;
              console.log('ppopoppoppp');
              console.dir(firstPlace);
              mapHelpers.selectPlace();
            }
          }

          map = new google.maps.Map(element, {
            scaleControl: true,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            center: new google.maps.LatLng(51.478771, -0.011074),
            zoom: 1 // the whole world map show by default
          });
          mapsModel.googleMap = map; // debug helper
          mapsModel.geocoder = new google.maps.Geocoder(map);
          // Create a DIV to hold custom map control and call the CenterControl()
          // constructor passing in this DIV.
          var centerControlDiv = document.createElement('div');
          var centerControl = new CenterControl(centerControlDiv, map);
          centerControlDiv.index = 1; // on top of other controls (e.g later added markers)
          map.controls[google.maps.ControlPosition.CENTER].push(centerControlDiv);
          // TODO default location when app first run will be the first place in the musuem place data

          //map zoom change event handler
          map.addListener('zoom_changed', function() {
            var zoomLevel = map.getZoom();
            mapsModel.infowindow.setContent('Zoom: ' + map.getZoom());
          });
          //map idle change event handler
          map.addListener('idle', function() {
            //var bounds = map.getBounds();
          });
          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
          });
        }
      };

      // NOTE CenterControl code from
      // example https://developers.google.com/maps/documentation/javascript/examples/control-custom
      function CenterControl(controlDiv, map) {
        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = 'rgba(255,255,255,0.75)';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '6px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'search for musuem objects';
        controlDiv.appendChild(controlUI);
        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '14px';
        controlText.style.lineHeight = '38px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';
        controlText.innerHTML = 'Search Here';
        controlUI.appendChild(controlText);
        // Setup the click event listeners: simply set the map to Chicago.
        controlUI.addEventListener('click', function() {
          mapHelpers.searchHere(mapsModel.googleMap.getCenter());
        });
      }

      // custom knockout binding handler for address autocomplete
      // code modified from example in 'KnockoutJS by Example' by Adan Jaswal ISBN: 9781785288548
      ko.bindingHandlers.addressAutoComplete = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          ////////////////////////////////////////////////////
          // var serviceOptions = {
          //   input: 'chester, uk',
          //   types: ['geocode']
          // };
          // var autocompletePlaceService = new google.maps.places.AutocompleteService();
          //
          // var displaySuggestions = function(predictions, status) {
          //   if (status != google.maps.places.PlacesServiceStatus.OK) {
          //     alert(status);
          //     return;
          //   }
          //   var LabelText = (predictions[0].description);
          //   console.log('first prediction for autoplace ' + LabelText);
          // };
          // autocompletePlaceService.getQueryPredictions(serviceOptions, displaySuggestions);
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
            // if (place.place_id == mapsModel.compCurrentPlaceId()) {
            //   // exit function
            //   return;
            // } else {
            //   // if the autocomplete place has data already in musuemData array
            //   // do not make a new REST request
            //
            // }
            if (place.address_components !== undefined) {
              if (!place.geometry) {
                // if place has no geometry it cannot have a marker on the map, so exit
                console.log("Autocomplete's returned place contains no geometry");
                // exits handler
                return;
              }
              // display place on map
              mapHelpers.panMapToPlace(place);
            }
          });
        },

        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var value = valueAccessor();
          var valueUnwrapped = ko.unwrap(value);
          console.log('autocomplete is:' + valueUnwrapped);
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
      // for event BEFORE compPlaceLabel changed
      mapsModel.compPlaceLabel.subscribe(function(oldValue) {
        // TODO:
      }, null, "beforeChange");
      // for event AFTER obsUserLocalPlace has changed
      mapsModel.obsUserLocalPlace.subscribe(function(oldValue) {
        console.log('local place has changed');
      }, null, "change");
      // event for AFTER obsSelectedPlace changed
      // that is, a new place has been got from google api callback
      mapsModel.obsSelectedPlace.subscribe(function(placeValue) {
        console.log('obsSelectedPlace changed');
        // google search place has changed so start AJAX get for new musuem objects
        // var places = MusuemApp.getAsyncResource();
        // update the map to show obsSelectedPlace with custom marker
        mapHelpers.updateMapPlace(mapsModel.obsSelectedPlace());
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
    // configure the musuem apps Knockout ViewModel
    koBindingHandlers();
    koSubscribers();
    // try and get users location as a prefered googleMap place
    // if succeeds in getting a place it makes a map marker and enables a
    // 'Go Local' button in App UI for navigation
    // NOTE runs async browser location service so a callback will set this later
    getUsersLocalPlace();

    return {
      // export PUBLIC functions and variables for MusAppViewModel -
      mapsModel: mapsModel,
      mapHelpers: mapHelpers,
      musuemDataHelpers: musuemDataHelpers
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
    musuemDataReady: musuemDataReady,
    addMessage: addMessage,
    // initAppLibs: initAppLibs,
  };
  // END MODULE MusuemApp
  //---------------------------------------------------------
})(window);

//---------------------------------------------------------
// JQuery Bootstrap APP when document is ready
//---------------------------------------------------------
$(function() {
  // Greenwich observatory UK, google PlaceID and latlngLiteral
  var initPlaceRef = {
    placeSearchID: "ChIJJc-4yymo2EcRwqZo5HwjGEk",
    placeSearchLoc: {
      lat: 51.479052,
      lng: -0.011074
    }
  };
  // set height of map area to 50% of the current document height
  // hack to get google map to display as div will have 0 height if not set
  var halfDocumentHeight = ($(window).height() / 2);
  $('#map').height(halfDocumentHeight);
  $('#map').css('visibility', 'visible');
  // $('#map').show();
  // call app init with inital placeID - Greenwich, UK
  MusuemApp.init(initPlaceRef);
});
//---------------------------------------------------------
