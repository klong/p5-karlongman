//---------------------------------------------------------
//    museumApp MODULE
//---------------------------------------------------------

var museumApp = (function() {
  var debugMessageArea = false;
  var museumAppScripts = false;
  // vars are objects as museumApp will add property values
  var museumData = {};
  var museumDataReady = {
    status: false
  };
  var museumViewModel = {
    status: false
  };
  //----------------------------------------------------------------------------
  // initAppLibs array defines external script need before our app can run
  //----------------------------------------------------------------------------
  var initAppLibs = [{
    // google maps api
    name: 'googleMaps',
    dataType: 'script',
    url: 'https://maps.googleapis.com/maps/api/js?v=3&libraries=places&key=AIzaSyCRpuFnelWb6VGyKNtMyUbKopJC-1anU7g',
    isLoaded: 'no',
    test: "google.maps"
  }, {
    // markerwithlabel.js library
    name: 'markerwithlabel',
    dataType: 'script',
    url: 'http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerwithlabel/1.1.9/src/markerwithlabel.js',
    isLoaded: 'no',
    test: "MarkerWithLabel"
  }, {
    // google maps infobox api
    name: 'googleMapsInfobox',
    dataType: 'script',
    url: 'http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/src/infobox.js',
    isLoaded: 'no',
    test: "Infobox"

  }];

  // , {
  //   // knockout.js library
  //   name: 'knockout',
  //   dataType: 'script',
  //   url: 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js',
  //   isLoaded: 'no',
  //   test: "ko"
  // }
  //-------------------------------------------------------------------------
  // initmuseumPlaces defines the search locations for default museumMarkers
  //-------------------------------------------------------------------------

  var initmuseumPlaces = [{
    name: "City of Bristol, UK",
    location: {
      lat: 51.454513,
      lng: -2.5879099999999653
    }
  }, {
    name: "Liverpool, Merseyside, UK",
    location: {
      lat: 53.4199878,
      lng: -2.9808851
    }
  }, {
    name: "Leicester Square, London, UK",
    location: {
      lat: 51.5102585,
      lng: -0.1308881999999585
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
  //  init museum APP
  //-------------------
  function init() {
    //---------------------------------------------------------
    // get museum app JSON data stored in localStorage if available
    //---------------------------------------------------------
    if (localStorageP()) {
      if (localStorage.museumDataStored) {
        console.log('GOT SOME LOCAL museumDataStored');
        // have some exisiting localStorage.museumDataStored
        // rehydrate the local stringify stored JSON data
        // NOTE: needed to add new property on museumData obj for this to work ??
        museumData.data = JSON.parse(localStorage.museumDataStored);
        // Flag that museumData is ready
        museumDataReady.status = true;
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

  function getAsyncResource(index, resourceRefObj, preferedPlace, updateObjectRef) {
    // AJAX ASYNC load external javascript script or JSON data resource
    var request = $.ajax({
      url: resourceRefObj.url,
      type: "GET",
      data: resourceRefObj.search_parameters,
      dataType: resourceRefObj.dataType,
      timeout: (1 * 10000) // 10 second timeout on trying to get a resource
    });
    //-------------------------------------------------------------------
    // 'DONE' callback *** an async resource has loaded sucessfully
    //-------------------------------------------------------------------
    request.done(function(museumDataResult, textStatus, jqXHR) {
      // set init resource parameter to show load success
      resourceRefObj.isLoaded = 'loaded';
      if (resourceRefObj.dataType === 'json') {
        // callback returned a musuem data resource
        var musuemCollectionType = resourceRefObj.modelCollection;
        if (musuemCollectionType === 'place') {
          // places are also stored in museumMarkers so that
          // the musuemMarker has local references to the musuem places near it
          updateMuseumMarker(musuemCollectionType, museumDataResult, updateObjectRef);
        }
        // an object literal to pass into updateMuseumData function
        var museumCollectionDataObj = {
          googlePlace: preferedPlace,
          resourceRefObj: resourceRefObj,
          museumCollectionType: resourceRefObj.modelCollection,
          museumData: museumDataResult // AJAX results for museum data
        };
        // update musuemData and localstorage cache
        updateMuseumData(resourceRefObj.modelCollection, museumCollectionDataObj, updateObjectRef);
      }
      // NOTE: sorry, this code below seems a bit of hack to handle both the async callbacks and
      // requirement to only create the knockout viewModel & applyBindings a single time
      // on load resource success, we try to initalise the museum app, this can only happen
      // when all required scripts and museumData for app have loaded.
      // only do if the museum app viewmodel does not exist
      if (museumViewModel.status === false) {
        if (appLibsReadyP()) {
          addMessage('😀 museum App Scripts READY');
          //-----------------------------------
          // create Knockout options & APP VIEWMODEL
          ko.options.deferUpdates = true;
          var vm = new MusAppViewModel();
          museumViewModel.vm = vm;
          //-----------------------------------
          // apply bindings APP VIEWMODEL
          ko.applyBindings(museumViewModel.vm);
          museumViewModel.status = true;
          addMessage(' 😀 viewmodel READY');
          return true;
        } else {
          return false;
        }
      }
      //-----------------------------------------------------------------------
    });
    // 'FAIL' callback e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      // set the reqs 'isLoaded' key in appReqs to show not loaded
      resourceRefObj.isLoaded = 'failed';
      addMessage(resourceRefObj.name + ' 😞 not loaded with error: ' + errorThrown);
    });
    // 'ALLWAYS' callback
    request.always(function(jqXHR, textStatus, errorThrown) {
      addMessage('😀 ' + resourceRefObj.name + ' :- AJAX ' + resourceRefObj.dataType + ' ' + textStatus);
    });
  }

  function updateMuseumMarker(modelCollectionName, museumDataResultmuseumData, updateObjectRef) {
    // the data im musuemData is stored as knockout observableArrays
    // so the ui can update as musuem data comes in from async ajax calls
    if (updateObjectRef.VaM().hasOwnProperty[modelCollectionName]) {
      // append musuem marker data to modelCollection observableArray
      updateObjectRef.VaM()[modelCollectionName].push(museumDataResultmuseumData);
    } else {
      updateObjectRef.VaM()[modelCollectionName] = ko.observableArray([]);
      updateObjectRef.VaM()[modelCollectionName].push(museumDataResultmuseumData);
    }
  }

  function updateMuseumData(storageName, museumCollectionDataObj) {
    //-----------------------------------------
    // keep museumCollectionDataObj for app use
    if (!museumData.data) {
      // make a new 'data' array object property on museumData to store museum data
      museumData.data = {};
      // make new museumdata property
      museumData.data[storageName] = [];
      // update the musuemData
      museumData.data[storageName].push(museumCollectionDataObj);
    } else {
      // update an existing museum data store e.g place collection
      if (museumData.data.hasOwnProperty(storageName)) {
        // update musuemData
        museumData.data[storageName].push(museumCollectionDataObj);
      } else {
        // when its a new kind of modelCollection data - make a new oject property to hold data
        museumData.data[storageName] = [];
        museumData.data[storageName].push(museumCollectionDataObj);
      }
    }
    // update the localStorage for keeping musuem data between browser sessions
    // maybe a bit inefficient, as all data is written out rather than just what has changed
    if (localStorageP()) {
      if (localStorage.museumDataStored) {
        // save stringified version of museumdata obj for future app runs
        localStorage.museumDataStored = JSON.stringify(museumData.data);
      } else {
        // first init the storage object property
        localStorage.museumDataStored = {};
        localStorage.museumDataStored = JSON.stringify(museumData.data);
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
  //  museum App VIEWMODEL creator
  //----------------------------------------------------------------------------
  var MusAppViewModel = function() {

    //-------------
    // ui Model
    //-------------
    var uiModel = {
      // default infoWindow is closed
      obsInfowindowVisible: ko.observable(false)
    };

    uiModel.compShowSearchResults = ko.computed(function() {
      // infoWindow open --> hide search results ui
      // infoWindow closed --> show search results ui
      visibleState = uiModel.obsInfowindowVisible() ? false : true;
      return visibleState;
    });

    uiModel.compShowMusObjectsResults = ko.computed(function() {
      // infoWindow open --> show MusObjects results ui
      // infoWindow closed --> hide MusObjects results ui
      visibleState = uiModel.obsInfowindowVisible() ? true : false;
      return visibleState;
    });

    //----------------
    //  maps Model
    //----------------
    var mapsModel = {
      // see using an infobox instead of an infoWindow - example http://jsfiddle.net/jehj3/597/
      // infowindow: new InfoBox({
      //   content: document.getElementById("infobox") || '',
      //   disableAutoPan: false,
      //   maxWidth: 350,
      //   pixelOffset: new google.maps.Size(-140, 0),
      //   zIndex: null,
      //   boxStyle: {
      //     //background: "url('http://google-maps-utility-library-v3.googlecode.com/svn/trunk/infobox/examples/tipbox.gif') no-repeat",
      //     background: "url('img/tipbox-white.gif') no-repeat",
      //     opacity: 1,
      //     width: "350px"
      //   },
      //   closeBoxMargin: "12px 4px 2px 2px",
      //   // closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
      //   closeBoxURL: "img/close-window-24.gif",
      //   infoBoxClearance: new google.maps.Size(1, 1)
      // }),

      // a map info window that will be reused to display different museum object details
      infowindow: new google.maps.InfoWindow({
        content: ''
      }),
      placeTypeInPrefOrder: ["neighborhood", "political", "locality", "administrative_area_level_4", "administrative_area_level_3", "administrative_area_level_2"],
      //TODO londonTypeInPrefOrder: ["neighborhood", "postal_code"],
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      obsArrayMapMarkers: ko.observableArray([]), // array to store all map marker objects
      obsArrayPlaceObjects: ko.observableArray([]),
      obsSelectedPlace: ko.observable(false),
      // obsUserLocalPlace is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalPlace: ko.observable(false),
      obsFilterSearch: ko.observable(''),
      // observable OBSERVABLE ARRAY for museum objects within selected place
      placeName: ko.observable('typograph')
    };

    // add knockout computed variables outside of mapsModel object literal definition
    // as referencing other ko.observables inside mapsModel not possible until defined?

    mapsModel.compFilterMapList = ko.computed({
      read: function() {
        var filterString = mapsModel.obsFilterSearch().toLowerCase();
        if (filterString === '') {
          // no need for any filter as input text is empty
          return mapsModel.obsArrayMapMarkers();
        } else {
          // filter all map markers on input text
          return ko.utils.arrayFilter(mapsModel.obsArrayMapMarkers(), function(markerObj) {
            var markerPlaceName = markerObj.bestPlace.formatted_address.toLowerCase();
            var match = markerPlaceName.indexOf(filterString);
            if (match >= 0) {
              return true;
            } else {
              return false;
            }
          });
        }
      },
      write: function(value) {
        //TODO return (value);
      }
    });

    mapsModel.compSortedMapMarkers = ko.computed(function() {
      var data = mapsModel.compFilterMapList();
      return data.sort(function(left, right) {
        var shortLeftName = left.bestPlace.address_components[0].short_name;
        var shortRightName = right.bestPlace.address_components[0].short_name;
        return shortLeftName == shortRightName ? 0 : (shortLeftName < shortRightName ? -1 : 1);
      });
    });

    mapsModel.compNumOfPlacesShowing = ko.computed(function() {
      var count = mapsModel.compFilterMapList().length;
      var total = mapsModel.obsArrayMapMarkers().length;
      if (count === total) {
        return false;
      } else if (count === 0) {
        return 'no results';
      } else {
        return count + ' of ' + total + ' places';
      }
    });

    mapsModel.compFilterLabel = ko.computed(function() {
      var count = mapsModel.compFilterMapList().length;
      var total = mapsModel.obsArrayMapMarkers().length;
      if (count === total) {
        return 'Filter Places';
      } else {
        return 'Clear Filter';
      }
    });

    // END mapsModel
    //---------------------------------------------------------------------------

    var simpleFormattedplaceName = function(place) {
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
    //  museumDataHelpers MODULE
    //-----------------------------------------------------
    var museumDataHelpers = function() {

      function clearFilter() {
        mapsModel.obsFilterSearch('');
        mapHelpers.showAllMarkers();
      }

      function getMuseumPlaces(museumMarker, preferedPlace, searchRadius) {
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
            latitude: preferedPlace.geometry.location.lat,
            longitude: preferedPlace.geometry.location.lng,
            orderby: "distance", // order results by closest distance to search loc
            radius: searchRadius, // km radius to restrict search results
            limit: 45, // note: 45 is max amount of museum objects results allowed on a single AJAX call by API
            //images: 1 // only get results with images
          },
          url: 'http://www.vam.ac.uk/api/json/place/search', // V&A museum collection.places search REST service
          isLoaded: 'no'
        };
        // setup the musuem places from existing museumData if available
        var placeDataResults = placeDataIfExists(preferedPlace.place_id);
        // no exisitng museumData
        if (placeDataResults !== false) {
          // setup a new object literal to store museum data in musuemMarker
          var museumCollectionDataObj = {
            googlePlace: preferedPlace,
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection, // property name used in musuemData to store data
            museumData: placeDataResults // new musuem data
          };
          return museumCollectionDataObj;
        } else {
          // else use async AJAX call to try and get some place data
          var index = 0; // NOTE needed as first argument to getAsyncResource function
          getAsyncResource(index, resourceRefObj, preferedPlace, museumMarker);
          // immediately return empty object - async callback side effect adds the data
          return {};
        }
      }

      function getPrefPlaceMusuemObjects(museumMarker) {
        if (museumMarker.VaM()) {
          if (museumMarker.VaM().hasOwnProperty('place')) {
            var resultsArray = [];
            var musMarkerPlacesArray = museumMarker.VaM().place;
            for (var i = 0; i < musMarkerPlacesArray.length; i++) {
              var musPlace = musMarkerPlacesArray[i];

            }
          }

        }

      }

      function getPlaceMusuemObjects(placePrimaryKey) {
        var index = 0; // NOTE needed as first argument to getAsyncResource function
        var resourceName = 'V&A - museum placeObjects for collection.place - pk: ' + placePrimaryKey;
        var resourceRefObj = {
          name: resourceName,
          modelCollection: 'placeObjects',
          dataType: 'json',
          search_parameters: {
            place: placePrimaryKey
          },
          url: 'http://www.vam.ac.uk/api/json/museumobject/', // V&A museum collection.museumobject search REST service
          isLoaded: 'no'
        };

        var placeObjectsExist = ObjPKeyDataExists(resourceRefObj.modelCollection, placePrimaryKey);

        if (placeObjectsExist !== false) {
          // we have musuemData for place pk:
          // so populate the placeObjects data without using AJAX call
          // TODO ***NEEDS DOING***
          // return museumPlaceObj;
        } else {
          // make an AJAX async call for placeObjects data
          getAsyncResource(index, resourceRefObj);
          // immediately return empty object - async callback side effect adds the data
          return {};
        }
      }

      function getmuseumObjectDetails(museumObjectNumber) {
        var index = 0; // NOTE needed as first argument to getAsyncResource function
        var resourceName = 'V&A - museum object details:  ' + museumObjectNumber;
        var resourceRefObj = {
          name: resourceName,
          modelCollection: 'objectDetails',
          dataType: 'json',
          search_parameters: {
            object_number: "O153358"
          },
          url: 'http://www.vam.ac.uk/api/json/museumobject/', // V&A museum collection.museumobject search REST service
          isLoaded: 'no'
        };
        var ObjectDetailsResults = false;

        if (ObjectDetailsResults !== false) {
          // populate the placeObjects data from musuemData
          // TODO ***NEEDS DOING***
          // return ObjectDetailsObj;
        } else {
          // make an AJAX async call for placeObjects data
          getAsyncResource(index, resourceRefObj);
          // immediately return empty object - async callback side effect adds the data
          return {};
        }
      }

      function ObjPKeyDataExists(dataName, keyName) {
        // placeID is preferred google place id
        if (!museumApp.museumData.hasOwnProperty('data')) {
          // no musuem data (e.g if browsers localstorage is disabled)
          return false;
        } else if (museumApp.museumData.data.hasOwnProperty(dataName)) {
          var value = museumApp.museumData.data[dataName].keyName;
          if (value) {
            console.log('------------');
            console.dir(value);
            return value;
          } else {
            return result; // false
          }
        } else {
          // no dataName in musuemData
          return false;
        }
      }

      function placeDataIfExists(placeId) {
        // placeID is preferred google place id
        if (!museumApp.museumData.hasOwnProperty('data')) {
          // there isn't any musuem data
          return false;
        } else if (museumApp.museumData.data.hasOwnProperty('place')) {
          var prefPlaceArray = museumApp.museumData.data.place;
          var result = false;
          for (var j = 0; j < prefPlaceArray.length; j++) {
            var placeObj = prefPlaceArray[j];
            if (placeObj.resourceRefObj.placeID === placeId) {
              // museumData has the preferred place data
              result = true;
              return placeObj;
            }
          }
          return result; // false
        } else {
          // no preferred place_id match in musuemData
          return false;
        }
      }

      return {
        getMuseumPlaces: getMuseumPlaces,
        getPlaceMusuemObjects: getPlaceMusuemObjects,
        getmuseumObjectDetails: getmuseumObjectDetails,
        clearFilter: clearFilter
      };
    }(museumDataHelpers);
    //  END museumDataHelpers MODULE
    //-----------------------------------------------------

    //-----------------------------------------------------
    //  mapHelpers MODULE
    //-----------------------------------------------------
    var mapHelpers = function() {

      var makeLondonPolygons = function() {
        var londonPolygonArray = [];
        var LondonAreaTriCoords = [{
          lat: 51.51942532808189,
          lng: -0.391387939453125
        }, {
          lat: 51.61545844207286,
          lng: -0.2190399169921875
        }, {
          lat: 51.64103302109062,
          lng: -0.10162353515625
        }, {
          lat: 51.5954149508168,
          lng: 0.031585693359375
        }, {
          lat: 51.549751017014195,
          lng: 0.11260986328125
        }, {
          lat: 51.49121712928709,
          lng: 0.1318359375
        }, {
          lat: 51.42104840561726,
          lng: 0.0494384765625
        }, {
          lat: 51.40306101512005,
          lng: -0.078277587890625
        }, {
          lat: 51.40777268236964,
          lng: -0.22247314453125
        }, {
          lat: 51.47240196119371,
          lng: -0.3714752197265625
        }];
        var centralLondonTriCoords = [{
          lat: 51.520493477218274,
          lng: -0.16736984252929688
        }, {
          lat: 51.535872047109315,
          lng: -0.10969161987304688
        }, {
          lat: 51.53864817973768,
          lng: -0.034503936767578125
        }, {
          lat: 51.50307952226442,
          lng: -0.016651153564453125
        }, {
          lat: 51.4973090140083,
          lng: -0.09304046630859375
        }, {
          lat: 51.47122575543907,
          lng: -0.11707305908203125
        }, {
          lat: 51.4608524464555,
          lng: -0.17526626586914062
        }, {
          lat: 51.47218810785753,
          lng: -0.20788192749023438
        }, {
          lat: 51.4973090140083,
          lng: -0.22212982177734375
        }, {
          lat: 51.51739577570338,
          lng: -0.20341873168945312
        }];
        // a google map polygon that roughly defines 'london'
        var londonArea = new google.maps.Polygon({
          paths: LondonAreaTriCoords,
          strokeColor: '#FF0000',
          strokeOpacity: 0.1,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.1
        });
        // a google map polygon that roughly defines 'central london'
        var centralLondon = new google.maps.Polygon({
          paths: centralLondonTriCoords,
          strokeColor: 'blue',
          strokeOpacity: 0.1,
          strokeWeight: 2,
          fillColor: 'blue',
          fillOpacity: 0.1
        });
        londonPolygonArray.push({
          name: 'londonArea',
          polygon: londonArea
        });
        londonPolygonArray.push({
          name: 'centralLondon',
          polygon: centralLondon
        });
        return londonPolygonArray;
      };

      var markerListClick = function(musuemMarker) {
        panMapToMuseumMarker(musuemMarker);
        openInfoWindow(musuemMarker);
      };

      var removeMarker = function(musuemMarker) {
        //console.dir(musuemMarker);
      };

      var showAllMarkers = function() {
        var markerCount = mapsModel.compFilterMapList().length;
        // only zoom if there are some markers (e.g use of the filter)
        if (markerCount > 0) {
          if (markerCount === 1) {
            // no need for bounds calc jus pan to single marker & show infowindow
            var musuemMarker = mapsModel.compFilterMapList()[0];
            panMapToMuseumMarker(musuemMarker);
            openInfoWindow(musuemMarker);
          } else {
            var bounds = new google.maps.LatLngBounds();
            // set map bounds to include all filtered markers
            var museumMapMarkerArray = mapsModel.compFilterMapList();
            for (var i = 0; i < museumMapMarkerArray.length; i++) {
              var mapMarker = museumMapMarkerArray[i].prefPlaceMarker;
              bounds.extend(mapMarker.getPosition());
            }
            // fit the map bounds to show all markers
            delayedFitBounds(bounds);
            //mapsModel.googleMap.panToBounds(bounds);
            if (mapsModel.googleMap.getZoom() > 12) {
              // when bounds fitting a single marker
              // the map zooms in too far, so back up again to zoom level 12
              mapsModel.googleMap.setZoom(12);
            }
          }
        } else {
          console.log('no markers on map for bounds');
        }
      };

      function delayedFitBounds(bounds) {
        // NOTE TODO not sure why this delay is needed for bounds fit to work properly?????
        setTimeout(function() {
          mapHelpers.closeInfoWindow();
          mapsModel.googleMap.fitBounds(bounds);
        }, 10); // wait before running
      }

      function rebuildMarkersFromMusuemData() {
        var museumDataArray = museumApp.museumData.data.place;
        console.log('rebuild ' + museumDataArray.length + ' markers from museumData');
        for (var count = 0; count < museumDataArray.length; count++) {
          rebuildMarker(museumDataArray[count]);
        }
        showAllMarkers();
      }

      function rebuildMarker(mapMarkerDataObj) {
        var markerIndexRef = mapMarkerExistsRef(mapMarkerDataObj);
        // marker already exists in the viewModel
        if (markerIndexRef) {
          //TODO
          //
        } else {
          // the marker is not in already in viewModel
          // create new museumMarker
          var newMarker = makePrefPlaceMarker(mapMarkerDataObj.googlePlace);
          // add musuem data to new museumMarker
          updateMuseumMarker(mapMarkerDataObj.resourceRefObj.modelCollection, mapMarkerDataObj.museumData, newMarker);
        }
      }

      var prefPlacePinOptions = function pinSymbol(colour) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
          fillColor: colour,
          fillOpacity: 0.5,
          strokeColor: 'salmon',
          strokeWeight: 2.5,
          scale: 0.65
        };
      };

      var musuemPlacePinOptions = function pinSymbol() {
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "salmon",
          fillOpacity: 1,
          strokeColor: 'yellow',
          strokeWeight: 1,
          scale: 4,
        };
      };

      var selectPrefPlace = function(prefPlace) {
        mapsModel.obsSelectedPlace(prefPlace);

      };

      var togglePlaceMarkerBounce = function(placeMarkerObj) {
        // var markerObj = placeMarkerObj.prefPlaceMarker;
        // if (markerObj.getAnimation() !== null) {
        //   markerObj.setAnimation(null);
        // } else {
        //   markerObj.setAnimation(google.maps.Animation.BOUNCE);
        //   setTimeout(function() {
        //     markerObj.setAnimation(null);
        //   }, 1400); // a bit of a kludge
        // }
      };

      var searchUsersLocation = function() {
        var geoPosObj = ko.utils.unwrapObservable(mapsModel.obsUserLocalPlace);
        if (geoPosObj) {
          var latLng = {
            lat: geoPosObj.geoPosition.coords.latitude,
            lng: geoPosObj.geoPosition.coords.longitude
          };
          mapsModel.obsFilterSearch('');
          // add museum marker at pref place closest to users geoloction
          searchHere(latLng);
        }
      };

      var panMapToLocation = function(loc) {
        map.panTo(loc);
        map.setZoom(9);
      };

      var panMapToMuseumMarker = function(museumMarker) {
        closeInfoWindow();
        var bestPlace = museumMarker.bestPlace;
        mapsModel.googleMap.fitBounds(bestPlace.geometry.bounds);
        togglePlaceMarkerBounce(museumMarker);
      };

      var closeInfoWindow = function() {
        mapsModel.infowindow.close();
        uiModel.obsInfowindowVisible(false);
      };

      var openInfoWindow = function(musuemMarkerObj) {
        var mapMarker = musuemMarkerObj.prefPlaceMarker;
        // get musuem marker infowIndow content
        // var content = infoWindowContents(musuemMarkerObj);
        console.log('-------');
        console.log(musuemMarkerObj.prefPlaceMarker.labelContent);
        var test = mapsModel.infowindow.getContent();
        console.log(typeof(test));
        // var content = document.getElementById("infobox");
        // console.dir(content);

        //mapsModel.infowindow.setContent(content);
        // open musuem marker infowindow
        mapsModel.infowindow.open(mapsModel.googleMap, mapMarker);
        uiModel.obsInfowindowVisible(true);
      };

      var updateInfoWindow = function(musuemMarker) {
        // var content = mapsModel.infowindow.getContent();
        content = '';
      };

      // center map on location
      var centerMap = function(loc) {
        map.setCenter(loc);
        //google.maps.event.trigger(map, 'resize');
      };

      var getMapCenter = function() {
        return mapsModel.googleMap.getCenter();
      };

      //--------------------------------------------------------------------------------
      // Function: makePrefPlaceMarker - makes a map marker to hold all museum data
      //--------------------------------------------------------------------------------
      var makePrefPlaceMarker = function(bestPlace) {
        var markerLabel = '';
        var placeAddressType = bestPlace.address_components[0].types[0];
        if (placeAddressType === 'street_number') {
          // use the street name not the street number for marker label
          markerLabel = bestPlace.address_components[1].long_name;
        } else {
          markerLabel = bestPlace.address_components[0].long_name;
        }
        // create a google map marker for bestPlace
        var marker = new MarkerWithLabel({
          position: bestPlace.geometry.location,
          map: mapsModel.googleMap,
          icon: mapHelpers.prefPlacePinOptions("yellow"),
          id: bestPlace.place_id, // a unique google map placeID reference to bestPlace
          draggable: false,
          labelContent: markerLabel, // name for marker label
          labelAnchor: new google.maps.Point(5, 0),
          labelClass: "place-labels",
          labelInBackground: false,
          labelVisible: true,
          visible: true,
          animation: google.maps.Animation.DROP
        });
        // create 'musuemMarker' object literal
        var museumMarker = {
          VaM: ko.observable({}),
          prefPlaceMarker: marker,
          bestPlace: bestPlace
        };
        // add click handler for marker
        marker.addListener('click', function(e) {
          closeInfoWindow();
          panMapToMuseumMarker(museumMarker);
          openInfoWindow(museumMarker);
        });
        // add marker to ko observable array for tracking, disposal etc
        mapsModel.obsArrayMapMarkers.push(museumMarker);
        return museumMarker;
      };

      var makeMusuemObjectPlaceMarker = function(musuemMarker) {
        // create a google map marker for bestPlace
        var marker = new MarkerWithLabel({
          position: bestPlace.geometry.location,
          map: map,
          icon: mapHelpers.musuemPlacePinOptions(),
          id: bestPlace.place_id, // a unique google map placeID reference to bestPlace
          draggable: false,
          labelContent: "",
          labelAnchor: new google.maps.Point(20, 0),
          labelClass: "labels",
          labelInBackground: false,
          visible: false
        });
        // museumMarker object
        var museumMarker = {
          prefPlaceMarker: marker,
          bestPlace: bestPlace
        };

        // add click handler to marker
        marker.addListener('click', function(e) {
          closeInfoWindow();
          // TODO
        });
        // add marker to obsArrayMapMarkers array to track it for disposal etc
        //mapsModel.obsArrayMapMarkers.push(museumMarker);
        return museumMarker;
      };

      var infoWindowContents = function(museumMarker) {
        var contentString = '';

        if (museumMarker.VaM()) {
          // marker has some musuem data
          if (museumMarker.VaM().hasOwnProperty('place')) {

          }

          return document.getElementById("infobox");

        } else {
          // musuem marker does not have any musuem data so construct a 'loading data' div
          contentString += '<div class="ui segment info-window-content">';
          contentString += '      <div class="ui active inverted dimmer">';
          contentString += '        <div class="ui text loader">Loading</div>';
          contentString += '      </div>';
          contentString += '</div>';
        }
        return contentString;
      };
      //------------------------------------------------------------------------

      function searchHere(location) {
        // if location is not valid google LatLng object (e.g comes from initmuseumPlaces)
        // convert it to a google LatLng
        if (!(location instanceof google.maps.LatLng)) {
          location = new google.maps.LatLng(location.lat, location.lng);
        }
        var map = mapsModel.googleMap;
        // use geocoder to find 'preferred place'
        mapsModel.geocoder.geocode({
          'location': location,
          'bounds': map.bounds // bias search results to the visible area of map
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              var peferedPlaceP = function(curElement, index) {
                // local function used by $.grep function
                // - see below looks for preferred types of addresses in the address types
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
              var searchRadius = 5; // default search radius for getMuseumPlaces
              var bestPlace = false;
              if (bestPlaceResults.length > 0) {
                var inlondonPoly = inLondon(location);
                if (inlondonPoly) {
                  // if search location in within london make search radius much smaller
                  // as V&M place data is much richer
                  if (inlondonPoly.name === 'centralLondon') {
                    searchRadius = 0.5;
                  } else if (inlondonPoly.name === 'londonArea') {
                    searchRadius = 2;
                  }
                  // use original geocoder results rather than bestPlaceResults
                  // so we an have a street address closer to the actual location
                  bestPlace = results[0];
                } else {
                  // choose first address from filtered bestPlaceResults
                  bestPlace = bestPlaceResults[0];
                }
              } else {
                console.log('no peferedPlaceP address');
                // no best place so choose first address of the original geocode results
                // usually a 'street address'
                bestPlace = results[0];
              }
              // check if preferred marker already exists for place
              var markerforPlace = mapMarkerExistsRef(bestPlace);
              if (markerforPlace !== false) {
                panMapToMuseumMarker(markerforPlace);
                openInfoWindow(markerforPlace);
                console.log('marker already exits for ' + bestPlace.formatted_address);
              } else {
                // create a museumMarker for the bestPlace
                var prefPlaceMarker = makePrefPlaceMarker(bestPlace);
                // clear map filter if present
                if (mapsModel.obsFilterSearch !== '') {
                  museumDataHelpers.clearFilter();
                }
                panMapToMuseumMarker(prefPlaceMarker);
                openInfoWindow(prefPlaceMarker);
                // and populate prefPlaceMarker with V&A museum place search
                museumDataHelpers.getMuseumPlaces(prefPlaceMarker, bestPlace, searchRadius);
              }
            } else {
              console.log('no geocode results found');
              return false;
            }
          } else {
            console.log('Gocoder Error: ' + status);
            return false;
          }
        });
      }

      function inLondon(location) {
        var centralLondonObj = mapsModel.londonPolygonAreas[1];
        var londonAreaObj = mapsModel.londonPolygonAreas[0];
        if (centralLondonObj.polygon.containsLatLng(location)) {
          console.log('central london');
          return centralLondonObj;
        } else if (londonAreaObj.polygon.containsLatLng(location)) {
          console.log('london');
          return londonAreaObj;
        } else {
          return false;
        }
      }

      function mapMarkerExistsRef(testPlace) {
        var markerArray = mapsModel.obsArrayMapMarkers();
        // check if new best place google ID is within an existing marker
        for (var count = 0; count < markerArray.length; count++) {
          if (markerArray[count].bestPlace.place_id == testPlace.place_id) {
            return markerArray[count];
          }
        }
        return false;
      }

      // Polygon getBounds extension - google-maps-extensions
      // https://github.com/tparkin/Google-Maps-Point-in-Polygon
      // http://code.google.com/p/google-maps-extensions/source/browse/google.maps.Polygon.getBounds.js
      if (!google.maps.Polygon.prototype.getBounds) {
        google.maps.Polygon.prototype.getBounds = function(latLng) {
          var bounds = new google.maps.LatLngBounds(),
            paths = this.getPaths(),
            path,
            p, i;
          for (p = 0; p < paths.getLength(); p++) {
            path = paths.getAt(p);
            for (i = 0; i < path.getLength(); i++) {
              bounds.extend(path.getAt(i));
            }
          }
          return bounds;
        };
      }

      // Polygon containsLatLng - method to determine if a latLng is within a polygon
      google.maps.Polygon.prototype.containsLatLng = function(latLng) {
        // Exclude points outside of bounds as there is no way they are in the poly
        var inPoly = false,
          bounds, lat, lng,
          numPaths, p, path, numPoints,
          i, j, vertex1, vertex2;
        // Arguments are a pair of lat, lng variables
        if (arguments.length == 2) {
          if (
            typeof arguments[0] == "number" &&
            typeof arguments[1] == "number"
          ) {
            lat = arguments[0];
            lng = arguments[1];
          }
        } else if (arguments.length == 1) {
          bounds = this.getBounds();
          if (!bounds && !bounds.contains(latLng)) {
            return false;
          }
          lat = latLng.lat();
          lng = latLng.lng();
        } else {
          console.log("Wrong number of inputs in google.maps.Polygon.prototype.contains.LatLng");
        }
        // Raycast point in polygon method
        numPaths = this.getPaths().getLength();
        for (p = 0; p < numPaths; p++) {
          path = this.getPaths().getAt(p);
          numPoints = path.getLength();
          j = numPoints - 1;
          for (i = 0; i < numPoints; i++) {
            vertex1 = path.getAt(i);
            vertex2 = path.getAt(j);
            if (
              vertex1.lng() < lng &&
              vertex2.lng() >= lng ||
              vertex2.lng() < lng &&
              vertex1.lng() >= lng
            ) {
              if (
                vertex1.lat() +
                (lng - vertex1.lng()) /
                (vertex2.lng() - vertex1.lng()) *
                (vertex2.lat() - vertex1.lat()) <
                lat
              ) {
                inPoly = !inPoly;
              }
            }
            j = i;
          }
        }
        return inPoly;
      };

      //-----------------------------------------------------
      //  mapHelpers - public vars & functions
      //-----------------------------------------------------
      return {
        makeLondonPolygons: makeLondonPolygons,
        markerListClick: markerListClick,
        removeMarker: removeMarker,
        showAllMarkers: showAllMarkers,
        selectPrefPlace: selectPrefPlace,
        searchHere: searchHere,
        centerMap: centerMap,
        getMapCenter: getMapCenter,
        prefPlacePinOptions: prefPlacePinOptions,
        musuemPlacePinOptions: musuemPlacePinOptions,
        rebuildMarkersFromMusuemData: rebuildMarkersFromMusuemData,
        rebuildMarker: rebuildMarker,
        searchUsersLocation: searchUsersLocation,
        panMapToMuseumMarker: panMapToMuseumMarker,
        mapMarkerExistsRef: mapMarkerExistsRef,
        closeInfoWindow: closeInfoWindow
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
          museumApp.addMessage('local location not found 😞 with error: ' + geolocationErrorCodes[error]);
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
            mapTypeControl: false,
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_CENTER
            },
            scaleControl: true,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            center: new google.maps.LatLng(51.478771, -0.011074),
            zoom: 11
          });
          mapsModel.googleMap = map; // debug helper
          mapsModel.geocoder = new google.maps.Geocoder(map);
          // get google map polygons that represent 'london area' and 'central london'
          mapsModel.londonPolygonAreas = mapHelpers.makeLondonPolygons();
          // NOTE: uncomment below to make poly areas draw on map
          // mapsModel.londonPolygonAreas.forEach(function(entry) {
          //   entry.polygon.setMap(map);
          // });

          //---------------------------------------------------------------------
          // Create a DIV to hold custom map control and call the CenterControl()
          // constructor passing in this DIV.
          //---------------------------------------------------------------------
          var centerControlDiv = document.createElement('div');
          var centerControl = new CenterControl(centerControlDiv, map);
          centerControlDiv.index = 1;
          mapsModel.searchHereControl = centerControlDiv;
          mapsModel.googleMap.controls[google.maps.ControlPosition.CENTER].push(mapsModel.searchHereControl);
          centerControlDiv.style.display = 'inline';
          //---------------------------------------------------------------------
          // function to filter observable array of map markers

          var markerLabelsDisplay = function() {
            var zoomLimit = (mapsModel.googleMap.zoom > 7) ? true : false;
            var markers = mapsModel.compFilterMapList();
            for (var i = 0; i < markers.length; i++) {
              markers[i].prefPlaceMarker.labelVisible = zoomLimit;
            }
          };

          var filterMarkersOnMap = function() {

          };
          // map bounds_changed event handler
          map.addListener('bounds_changed', function() {
            filterMarkersOnMap();
          });
          // map zoom event handler
          map.addListener('zoom_changed', function() {
            markerLabelsDisplay();
            filterMarkersOnMap();
          });
          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, "resize");
            mapsModel.googleMap.setCenter(center);
          });
          // infowWindow close button handler
          // NOTE we are using a google infobox not infowindow
          google.maps.event.addListener(mapsModel.infowindow, 'closeclick', function(event) {
            mapHelpers.closeInfoWindow();
          });

          // NOTE CenterControl code from
          // example https://developers.google.com/maps/documentation/javascript/examples/control-custom
          function CenterControl(controlDiv, map) {
            //Set CSS for the control border.
            var controlUI = document.createElement('div');
            controlUI.style.backgroundColor = 'rgba(255,255,255,0.6)';
            controlUI.style.border = '3px solid #fff';
            controlUI.style.borderRadius = '8px';
            controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,0.75)';
            controlUI.style.cursor = 'pointer';
            controlUI.style.marginBottom = '12px';
            controlUI.style.textAlign = 'bottom';
            controlUI.title = 'searchControl';
            controlDiv.appendChild(controlUI);
            // Set CSS for the control interior.
            var controlText = document.createElement('div');
            controlText.style.color = 'rgb(25,25,25)';
            controlText.style.fontFamily = 'Noticia Text,Arial,sans-serif';
            controlText.style.fontSize = '14px';
            controlText.style.lineHeight = '32px';
            controlText.style.paddingLeft = '8px';
            controlText.style.paddingRight = '8px';
            controlText.innerHTML = 'Search Here';
            controlUI.appendChild(controlText);

            //Setup the click event listener
            controlUI.addEventListener('click', function() {
              var mapCenter = mapsModel.googleMap.getCenter();
              // getCenterdoes not return a functional LatLng object  so we make one
              var location = new google.maps.LatLng(mapCenter.lat(), mapCenter.lng());
              mapHelpers.searchHere(location);
            });
          }
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          if (uiModel.obsInfowindowVisible()) {
            // hide display center 'search here' control if infoWindow is open
            mapsModel.googleMap.controls[google.maps.ControlPosition.CENTER].clear();
          } else {
            // restore center 'search here' control on map if infoWindow is closed
            mapsModel.googleMap.controls[google.maps.ControlPosition.CENTER].push(mapsModel.searchHereControl);
          }
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
      mapsModel.obsSelectedPlace.subscribe(function(value) {
        console.log('obsSelectedPlace changed');
      }, null, "change");

      mapsModel.compFilterMapList.subscribe(function(value) {
        mapHelpers.showAllMarkers();
      }, null, "change");

      mapsModel.obsFilterSearch.subscribe(function(value) {
        mapHelpers.showAllMarkers();
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
        console.log(' ' + musObj.fields.type + ' ' + musObj.fields.museumobject_count + ' museum objects');
      }
    }

    //-----------------------------------------------------
    // configure the museum apps Knockout ViewModel
    koBindingHandlers();
    koSubscribers();
    // try and get users location as a prefered googleMap place
    // if succeeds in getting a place it makes a map marker and enables a
    // 'Go Local' button in App UI for navigation
    // NOTE runs async browser location service so a callback will set this later
    getUsersLocalPlace();

    return {
      // export PUBLIC functions and variables for MusAppViewModel -
      uiModel: uiModel,
      mapsModel: mapsModel,
      mapHelpers: mapHelpers,
      museumDataHelpers: museumDataHelpers
    };
    //---------------------------------------------------------
  };
  // END MODULE MusAppViewModel
  //---------------------------------------------------------

  return {
    // museumApp - export PUBLIC functions and variables
    museumViewModel: museumViewModel,
    init: init,
    initAppLibs: initAppLibs,
    museumData: museumData,
    museumDataReady: museumDataReady,
    initmuseumPlaces: initmuseumPlaces,
    addMessage: addMessage,
    localStorageP: localStorageP
      // NOTE: for debug aid
      // initAppLibs: initAppLibs,
  };
  // END MODULE museumApp
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
  // INIT museum APP
  //-----------------------------
  museumApp.init();
  //-----------------------------
  var makeInitMapmuseumData = function() {
    var initData = museumApp.initmuseumPlaces;
    if ((!museumApp.localStorageP()) || (museumApp.museumData.data === undefined)) {
      console.log('first time app run or no local storage');
      // localStorage is disabled or is the first time app is run.
      // so make some default museumMarkers using lat lng locations in initmuseumPlaces
      if (initData.length > 0) {
        for (var i = 0; i < initData.length; i++) {
          var placeRef = initData[i];
          console.dir(placeRef);
          // doing a 'map search' at locations defined in initmuseumPlaces creates museumMarkers
          museumApp.museumViewModel.vm.mapHelpers.searchHere(placeRef.location);
        }
      }
    } else { // we have localStorage museumData
      museumApp.museumViewModel.vm.mapHelpers.rebuildMarkersFromMusuemData();
    }
  };
  // initmuseumPlaces function is called with short setTimeout
  // to allow museum app to allow all initalising and before
  // we try and rebuild museumMarkers from museum data
  setTimeout(function() {
    makeInitMapmuseumData();
  }, 500); // wait before running

});
//---------------------------------------------------------
