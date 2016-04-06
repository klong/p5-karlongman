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
    placeName: 'Greenwich, uk',
    name: 'V&A places with musuem objects, 8km around Greenwich observatory UK',
    dataType: 'json',
    search_parameters: {
      latitude: 51.479052,
      longitude: -0.011074,
      orderby: "distance", // order results by closest distance to search loc
      radius: 8, //radius in km around loc to search for musuem collection.places
      images: 1, // only results that have photos
      limit: 45 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
    },
    url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
    isLoaded: 'no'
  }, {
    placeID: "ChIJYdizgWaDcUgRH9eaSy6y5I4", // bristol UK, google PlaceID
    placeName: 'Bristol, uk',
    name: 'V&A places with musuem objects, 10km around Bristol, UK',
    dataType: 'json',
    search_parameters: {
      latitude: 51.468468,
      longitude: -2.6609199,
      orderby: "distance", // order results by closest distance to search loc
      radius: 10, //radius in km around loc to search for musuem collection.places
      images: 1, // only results that have photos
      limit: 45 // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
    },
    url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
    isLoaded: 'no'
  }];

  //-------------------
  //  init MUSUEM APP
  //-------------------
  function init(initalPlaceRef) {
    // add a property to viewmodel obj to use when binding the map in the knockout vm
    MusuemViewModel.startMapPlaceRef = initalPlaceRef;
    //-----------------------------------
    // get AJAX JAVASCRIPT resources
    //-----------------------------------
    $.each(initAppLibs, ajaxGetAppResources);
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
        $.each(initMusuemData, ajaxGetAppResources);
        addMessage('localStorage musuemDataStorage not present');
        addMessage('AJAX Musuem Data LOAD REQUESTS : ' + initMusuemData.length);
      }
    } else {
      // localStorage service not available or disabled by user
      // so get AJAX JSON data resources
      //---------------------------------
      $.each(initMusuemData, ajaxGetAppResources);
      console.log('localstorage: FALSE');
      addMessage('AJAX Musuem Data LOAD REQUESTS : ' + initMusuemData.length);
    }
  }
  //-------------------
  // END init
  //-------------------

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

  function ajaxGetAppResources(index, resourceRefObj) {
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
      // set init resource parameter to show load success
      resourceRefObj.isLoaded = 'loaded';
      if (resourceRefObj.dataType === 'json') {
        //-----------------------------------------------
        // got a JSON musuem data resource
        //-----------------------------------------------
        // setup an object to store musuem data
        var museumCollectionDataObj = {
          googlePlaceID: resourceRefObj.placeID,
          restUrl: resourceRefObj.url,
          placeName: resourceRefObj.placeName,
          name: resourceRefObj.name,
          searchParameters: resourceRefObj.search_parameters,
          musuemCollectionType: 'place',
          musuemData: data
        };
        // keep museumCollectionDataObj for app use
        if (!musuemData.data) {
          musuemData.data = {
            musuemPlaceData: []
          };
          musuemData.data.musuemPlaceData.push(museumCollectionDataObj);
        } else {
          // when more than one inital data resource is requested
          // append the museumCollectionDataObj
          musuemData.data.musuemPlaceData.push(museumCollectionDataObj);
        }
      }
      //------------------------------------------------------------------------------
      // sorry, this way seems a bit of hack to handle the async callbacks and
      // the requirement to only create and applyBindings to the knockout viewModel once
      // NOTE: on load resource success, try to initalise the museum app,
      // this can only happen when all app required scripts and musuemData is loaded
      //------------------------------------------------------------------------------
      if (!MusuemViewModel.status) { // the MusuemViewModel does not exist
        // only if All scripts and musuem data resources for the app are loaded
        if (appLibsReadyP() && musuemDataReadyP()) {
          musuemDataReady.status = true;
          addMessage('--- Musuem App RESOURCES READY ---');
          //-----------------------------------
          // Create Knockout options & APP VIEWMODEL
          //-----------------------------------
          ko.options.deferUpdates = true;
          var vm = new MusAppViewModel();
          MusuemViewModel.vm = vm;
          MusuemViewModel.status = true;
          //-----------------------------------
          //  apply bindings APP VIEWMODEL
          //-----------------------------------
          ko.applyBindings(MusuemViewModel.vm);
          addMessage(' 😀 viewmodel READY');
        }
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

      // google map place observable - the geolocation for the musuemPlace search radius
      obsSearchGooglePlace: ko.observable(null),
      // obsUserLocalLocation is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalLocation: ko.observable(false),
      // observable OBSERVABLE ARRAY for museum objects within selected place
      obsMusuemPlaceObjects: ko.observableArray(),
      // // obsMuseumObjPlaces OBSERVABLE ARRAY for the V&A place markers on map
      // obsMuseumObjPlaces: ko.observableArray()
    };

    // add knockout computed variables outside object literal definition of mapsModel
    // as referencing other ko.observables inside mapsModel not possible until defined
    mapsModel.compPlaceLabel = ko.pureComputed(function() {
      var place = mapsModel.obsSearchGooglePlace();
      return (place === null) ? '' : simpleFormattedplaceIdName(place);
    });

    mapsModel.compCurrentPlaceId = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSearchGooglePlace();
      // update mapsModel observable with unique placeID
      return (curSearchPlace === null) ? '' : curSearchPlace.place_id;
    });

    mapsModel.compCurrentPlaceIdLngLat = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSearchGooglePlace();
      // update mapsModel observable with location
      return (curSearchPlace === null) ? '' : mapsModel.obsSearchGooglePlace().geometry.location;
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
      // functions TODO

      return {

      };
    }(musuemDataHelpers);
    //  END musuemDataHelpers MODULE
    //-----------------------------------------------------

    //-----------------------------------------------------
    //  mapHelpers MODULE
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
        //console.dir(mapsModel.obsSearchGooglePlace());
        //console.log('😀 start new V&A musuem place request for place ' + mapsModel.obsSearchGooglePlace.place_id);
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

      var mapGoHere = function() {
        console.log('goHere' + map.getCenter());

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

      function geocodeMapCenter() {
        var map = mapsModel.googleMap;
        var mapCenterlatlng = map.getCenter();
        // google aps geocoder service
        mapsModel.geocoder.geocode({
          'location': mapCenterlatlng
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              var postalCodeP = function(curElement, index) {
                // local predicate function for JQuery.grep function - see below
                // iterates through the address types in place objects returned by geocoder service
                // looks for postal_code_prefix type location
                var curTypes = curElement.types;
                for (var i = 0; i < curTypes.length; i++) {
                  if (curTypes[i] === "postal_code_prefix") {
                    return true;
                  }
                }
                return false;
              };
              // try and get a postal_code_prefix type of addresses if possible
              // as a more general search name looks better than a 'rooftop' type of address
              var postCodeResults = $.grep(results, postalCodeP);
              var bestPlaceFromLoc = null;
              if (postCodeResults.length > 0) {
                bestPlaceFromLoc = postCodeResults[0];
              } else {
                // no postal_code address available
                // so use first address in results as new place (a 'rooftop' type address)
                bestPlaceFromLoc = results[0];
              }
              if (bestPlaceFromLoc !== null) {
                map.setZoom(10); // the area of the 'search here' button is about 5km at this zoom level
                var marker = new google.maps.Marker({
                  position: mapCenterlatlng,
                  map: map
                });
                mapsModel.infowindow.setContent(bestPlaceFromLoc.formatted_address);
                mapsModel.infowindow.open(map, marker);
              }

            } else {
              window.alert('No results found');
            }
          } else {
            window.alert('Geocoder failed due to: ' + status);
          }
        });
      }

      var geocodePosition = function() {
          mapsModel.geocoder.geocode({
            'location': lnglatLiteral
          }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              if (results) {
                var postalCodeP = function(curElement, index) {
                  // local predicate function for JQuery.grep function - see below
                  // iterates through the address types in place objects returned by geocoder service
                  // looks for firdt postal code type location
                  var curTypes = curElement.types;
                  for (var i = 0; i < curTypes.length; i++) {
                    if (curTypes[i] === "postal_code") {
                      return true;
                    }
                  }
                  return false;
                };
                // try and get a more postalcode general type of addresses if possible
                // as rooftop type address is not allways correct for users geoposition
                var postCodeResults = $.grep(results, postalCodeP);
                if (postCodeResults.length > 0) {
                  var newPostCodePlace = postCodeResults[0];
                  mapsModel.obsUserLocalLocation(newPostCodePlace);
                } else {
                  // no postcode address available
                  // so use first address in results as new place (a 'rooftop' type address)
                  var newRoofTopPlace = results[0];
                  mapsModel.obsUserLocalLocation(newRoofTopPlace);
                }
              }
            }
          });
        };
        //-----------------------------------------------------
        //  mapHelpers - public vars & functions
        //-----------------------------------------------------
      return {
        updateMapSearchLocation: updateMapSearchLocation,
        mapGoHere: mapGoHere,
        mapGoLocal: mapGoLocal,
        geocodeMapCenter: geocodeMapCenter,
        //centerMap: centerMap,
        pinMaker: pinMaker,
        updateMapPlace: updateMapPlace
      };
    }(mapHelpers);
    //  END mapHelpers MODULE
    //-----------------------------------------------------

    // try and retrieve the users GEOLOCATION
    var getLocalLocation = function() {
      if ("geolocation" in navigator) {
        var startPos;
        var geoOptions = {
          maximumAge: 10 * 60 * 1000, // debug option: will return quicker if geoloc has been run in last 10mins
          timeout: 15 * 1000 // timeout call if over 15 secs and no success
        };
        // callback function to call if got user location as a geoposition
        var geoSuccess = function(position) {
          startPos = position;
          var lnglatLiteral = {
            lat: startPos.coords.latitude,
            lng: startPos.coords.longitude
          };

          // CHECK if we already have results for this geoposition
          // no local storage do call maps geocoder service to get google place

          mapsModel.geocoder.geocode({
            'location': lnglatLiteral
          }, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              if (results) {
                var postalCodeP = function(curElement, index) {
                  // local predicate function for JQuery.grep function - see below
                  // iterates through the address types in place objects returned by geocoder service
                  // looks for firdt postal code type location
                  var curTypes = curElement.types;
                  for (var i = 0; i < curTypes.length; i++) {
                    if (curTypes[i] === "postal_code") {
                      return true;
                    }
                  }
                  return false;
                };
                // try and get a more postalcode general type of addresses if possible
                // as rooftop type address is not allways correct for users geoposition
                var postCodeResults = $.grep(results, postalCodeP);
                if (postCodeResults.length > 0) {
                  var newPostCodePlace = postCodeResults[0];
                  mapsModel.obsUserLocalLocation(newPostCodePlace);
                } else {
                  // no postcode address available
                  // so use first address in results as new place (a 'rooftop' type address)
                  var newRoofTopPlace = results[0];
                  mapsModel.obsUserLocalLocation(newRoofTopPlace);
                }
              }
            }
          });
        };
        // GEOLOCATION error callback
        var geoError = function(error) {
          MusuemApp.addMessage('local location not found 😞 with error: ' + geoErrorCodes[error]);
        };
        var geoErrorCodes = {
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
          map = new google.maps.Map(element, {
            //disableDefaultUI: true,
            //mapTypeControl: true,
            // mapTypeControlOptions: {
            //   style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            //   position: google.maps.ControlPosition.TOP_RIGHT
            // },
            scaleControl: true,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            center: new google.maps.LatLng(51.478771, -0.011074),
            zoom: 1 // the whole world map before we have musuem data
          });

          map.controls[google.maps.ControlPosition.CENTER].push(document.getElementById('btn_goHere'));

          mapsModel.googleMap = map; // debug helper
          mapsModel.geocoder = new google.maps.Geocoder(map);
          var requestPlaceId = {
            placeId: MusuemViewModel.startMapPlaceRef.placeSearchID
          };
          // request a google place from geocoder service
          mapsModel.geocoder.geocode(requestPlaceId, placeIdSucessCallback);

          function placeIdSucessCallback(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
              var firstPlace = results[0];
              if (firstPlace) {
                // create a reusable map marker to show search location
                mapsModel.searchLocMarker = new google.maps.Marker({
                  map: map,
                  visible: false,
                  icon: mapHelpers.pinMaker("yellow"),
                  clickable: false // prevent mouse click events as musuem place markers have the data to show
                });
                // update observable for google place for museum object search
                mapHelpers.updateMapSearchLocation(firstPlace);
              }
            }
          }
          // map zoom change event handler
          // map.addListener('zoom_changed', function() {
          //   var zoomLevel = map.getZoom();
          //   mapsModel.infowindow.setContent('Zoom: ' + map.getZoom());
          // });
          // map idle change event handler
          // map.addListener('idle', function() {
          //   var bounds = map.getBounds();
          //
          // });
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
            if (place.place_id == mapsModel.compCurrentPlaceId()) {
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

      // event for BEFORE obsUserLocalLocation changed
      mapsModel.obsUserLocalLocation.subscribe(function(oldValue) {
        // TODO:
      }, null, "beforeChange");

      // event for AFTER obsSearchGooglePlace changed
      // thats is, a new place has been got from google api callback
      mapsModel.obsSearchGooglePlace.subscribe(function(placeValue) {
        console.log('obsSearchGooglePlace changed');
        // google search place has changed so start AJAX get for new musuem objects
        //var places = MusuemApp.ajaxGetAppResources();

        // update the map to show obsSearchGooglePlace with custom marker
        mapHelpers.updateMapPlace(mapsModel.obsSearchGooglePlace());
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
    // configure Knockout
    koBindingHandlers();
    koSubscribers();
    // get users location as a googleMap place if browsers geolocation service is allowed
    // if succeeds it enables a 'Your Neibourhood' button in App UI to go to navigate to this location
    getLocalLocation();

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
    placeSearchID: "ChIJ83WZp86p2EcRbMrkYqGncBQ",
    placeSearchLoc: {
      lat: 51.479052,
      lng: -0.011074
    }
  };
  // call app init with inital placeID - Greenwich, UK
  MusuemApp.init(initPlaceRef);
});
//---------------------------------------------------------
