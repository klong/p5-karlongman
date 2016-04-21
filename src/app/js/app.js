//---------------------------------------------------------
//    MusuemApp MODULE
//---------------------------------------------------------

var MusuemApp = (function() {
  var MusuemAppScripts = false;
  // vars are objects as MusuemApp will add property values
  var musuemData = {};
  var musuemDataReady = {
    status: false
  };
  var MusuemViewModel = {
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
    isLoaded: 'no',
    test: "google.maps"
  }, {
    // knockout.js library
    name: 'knockout',
    dataType: 'script',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js',
    isLoaded: 'no',
    test: "ko"
  }, {
    // wordcloud2 api
    name: 'wordcloud2',
    dataType: 'script',
    url: '/js/library/wordcloud2.js',
    isLoaded: 'no',
    test: "wordcloud2"
  }];
  //-------------------------------------------------------------------------
  // initMusuemPlaces defines the search locations for default musuemMarkers
  //-------------------------------------------------------------------------

  var initMusuemPlaces = [{
    name: "City of Bristol, UK",
    location: {
      lat: 51.4658439,
      lng: -2.572136300000011
    }
  }, {
    name: "Liverpool, Merseyside, UK",
    location: {
      lat: 53.37669649999999,
      lng: -2.914901900000018
    }
  }, {
    name: "London Borough of Camden, Greater London, UK",
    location: {
      lat: 51.55170589999999,
      lng: -0.15882550000003448
    }
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
  function init() {
    //---------------------------------------------------------
    // get musuem app JSON data stored in localStorage if available
    //---------------------------------------------------------
    if (localStorageP()) {
      if (localStorage.musuemDataStored) {
        console.log('GOT SOME LOCAL musuemDataStored');
        // have some exisiting localStorage.musuemDataStored
        // rehydrate the local stringify stored JSON data
        // NOTE: needed to add new property on musuemData obj for this to work ??
        musuemData.data = JSON.parse(localStorage.musuemDataStored);
        // Flag that musuemData is ready
        musuemDataReady.status = true;
      }
    }
    //---------------------------------------------------
    //  Async get JAVASCRIPT resources required by app
    //---------------------------------------------------
    $.each(initAppLibs, getAsyncResource);
    addMessage('AJAX javascript LOAD REQUESTS : ' + initAppLibs.length);
  }
  //-------------------
  // END init
  //-------------------

  function getAsyncResource(index, resourceRefObj, preferedPlace) {
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
        var musuemCollectionDataObj = {
          googlePlace: preferedPlace,
          resourceRefObj: resourceRefObj,
          musuemCollectionType: resourceRefObj.modelCollection,
          musuemData: resultData
        };
        updateMusuemData(resourceRefObj.modelCollection, musuemCollectionDataObj);
      }
      //------------------------------------------------------------------------------
      // NOTE: sorry, this code below seems a bit of hack to handle both the async callbacks and
      // requirement to only create and applyBindings to the knockout viewModel once
      // so on load resource success, we try to initalise the musuem app,
      // this can only happen when all required scripts and musuemData for app have loaded
      //------------------------------------------------------------------------------
      // only do if the musuem app viewmodel does not exist
      if (MusuemViewModel.status === false) {
        if (appLibsReadyP()) {
          addMessage('😀 Musuem App Scripts READY');
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

  function updateMusuemData(storageName, musuemCollectionDataObj) {
    //-----------------------------------------
    // keep musuemCollectionDataObj for app use
    if (!musuemData.data) {
      // make a new 'data' array object property on musuemData to store musuem data
      musuemData.data = {};
      // store in new musuem data property
      musuemData.data[storageName] = [];
      musuemData.data[storageName].push(musuemCollectionDataObj);
    } else {
      // update existing musuem data store
      if (musuemData.data.hasOwnProperty(storageName)) {
        // append the musuem data onto exisiting array property
        musuemData.data[storageName].push(musuemCollectionDataObj);
      } else {
        // when its a new kind of modelCollection data - make a new oject property to hold data
        musuemData.data[storageName] = [];
        musuemData.data[storageName].push(musuemCollectionDataObj);
      }
    }
    // update the localStorage
    if (localStorageP()) {
      if (localStorage.musuemDataStored) {
        // save stringified version of musuemdata obj for future app runs
        localStorage.musuemDataStored = JSON.stringify(musuemData.data);
      } else {
        // first init the storage object property
        localStorage.musuemDataStored = {};
        localStorage.musuemDataStored = JSON.stringify(musuemData.data);
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
      searchLocMarker: false,
      // a map info window that will be reused to display different musuem object details
      infowindow: new google.maps.InfoWindow({
        content: ''
      }),
      // placeTypeInPrefOrder: ["administrative_area_level_3", "administrative_area_level_2", "postal_town", "neighborhood"],
      placeTypeInPrefOrder: ["locality", "administrative_area_level_4", "administrative_area_level_3", "administrative_area_level_2", "postal_code"],
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      obsArrayMapMarkers: ko.observableArray([]), // array to store all map marker objects
      obsArrayWordsMapList: ko.observableArray([{
        text: "default",
        size: 60
      }]),
      obsSelectedPlace: ko.observable(false),
      // obsUserLocalPlace is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalPlace: ko.observable(false),
      // observable OBSERVABLE ARRAY for musuem objects within selected place
      placeName: ko.observable('typograph')
    };

    // add knockout computed variables outside of mapsModel object literal definition
    // as referencing other ko.observables inside mapsModel not possible until defined?
    mapsModel.compSelectedPlace = ko.pureComputed(function() {
      var place = mapsModel.obsSelectedPlace();
      return (place === false) ? 'no selected place' : simpleFormattedplaceIdName(place);
    });

    mapsModel.compCurrentPlaceId = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSelectedPlace();
      // update mapsModel observable with unique placeID
      return (curSearchPlace === false) ? '' : curSearchPlace.place_id;
    });

    mapsModel.compCurrentPlaceIdLngLat = ko.computed(function() {
      var curSearchPlace = mapsModel.obsSelectedPlace();
      // update mapsModel observable with location
      return (curSearchPlace === false) ? '' : mapsModel.obsSelectedPlace().geometry.location;
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
          var simpleFormatName = place.address_components[0].short_name + ', ' + place.address_components[1].short_name;
          return simpleFormatName;
        }
      }
    };

    //-----------------------------------------------------
    //  musuemDataHelpers MODULE
    //-----------------------------------------------------
    var musuemDataHelpers = function() {

      function getMusuemPlaces(preferedPlace) {
        var resourceName = 'V&A collection place name search for museumobjects: ' + preferedPlace.address_components[0].short_name;
        var placeLocRef = preferedPlace.geometry.location;
        var resourceRefObj = {
          placeLoc: placeLocRef,
          placeID: preferedPlace.place_id, // a google PlaceID
          placeName: preferedPlace.address_components[0].short_name,
          name: resourceName,
          modelCollection: 'place',
          dataType: 'json',
          search_parameters: {
            q: preferedPlace.address_components[0].short_name,
            orderby: "distance", // order results by closest distance to search loc
            radius: 10, // radius in km to restrict search results
            limit: 45, // note: 45 is max amount of musuem objects results allowed on a single AJAX call by API
            //images: 1 // only results with images
          },
          url: 'http://www.vam.ac.uk/api/json/place/search', // V&A musuem collection.places search REST service
          isLoaded: 'no'
        };

        // set from existing musuemData or by a new async AJAX request
        var placeDataResults = placeDataIfExists(preferedPlace.place_id);
        if (placeDataResults !== false) {
          // setup a new object literal to store musuem data
          var musuemCollectionDataObj = {
            googlePlace: preferedPlace,
            resourceRefObj: resourceRefObj,
            musuemCollectionType: resourceRefObj.modelCollection,
            musuemData: placeDataResults
          };
          return musuemCollectionDataObj;
        } else {
          // use async AJAX call to get place data
          var index = 0; // NOTE needed as first argument to getAsyncResource function
          getAsyncResource(index, resourceRefObj, preferedPlace);
        }
      }

      function getMusuemObjectDetails(musuemObjectNumber) {
        var index = 0; // NOTE needed as first argument to getAsyncResource function
        var resourceName = 'V&A - musuem object details:  ' + musuemObjectNumber;
        var resourceRefObj = {
          name: resourceName,
          modelCollection: 'musuemobject',
          dataType: 'json',
          search_parameters: {
            object_number: "O153358"
          },
          url: 'http://www.vam.ac.uk/api/json/musuemobject/', // V&A musuem collection.musuemobject search REST service
          isLoaded: 'no'
        };
        //------------------------------------------
        // the AJAX call for musuem data
        getAsyncResource(index, resourceRefObj, preferedPlace);
        //------------------------------------------
      }

      function placeDataIfExists(placeId) {
        if ($.isEmptyObject(MusuemApp.musuemData)) {
          // no musuemData
          return false;
        } else {
          var placeDataArray = MusuemApp.musuemData.data.place;
          for (var j = 0; j < placeDataArray.length; j++) {
            var placeObj = placeDataArray[j];
            if (placeObj.resourceRefObj.placeID === placeId) {
              // if preferred place place_id is already in musuem Data
              // so return stored place with the place_id (somusuem place request not required)
              return placeObj;
            }
          }
        }
        // preferred place place data does not exist
        return false;
      }

      return {
        getMusuemPlaces: getMusuemPlaces,
        getMusuemObjectDetails: getMusuemObjectDetails
      };
    }(musuemDataHelpers);
    //  END musuemDataHelpers MODULE
    //-----------------------------------------------------

    //-----------------------------------------------------
    //  mapHelpers MODULE
    //-----------------------------------------------------
    var mapHelpers = function() {

      var filterMarkersToViewport = function() {
        var result = [];
        var bounds = map.getBounds();
        var musuemMarkers = mapsModel.obsArrayMapMarkers();
        for (var i = 0; i < musuemMarkers.length; i++) { // loop through Markers Collection
          var musMarkerObj = musuemMarkers[i];
          if (bounds.contains(musMarkerObj.prefPlaceMarker.position)) {
            musMarkerObj.showMarker(true);
            //console.dir(musMarkerObj);
          } else {
            musMarkerObj.showMarker(false);
          }
        }
      };

      function rebuildAllMarkers() {
        var musuemDataArray = MusuemApp.musuemData.data.place;
        console.log('rebuild ' + musuemDataArray.length + ' markers from musuemData');
        for (var count = 0; count < musuemDataArray.length; count++) {
          rebuildMarker(musuemDataArray[count]);
        }
        showAllMarkers();
      }

      function rebuildMarker(mapMarkerDataObj) {
        var markerIndexRef = mapMarkerExistsRef(mapMarkerDataObj);
        // marker already exists in the viewModel
        if (markerIndexRef) {

          //deleteMarker();
          console.log(mapMarkerDataObj.resourceRefObj.placeName + ' :from musuemData');
        } else {
          console.log(mapMarkerDataObj.googlePlace.formatted_address);
          makeMusuemMarker(mapMarkerDataObj.googlePlace);
        }
      }

      var showAllMarkers = function() {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < mapsModel.obsArrayMapMarkers.length; i++) {
          var musMarker = mapsModel.obsArrayMapMarkers[i];
          console.dir(musMarker);
          musMarker.showMarker(true);
          bounds.extend(musMarker.prefPlaceMarker.getPosition());
        }
        mapsModel.googleMap.fitBounds(bounds);
      };

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

      var selectPrefPlace = function(prefPlace) {
        mapsModel.obsSelectedPlace(prefPlace);

      };

      var searchUsersLocation = function() {
        var geoPos = ko.utils.unwrapObservable(mapsModel.obsUserLocalPlace);
        if (geoPos) {
          var latLng = {
            lat: geoPos.geoPosition.coords.latitude,
            lng: geoPos.geoPosition.coords.longitude
          };
          // pan map to user loction
          panMapToLocation(latLng);
        }
      };

      var panMapToLocation = function(loc) {
        map.panTo(loc);
        map.setZoom(14);
        google.maps.event.trigger(map, 'resize');
      };

      var panMapToPlace = function(place) {
        map.panTo(place.geometry.location);
        map.fitBounds(place.geometry.viewport);
        google.maps.event.trigger(map, 'resize');
      };

      // center map on location
      var centerMap = function(loc) {
        map.setCenter(loc);
        google.maps.event.trigger(map, 'resize');
      };

      //--------------------------------------------------------------------------------
      // Function: makeMusuemMarker - makes a map marker to hold all musuem data
      //--------------------------------------------------------------------------------
      var makeMusuemMarker = function(bestPlace) {
        // create a google map marker for bestPlace
        var marker = new google.maps.Marker({
          position: bestPlace.geometry.location,
          map: map,
          icon: mapHelpers.pinMaker("yellow"),
          id: bestPlace.place_id, // a unique google map placeID used as key for localStorage
          visible: true // hide marker on map by deafult
        });
        // make musuemMarker object
        var musuemMarker = {
          showMarker: ko.observable(true), // observable used to hide/show a places marker & list item
          prefPlaceMarker: marker,
          bestPlace: bestPlace
        };
        // add click handler to marker
        marker.addListener('click', function(e) {
          var content = infoWindowContents(musuemMarker);
          mapsModel.infowindow.setContent(content);
          mapsModel.infowindow.open(map, marker);
        });

        // add marker to obsArrayMapMarkers array to track it for disposal etc
        mapsModel.obsArrayMapMarkers.push(musuemMarker);
        // add marker to vm observableArray - to display it in the place list

        // TODO open infowindow to show some debug data
        var infoContent = ".. getting musuem places";
        mapsModel.infowindow.setContent(infoContent);
        // display marker on map
        mapsModel.infowindow.open(map, marker);
      };

      var infoWindowContents = function(musuemMarker) {
        var contentString = '';
        contentString += '<div id="content">';
        contentString += '<h4>' + musuemMarker.bestPlace.formatted_address + '</h4>';
        contentString += '</div>';
        return contentString;
      };
      //------------------------------------------------------------------------
      function searchHere(location) {
        var map = mapsModel.googleMap;
        // use exisiting geocoder to find a 'preferred place'
        mapsModel.geocoder.geocode({
          'location': location,
          'bounds': map.bounds // bias search results to the visible area of map
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              var peferedPlaceP = function(curElement, index) {
                // this local function is used by $.grep function - see below
                // looks for preferred types of addresses in the address types
                // returned by google places service
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
              //------------------------------------------------------------
              // use prefered type of addresses if possible as more general place
              // name better for the app usage
              var bestPlaceResults = $.grep(results, peferedPlaceP);
              var bestPlace = false; // declare local var
              if (bestPlaceResults.length > 0) {
                // use first array item of bestPlaceResults
                bestPlace = bestPlaceResults[0];
              } else {
                // there are no preferred address so use the first address
                // in the original geocode results (usually will be a 'rooftop' type place)
                console.log('no peferedPlaceP address');
                bestPlace = results[0];
              }
              if (bestPlace) {
                // check if preferred marker already exists for preferred place
                if (mapMarkerExistsRef(bestPlace) !== false) {
                  console.log('marker already exits for ' + bestPlace.formatted_address);
                } else {
                  // create a new musuem map marker
                  makeMusuemMarker(bestPlace);
                  // populate the musuemData with places with musuemObjects
                  musuemDataHelpers.getMusuemPlaces(bestPlace);
                }
              }
            } else {
              console.log('no geocode results found');
              return false;
            }
          }
        });
      }

      function mapMarkerExistsRef(place) {
        var markerArray = mapsModel.obsArrayMapMarkers;
        for (var i = 0; i < markerArray.length; i++) {
          var markerObj = markerArray[i].prefPlaceMarker;
          if (markerObj.id === place.place_id) {
            return i;
          }
        }
        return false;
      }

      //-----------------------------------------------------
      //  mapHelpers - public vars & functions
      //-----------------------------------------------------
      return {
        showAllMarkers: showAllMarkers,
        selectPrefPlace: selectPrefPlace,
        searchHere: searchHere,
        centerMap: centerMap,
        pinMaker: pinMaker,
        rebuildAllMarkers: rebuildAllMarkers,
        rebuildMarker: rebuildMarker,
        searchUsersLocation: searchUsersLocation,
        panMapToPlace: panMapToPlace,
        mapMarkerExistsRef: mapMarkerExistsRef,
        filterMarkersToViewport: filterMarkersToViewport
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

          //map zoom change event handler
          map.addListener('zoom_changed', function() {
            var zoomLevel = map.getZoom();
            mapsModel.infowindow.setContent('Zoom: ' + map.getZoom());
          });
          //map idle change event handler
          map.addListener('idle', function() {
            //var bounds = map.getBounds();
          });
          map.addListener('bounds_changed', function() {
            mapHelpers.filterMarkersToViewport();
          });
          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            map.setCenter(center);
          });
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

            // Setup the click event listener
            controlUI.addEventListener('click', function() {
              mapHelpers.searchHere(mapsModel.googleMap.getCenter());
            });
          }
        }
      };

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
            types: ['geocode'] // only autocomplete addresses not general business type keyword search
          };
          var autocomplete = new google.maps.places.Autocomplete(element, options);
          // add event Listener for when the user selects address from the autocomplete dropdown
          google.maps.event.addListener(autocomplete, 'place_changed', function() {

            var place = autocomplete.getPlace();
            console.log('rssssssp');
            console.dir(place);
            if (place.address_components !== undefined) {
              if (!place.geometry) {
                console.log("Autocomplete's returned place contains no geometry");
                // exit handler
                return;
              } else {
                mapHelpers.panMapToPlace(place);
              }
            } else {
              console.log("Autocomplete's returned place contains no address_components");
            }
          });
        },

        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          console.log('autocomplete is:' + ko.unwrap(valueAccessor()));
        }
      };
      /////////////////////////////////////////////////////////////////////
      // MAP WORDS functions
      // Simple animated example of d3-cloud
      // code modified from http://bl.ocks.org/jwhitfieldseed/9697914
      /////////////////////////////////////////////////////////////////////
      var mapWords = function() {
        var noMusuemData = [
          ['no data', 1]
        ];
        if (MusuemApp.musuemData !== []) {
          if (MusuemApp.musuemData.data) {
            // TODO
            var arr = wordMapList(MusuemApp.musuemData.data.place[0].musuemData);
            var placeNames = [];
            for (var i = 0; i < arr.length; i++) {
              placeNames.push(arr[i]);
            }
            return placeNames;
          }
        }
        return noMusuemData;
      };

      function wordCloud(selector) {
        var fill = d3.scale.category20();

        //Construct the word cloud's SVG element
        var svg = d3.select(selector).append("svg")
          .attr("width", 300)
          .attr("height", 300)
          .append("g")
          .attr("transform", "translate(150,150)");

        //Draw the word cloud
        function draw(words) {
          var cloud = svg.selectAll("g text")
            .data(words, function(d) {
              return d.text;
            });

          //Entering words
          cloud.enter()
            .append("text")
            .style("font-family", "Serif")
            .style("fill", function(d, i) {
              return fill(i);
            })
            .attr("text-anchor", "middle")
            .attr('font-size', 1)
            .text(function(d) {
              return d.text;
            });

          //Entering and existing words
          cloud.transition()
            .duration(600)
            .style("font-size", function(d) {
              return d.size + "px";
            })
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .style("fill-opacity", 1)
            .each(function() {
              // click handler for words on wordCloud
              d3.select(this).on("click", function(d) {
                // TODO
                console.dir(d);
              });
            });

          //Exiting words
          cloud.exit()
            .transition()
            .duration(200)
            .style('fill-opacity', 1e-6)
            .attr('font-size', 1)
            .remove();
        }
        //Use the module pattern to encapsulate the visualisation code. We'll
        // expose only the parts that need to be public.
        return {
          //Recompute the word cloud for a new set of words. This method will
          // asynchronously call draw when the layout has been computed.
          //The outside world will need to call this function, so make it part
          // of the wordCloud return value.
          update: function(words) {
            d3.layout.cloud().size([300, 300])
              .words(words)
              .padding(3)
              .rotate(function() {
                return ~~(Math.random() * 2) * 90;
              })
              .font("Serif")
              .fontSize(function(d) {
                return d.size;
              })
              .on("end", draw)
              .start();
          }
        };
      }
      //Some sample data - http://en.wikiquote.org/wiki/Opening_lines
      var words = [
        "You don't know about me without you have read a book called The Adventures of Tom Sawyer but that ain't no matter.",
        "The boy with fair hair lowered himself down the last few feet of rock and began to pick his way toward the lagoon.",
        "When Mr. Bilbo Baggins of Bag End announced that he would shortly be celebrating his eleventy-first birthday with a party of special magnificence, there was much talk and excitement in Hobbiton.",
        "It was inevitable: the scent of bitter almonds always reminded him of the fate of unrequited love."
      ];

      //Prepare one of the sample sentences by removing punctuation,
      // creating an array of words and computing a random size attribute.
      function getWords(i) {
        return words[i]
          .replace(/[!\.,:;\?]/g, '')
          .split(' ')
          .map(function(d) {
            return {
              text: d,
              size: 12 + Math.random() * 40
            };
          });
      }

      //This method tells the word cloud to redraw with a new set of words.
      //In reality the new words would probably come from a server request,
      // user input or some other source.
      function showNewWords(vis, i) {
        i = i || 10;
        vis.update(getWords(i++ % words.length));
        setTimeout(function() {
          showNewWords(vis, i + 20);
        }, 20000);
      }
      /////////////////////////////////////////////////////////////////////

      ko.bindingHandlers.wordCloud = {

        cat: [{text: 'pop', size: 45},{text: 'dop', size: 35}],

        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var wordCloudOptions = { words: [{text: 'oi', size: 45}]};
          // create a new word cloud and bind to 'wordCloud'
          this.wordCloud = wordCloud(element);

        },

        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var value = ko.utils.unwrapObservable(valueAccessor()); //unwrap to get subscription
          console.log('Values: ' + value);
          //showNewWords(this.wordCloud);
          var words = ko.unwrap(allBindingsAccessor().cat);
          console.log(words);
          showNewWords(this.wordCloud);
        }
      };
    };

    // method to subscribe to observerable changes
    var koSubscribers = function() {
      // for event AFTER obsUserLocalPlace has changed
      mapsModel.obsUserLocalPlace.subscribe(function(oldValue) {
        console.log('local place has changed');
      }, null, "change");
      // event for AFTER obsSelectedPlace changed
      // that is, a new place has been got from google api callback
      mapsModel.obsSelectedPlace.subscribe(function(placeValue) {
        console.log('obsSelectedPlace changed');
      }, null, "change");
    };

    //-----------------------------------------------------
    //    musuem data helper functions
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
        console.log(' ' + musObj.fields.type + ' ' + musObj.fields.musuemobject_count + ' musuem objects');
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
      console.dir(list);
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
    musuemDataReady: musuemDataReady,
    initMusuemPlaces: initMusuemPlaces,
    addMessage: addMessage,
    localStorageP: localStorageP
      // NOTE: for debug aid
      // initAppLibs: initAppLibs,
  };
  // END MODULE MusuemApp
  //---------------------------------------------------------
})();

//---------------------------------------------------------
// JQuery Bootstrap APP when document is ready
//---------------------------------------------------------
$(function() {
  // set height of map area to 50% of the current document height
  // hack to get google map to display as div will have 0 height if not set
  var halfDocumentHeight = ($(window).height() / 2);
  $('#map').height(halfDocumentHeight);
  $('#map').css('visibility', 'visible');
  //-----------------------------
  // INIT musuem APP
  //-----------------------------
  MusuemApp.init();
  //-----------------------------
  var makeMapMusuemData = function() {
    var initData = MusuemApp.initMusuemPlaces;
    console.dir(MusuemApp.musuemData.data);
    if ((!MusuemApp.localStorageP()) || (MusuemApp.musuemData.data === undefined)) {
      console.log('first time app run or no local storage');
      // localStorage is disabled or is the first time app is run.
      // make some default musuemMarkers using lat lng locations in initMusuemPlaces
      if (initData.length > 0) {
        for (var i = 0; i < initData.length; i++) {
          var placeRef = initData[i];
          // makes new map musuem marker
          MusuemApp.MusuemViewModel.vm.mapHelpers.searchHere(placeRef.location);
        }
      }
    } else { // we have localStorage musuemData
      MusuemApp.MusuemViewModel.vm.mapHelpers.rebuildAllMarkers();
    }
  };
  // initMusuemPlaces function is called with short setTimeout
  // to allow musuem app to allow all initalising and before
  // we try and rebuild musuemMarkers from musuem data
  setTimeout(function() {
    makeMapMusuemData();
  }, 1000); // wait 1 second before running makeMapMusuemData()



});
//---------------------------------------------------------
