//---------------------------------------------------------
//    museumApp MODULE
//---------------------------------------------------------

var museumApp = (function() {
  var debugMessageArea = false;
  // vars are objects as museumApp will add property values
  var museumData = {};
  var museumViewModel = {
    ready: false
  };
  //--------------------------------------
  // appLibraryTests MODULE
  //--------------------------------------
  var appLibraryTests = function() {

    function objectTest(libResource) {
      return (typeof window[libResource.name] === 'object');
    }

    function functionTest(libResource) {
      return (typeof window[libResource.name] === 'function');
    }
    //-----------------------------------------------------
    //  appLibraryTests - public functions
    //-----------------------------------------------------
    return {
      objectTest: objectTest,
      functionTest: functionTest,
    };

  }(appLibraryTests);
  //  END appLibraryTests MODULE

  //----------------------------------------------------------------------------
  // initAppLibs array defines external script need before our app can run
  //----------------------------------------------------------------------------
  var initAppLibs = [{
    // markerwithlabel.js library
    name: 'MarkerWithLabel',
    dataType: 'script',
    url: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/master/markerwithlabel/src/markerwithlabel.js',
    isLoaded: 'no',
    libraryTest: 'functionTest',
    isReady: false
  }, {
    // google maps infobox api
    name: 'InfoBox',
    dataType: 'script',
    url: 'https://cdn.rawgit.com/googlemaps/v3-utility-library/master/infobox/src/infobox.js',
    isLoaded: 'no',
    libraryTest: 'functionTest',
    isReady: false
  }, {
    // knockout.js library
    name: 'ko',
    dataType: 'script',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/knockout/3.4.0/knockout-min.js',
    isLoaded: 'no',
    libraryTest: 'objectTest',
    isReady: false
  }];

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
  }, {
    name: "Oxford, UK",
    location: {
      lat: 51.7520209,
      lng: -1.2577263000000585
    }
  }, {
    name: "Canterbury, Kent, UK",
    location: {
      lat: 51.280233,
      lng: 1.0789088999999876
    }
  }];

  var localStorageP = function() {
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
  };

  var makeInitMapmuseumData = function() {
    var initData = initmuseumPlaces;
    if ((!museumApp.localStorageP()) || (museumApp.museumData.data === undefined)) {
      // localStorage is disabled or is the first time app is run.
      // so make some default museumMarkers using lat lng locations in initmuseumPlaces
      console.log('first time app run or no local storage');
      makeDefaultMusuemPlaces(initData);
    } else { // we have localStorage museumData
      museumApp.museumViewModel.vm.mapHelpers.rebuildMarkersFromMusuemData();
    }
  };

  var makeDefaultMusuemPlaces = function(initData) {
    if (initData.length > 0) {
      for (var i = 0; i < initData.length; i++) {
        var placeRef = initData[i];
        // doing a 'map search' at locations defined in initmuseumPlaces creates museumMarkers
        museumApp.museumViewModel.vm.mapHelpers.searchHere(placeRef.location);
      }
    }
  };
  //-------------------
  //  init museum APP
  //-------------------
  var init = function() {
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
      }
    }
    //--------------------------------------------------------------------------
    //  Async requests for MUSUEM DATA & JAVASCRIPT resources required for app
    //--------------------------------------------------------------------------
    $.each(initAppLibs, getAsyncResource);
    addMessage('AJAX javascript REQUESTS : ' + initAppLibs.length);

    var allAppLibrariesReady = function() {
      var count = 0;
      for (var i = 0; i < initAppLibs.length; i++) {
        var resourceRefObj = initAppLibs[i];
        if (checkLibraryIsReady(resourceRefObj)) {
          count = count + 1;
        }
      }
      // return test on all required script libraries ready
      return (count === initAppLibs.length);
    };

    var checkLibraryIsReady = function(resourceRefObj) {
      if (resourceRefObj.isReady === true) {
        // dont need to do the library test if it has already passed once
        return true;
      } else {
        // get a function to test resourceRefObj
        var testFunction = appLibraryTests[resourceRefObj.libraryTest];
        if (testFunction(resourceRefObj)) {
          // passes ready test - set property in resourceRefObj
          resourceRefObj.isReady = true;
          return true;
        } else {
          // fails ready test
          return false;
        }
      }
    };

    var bootApp = function() {
      // NOTE: sorry, this code below seems a bit of hack to handle both the async callbacks and
      // requirement to only create the knockout viewModel & applyBindings a single time
      // on load resource success, we try to initalise the museum app, this can only happen
      // when all required scripts and museumData for app have loaded.

      if (allAppLibrariesReady()) {
        clearInterval(appBootstrap);
        // all of the musuem app libraries have loaded and tested true
        console.log('😀 museum App Scripts READY');
        addMessage('😀 museum App Scripts READY');
        //-----------------------------------
        // create Knockout options & APP VIEWMODEL
        ko.options.deferUpdates = true;
        var vm = new MusAppViewModel();
        // add the vm as new property of museumViewModel prototype object
        museumViewModel.vm = vm;
        //-----------------------------------
        // apply bindings APP VIEWMODEL
        ko.applyBindings(museumViewModel.vm);
        museumViewModel.ready = true;
        addMessage(' 😀 viewmodel READY');
        makeInitMapmuseumData();
        return true;
      } else {
        return false;
      }
    };

    var initTakingTooLong = function() {
      clearInterval(appBootstrap);
      if (!allAppLibrariesReady()) {
        console.log('sorry the musuem app is not working');
      }
    };

    // start an INTERVAL for 'areweready'
    var appBootstrap = window.setInterval(bootApp, 50);
    // TIMEOUT when interval is taking too much time
    window.setTimeout(initTakingTooLong, 3500);

  };
  //-------------------
  // END init
  //-------------------

  var getAsyncResource = function(index, resourceRefObj, updateObjectRef) {
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
      //----------------------------------------------------------------
      if (resourceRefObj.dataType === 'json') {
        // callback returned musuem data resource
        var museumCollectionDataObj = {}; // an object literal for musuemData
        var musuemCollectionType = resourceRefObj.modelCollection;
        if (musuemCollectionType === 'place') {
          // an object literal for 'place' musuemData
          museumCollectionDataObj = {
            googlePlace: updateObjectRef.bestPlace,
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection,
            museumData: museumDataResult
          };
          // places are also stored inside the Museum Marker so it has
          // references to the musuem places near it
          updateTheMuseumMarker(musuemCollectionType, museumDataResult, updateObjectRef);
          //------------------------------------------------------------
        } else if (musuemCollectionType === 'placeObjects') {
          // an object literal for 'placeObjects' musuemData
          museumCollectionDataObj = {
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection,
            museumData: museumDataResult
          };
        }
        // update musuemData and localstorage cache
        if ($.isEmptyObject(museumCollectionDataObj)) {
          console.log('did not recognise JSON musuemCollectionType ' + musuemCollectionType);
        } else {
          updateMuseumData(museumCollectionDataObj);
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
  };

  var updateTheMuseumMarker = function(modelCollectionName, museumDataResult, musuemMarker) {
    // the data im musuemData is stored as knockout observableArrays
    // so the ui can update as musuem data comes in from async ajax calls
    if (musuemMarker.VaM().hasOwnProperty[modelCollectionName]) {
      // append musuem marker data to modelCollection observableArray
      musuemMarker.VaM()[modelCollectionName].push(museumDataResult);
    } else {
      // create a new observableArray with modelCollectionName to store museumDataResult
      musuemMarker.VaM()[modelCollectionName] = ko.observableArray([]);
      // create a knockout subscribe function so we can be notified when the musuem data updates
      musuemMarker.VaM()[modelCollectionName].subscribe(function(newValue) {
        console.log(musuemMarker.prefPlaceMarker.labelContent + ' --> ' + modelCollectionName + ' changed');
        // add description label
        var placesArray = musuemMarker.VaM().place()[0];
        // get max number and actual num of objectPlaces in VaM database as a string
        var maxNumObjectPlaces = parseInt(placesArray.meta.result_count);
        var numMusuemObjects = parseInt(placesArray.records.length);
        /// create label string
        if (maxNumObjectPlaces === 0) {
          label = 'sorry no musuem places';
        } else if (numMusuemObjects === maxNumObjectPlaces) {
          label = numMusuemObjects + " museum place";
        } else if (numMusuemObjects == 1) {
          label = numMusuemObjects + " museum place";
        } else if (numMusuemObjects > 1) {
          label = numMusuemObjects + ' of ' + maxNumObjectPlaces + " museum place";
        }
        if (numMusuemObjects > 1) {
          // add plural to label if needed
          label = label + 's';
        }
        // set the description label for the museumMarker
        musuemMarker.obsMuseumMarkerListLabel(label);
      });
      // update the MuseumMarkers modelCollectionName data
      musuemMarker.VaM()[modelCollectionName].push(museumDataResult);
    }
  };

  // http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
  // str generateId(int len);
  // len - must be an even number (default: 40)
  var generateId = function(len) {
    var arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return [].map.call(arr, function(n) {
      return n.toString(16);
    }).join("");
  };

  var updateMuseumData = function(museumCollectionData) {
    var resourceRefObj = museumCollectionData.resourceRefObj;
    var storageName = resourceRefObj.modelCollection;
    // default random name to store data under for debugging if better name not found
    var storedObjectName = generateId(20);
    if (storageName === 'place') {
      storedObjectName = resourceRefObj.placeID;
      // 'place' property - google place id
    } else if (storageName === 'placeObjects') {
      // note VaM primary key for place is a number
      // so we convert to a string to use it as a property name
      storedObjectName = resourceRefObj.search_parameters.place.toString();
    }
    // keep museumCollectionDataObj for musuem app use
    if (!museumData.data) {
      // if no musuem.data it is first time called
      // create 'data' property used to store museum app data
      museumData.data = {};
    }
    //------------------------------------------
    if (!museumData.data.hasOwnProperty(storageName)) {
      // does not have a storageName property, so create one
      museumData.data[storageName] = {};
    }
    //-----------------------------------------------------------
    // has got a storageName property for storedObjectName
    //-----------------------------------------------------------
    if (museumData.data[storageName].hasOwnProperty(storedObjectName)) {
      if (resourceRefObj.search_parameters.hasOwnProperty('offset')) {
        // when an 'offset' is in search parameters
        // we already have some of the available museum data records
        var existingRecordsArray = museumData.data[storageName][storedObjectName].museumData.records;
        var newMuseumData = museumCollectionData.museumData;
        for (var i = 0; i < existingRecordsArray.length; i++) {
          // include existing data objects at start of new data before the musuemData update
          newMuseumData.records.unshift(existingRecordsArray[i]);
        }
        var numberOfRecords = newMuseumData.records.length;
        if (numberOfRecords > 0) {
          // update the meta data to reflect the updated records
          newMuseumData.meta.result_count = numberOfRecords;
        }
      }
    }
    //-----------------------------------------------------------
    // update the museumData
    museumData.data[storageName][storedObjectName] = museumCollectionData;
    // update museumData in localStorage
    updateLocalMusuemDataStorage();
  };

  var updateLocalMusuemDataStorage = function() {
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
  };
  //-----------------------------------------------------------------------

  // helper function to append a status paragraph to webpage log area
  var addMessage = function(msg) {
    var paragraph = '<p class="message">' + msg + '</p>';
    $('#log-area').append(paragraph);
  };

  //----------------------------------------------------------------------------
  //  museum App VIEWMODEL creator
  //----------------------------------------------------------------------------
  var MusAppViewModel = function() {

    //----------------
    //  maps Model
    //----------------
    var mapsModel = {

      placeTypeInPrefOrder: ["neighborhood", "political", "locality", "administrative_area_level_4", "administrative_area_level_3", "administrative_area_level_2"],
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      // observable array to store reference to all map marker objects
      obsArrayMapMarkers: ko.observableArray([]),
      obsFilteredBoundsMarkers: ko.observableArray([]),
      // obsUserLocalPlace is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalPlace: ko.observable(false),
      obsFilterSearch: ko.observable(''),
      obsSelectedPlace: ko.observable(false),
      //placeName: ko.observable('typograph')
    };
    // add knockout computed variables outside of mapsModel object literal definition
    // as referencing other ko.observables inside mapsModel not possible until defined?

    mapsModel.compFilterMapList = ko.computed(function() {
      var filterString = mapsModel.obsFilterSearch().toLowerCase();
      if (filterString === '') {
        // no need for any filter as input text is empty
        return mapsModel.obsArrayMapMarkers();
      } else {
        // filter all map markers on input text
        return ko.utils.arrayFilter(mapsModel.obsArrayMapMarkers(), function(markerObj) {
          // filter match to google formatted address which has place, area and city etc included
          // not just the place name
          var markerPlaceName = markerObj.bestPlace.formatted_address.toLowerCase();
          var match = markerPlaceName.indexOf(filterString);
          if (match >= 0) {
            return true;
          } else {
            return false;
          }
        });
      }
    });

    mapsModel.compSortedMapMarkers = ko.computed(function() {
      var musuemMarkeArray = mapsModel.compFilterMapList();
      if (musuemMarkeArray.length > 1) {
        // only sort the array if it has at least two items
        var sortedArray = musuemMarkeArray.sort(function(leftMarker, rightMarker) {
          var leftName = "";
          if (leftMarker.bestPlace.address_components[0].types[0] === 'street_number') {
            // if first address component is a street number use the next address component
            leftName = leftMarker.bestPlace.address_components[1].long_name.split(' ')[0].toLowerCase();
          } else {
            leftName = leftMarker.bestPlace.address_components[0].long_name.split(' ')[0].toLowerCase();
          }
          var rightName = "";
          if (leftMarker.bestPlace.address_components[0].types[0] === 'street_number') {
            // if first address component is a street number use the next address component
            rightName = rightMarker.bestPlace.address_components[1].long_name.split(' ')[0].toLowerCase();
          } else {
            rightName = rightMarker.bestPlace.address_components[0].long_name.split(' ')[0].toLowerCase();
          }
          return leftName == rightName ? 0 : (leftName < rightName ? -1 : 1);
        });
        return sortedArray;
      } else {
        // just return the array - no sorting needed
        return musuemMarkeArray;
      }
    });
    // END mapsModel

    //-------------
    // ui Model
    //-------------
    var uiModel = {
      // see using an google infobox instead of an infoWindow - example http://jsfiddle.net/jehj3/597/
      infowindow: new InfoBox({
        boxClass: 'infoBox',
        content: '',
        disableAutoPan: false,
        maxWidth: 200,
        pixelOffset: new google.maps.Size(-100, 20), // offset to show window below musuemMarker label
        zIndex: null,
        closeBoxMargin: "2px 2px 2px 2px",
        // closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
        closeBoxURL: "img/close-window-16.gif",
        infoBoxClearance: new google.maps.Size(1, 1)
      }),
      // infoBox for museum object details
      musemObjectWindow: new InfoBox({
        boxClass: 'musuemobject-infoBox',
        content: '',
        disableAutoPan: false,
        // maxWidth: 420,
        pixelOffset: new google.maps.Size(-210, 60), // offset to show window below musuemMarker label
        zIndex: null,
        closeBoxMargin: "2px 2px 2px 2px",
        // closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif",
        closeBoxURL: "img/close-window-16.gif",
        // infoBoxClearance: new google.maps.Size(1, 1)
      }),
      // uiModel observables
      obsHelpVisible: ko.observable(true),
      obsInfowindowVisible: ko.observable(false), // default infoWindow is closed
      obsMusemObjectWindowVisible: ko.observable(false),
      obsSelectedMusuemMarker: ko.observable(false),
      obsSelectedMusuemObjectPlace: ko.observable(false),
      obsSelectedMusuemObject: ko.observableArray(false),
      obsCurrentMuseumObject: ko.observable(false),
      // uiModel observable Arrays
      obsCurrentPlaceObjects: ko.observableArray([]),
      obsCurrentMuseumObjects: ko.observableArray([])
    };

    uiModel.compShowMusuemMarkersList = ko.computed(function() {
      // when infowindow open, hide 'museum markers' list(set false)
      // when infowindow closed, show 'museum markers' list (set true)
      return uiModel.obsInfowindowVisible() ? false : true;
    });

    uiModel.compShowMusuemObjectPlaces = ko.computed(function() {
      if (uiModel.obsInfowindowVisible()) {
        // infowindow is open
        if (uiModel.obsMusemObjectWindowVisible()) {
          console.log('1');
          // and the 'MusemObjectWindow' is open, hide the 'museum object places' list
          return false;
        } else {
          console.log('2');
          // when infowindow is open and 'MusemObjectWindow' is closed, show the 'museum object places' list
          return true;
        }
      } else {
        console.log('3');
        // infowindow is closed, don't show the 'museum object places'
        return false;
      }
    });

    uiModel.compShowMusuemObjects = ko.computed(function() {
      if (uiModel.obsMusemObjectWindowVisible()) {
        return true;
      } else {
        return false;
      }
    });

    uiModel.compNumOfPlacesForZoomOnMap = ko.computed(function() {
      var numOfPlaces = mapsModel.compFilterMapList().length;
      var buttonLabel = 'Zoom ' + numOfPlaces + ' place';
      if (numOfPlaces === 0) {
        buttonLabel = 'no places';
      } else if (numOfPlaces > 1) {
        // add plural to places
        buttonLabel = buttonLabel + 's';
      }
      return buttonLabel;
    });

    uiModel.compFilterButtonLabel = ko.computed(function() {
      var count = mapsModel.compFilterMapList().length;
      var total = mapsModel.obsArrayMapMarkers().length;
      if (count === total) {
        return 'Filter places';
      } else {
        return 'Clear Filter';
      }
    });

    uiModel.compFilterLabelText = ko.computed(function() {
      var count = mapsModel.compFilterMapList().length;
      var total = mapsModel.obsArrayMapMarkers().length;
      if (count === total) {
        return 'all places';
      } else {
        if (count === 0) {
          return 'no places';
        } else {
          return count + ' of ' + total + ' places';
        }
      }
    });

    //-----------------------------------------------------
    //  museumDataHelpers MODULE
    //-----------------------------------------------------
    var museumDataHelpers = function() {

      var removePlacefromMusuemData = function(musuemMarkerObj) {
        var placeIdToRemove = musuemMarkerObj.bestPlace.place_id;
        var musuemDataPlaceObj = museumApp.museumData.data.place;
        // remove place data for musuem marker
        delete musuemDataPlaceObj[placeIdToRemove];
        // musuemData has had place removed so sync the localStorage version
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
      };

      var clearFilter = function() {
        mapsModel.obsFilterSearch('');
      };

      var requestMuseumPlaces = function(museumMarker, searchRadius) {
        var preferedPlace = museumMarker.bestPlace;
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
            limit: 45, // 45 is maximum amount places returned by V&A API per request
            // images: 1 // only get results with images
          },
          url: 'http://www.vam.ac.uk/api/json/place/search', // V&A museum collection.places search REST service
          isLoaded: 'no'
        };
        // setup the musuem places from existing museumData if available
        var placeDataResults = musuemDataIfExists(resourceRefObj.modelCollection, resourceRefObj.placeID);
        console.log('data exists:');
        console.dir(placeDataResults);
        // no exisitng museumData
        if (placeDataResults !== false) {
          // setup a new object literal to store museum data in musuemMarker
          var museumCollectionDataObj = {
            googlePlace: preferedPlace,
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection, // property name used in musuemData to store data
            museumData: placeDataResults
          };
          return museumCollectionDataObj;
        } else {
          // else use async AJAX call to try and get some place data
          var index = 0; // NOTE needed as first argument to getAsyncResource function
          getAsyncResource(index, resourceRefObj, museumMarker);
          // immediately return empty object - async callback side effect adds the data
          return {};
        }
      };

      var requestPlaceMusuemObjects = function(placePrimaryKey, selectedMuseumMarker) {
        var index = 0; // NOTE needed as first argument to getAsyncResource function
        var resourceName = 'V&A - museum placeObjects for collection.place - pk: ' + placePrimaryKey;
        var resourceRefObj = {
          name: resourceName,
          modelCollection: 'placeObjects',
          dataType: 'json',
          search_parameters: {
            place: placePrimaryKey, // musuem place with index of museumobjects
            limit: 45, // note: 45 is max amount of museum objects results allowed on a single AJAX call by API
            // images: 1 // only get results with images
          },
          url: 'http://www.vam.ac.uk/api/json/museumobject/', // V&A museum collection.museumobject search REST service
          isLoaded: 'no'
        };
        var placeObjectsDataResults = musuemDataIfExists(resourceRefObj.modelCollection, placePrimaryKey);
        if (!placeObjectsDataResults) {
          // make an AJAX async call for placeObjects data
          getAsyncResource(index, resourceRefObj, selectedMuseumMarker);

        } else {
          // we already have some musuemData for placePrimaryKey but there may be more
          // from the V&A - so check the result_count to see
          var totalPlacesAvailable = placeObjectsDataResults.museumData.meta.result_count;
          if (placeObjectsDataResults.length < totalPlacesAvailable) {
            // make another request offset from the ones we have
            // note: the V&A API has 45 record limit per request
            // the API will return less than 45 records if total is less than limit
            var offsetNum = placeObjectsDataResults.museumData.records.length;
            // add offset to ajax request after the ones we have
            resourceRefObj.search_parameters.offset = offsetNum;
            getAsyncResource(index, resourceRefObj, selectedMuseumMarker);
          } else {
            // we have all available object places in museumData
            uiModel.obsSelectedMusuemObjectPlace(placeObjectsDataResults);
            return placeObjectsDataResults;
          }
        }
      };

      var getmuseumObjectDetails = function(museumObjectNumber) {
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
      };

      var ObjPKeyDataExists = function(dataName, keyName) {
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
      };

      var musuemDataIfExists = function(storageName, dataName) {
        if (!museumApp.museumData.hasOwnProperty('data')) {
          // there isn't any musuem data
          return false;
        } else {
          if (museumApp.museumData.data.hasOwnProperty(storageName)) {
            var storageRef = museumApp.museumData.data[storageName];
            if (storageRef.hasOwnProperty(dataName)) {
              return storageRef[dataName];
            } else {
              return false;
            }
          }
        }
      };

      var getMusuemMarkerPlaces = function(musuemMarker) {
        if (musuemMarker.VaM) {
          if (musuemMarker.VaM().hasOwnProperty('place')) {
            var placeObject = musuemMarker.VaM().place()[0];
            return placeObject.records;
          }
        }
        return [];
      };

      return {
        //-------------------------------------------------
        // async data functions
        //-------------------------------------------------
        getMusuemMarkerPlaces: getMusuemMarkerPlaces,
        requestMuseumPlaces: requestMuseumPlaces,
        requestPlaceMusuemObjects: requestPlaceMusuemObjects,
        getmuseumObjectDetails: getmuseumObjectDetails,
        musuemDataIfExists: musuemDataIfExists,
        //-------------------------------------------------
        //simpleFormattedplaceName: simpleFormattedplaceName,
        clearFilter: clearFilter,
        removePlacefromMusuemData: removePlacefromMusuemData
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

      var objectPlaceListClick = function(objectPlaceObj) {
        // set the uiModel state
        uiModel.obsSelectedMusuemObjectPlace(objectPlaceObj);
        //---------------------------
        var museumMarker = uiModel.obsSelectedMusuemMarker();
        // get musuem data for objectPlace (from museumData or AJAX call)
        museumDataHelpers.requestPlaceMusuemObjects(objectPlaceObj.pk, museumMarker);
        // open the musuemObject details window
        openMuseumObjectWindow(museumMarker);

      };

      var removeMarker = function(musuemMarker) {
        // take the musuemMarkers google marker off map
        musuemMarker.prefPlaceMarker.setMap(null);
        // remove the musuemMarker from musuem app
        mapsModel.obsArrayMapMarkers.remove(musuemMarker);
        // remove musuemMarkerRef from musuemData (and localstorage)
        // so that its not rebuild at next session
        museumDataHelpers.removePlacefromMusuemData(musuemMarker);
      };

      var showAllMarkers = function() {
        var markerCount = mapsModel.compFilterMapList().length;
        // only zoom if there are some markers (e.g use of the filter)
        if (markerCount > 0) {
          var bounds = new google.maps.LatLngBounds();
          // set map bounds to include all filtered markers
          var museumMapMarkerArray = mapsModel.compFilterMapList();
          for (var i = 0; i < museumMapMarkerArray.length; i++) {
            var mapMarker = museumMapMarkerArray[i].prefPlaceMarker;
            bounds.extend(mapMarker.getPosition());
          }
          //------------------------------------------------
          // fit the map bounds to show all filtered markers
          //------------------------------------------------
          delayedFitBounds(bounds);
          //-------------------------
        } else {
          console.log('no markers on map for bounds');
        }
      };

      var delayedFitBounds = function(bounds) {
        // NOTE TODO not sure why this delay is needed for bounds fit to work properly?????
        setTimeout(function() {
          mapHelpers.closeInfoWindow();
          mapsModel.googleMap.fitBounds(bounds);
          // google.maps.event.trigger(mapsModel.googleMap, 'resize');
          // if (mapsModel.googleMap.getZoom() > 11) {
          //   console.log('1');
          //   // when bounds fitting a single marker or close bunched markers
          //   // the map can zoom in too far, so back up again to zoom level 12
          //   mapsModel.googleMap.setZoom(8);
          // }
        }, 10);
      };

      var rebuildMarkersFromMusuemData = function() {
        var museumPlaceDataObj = museumApp.museumData.data.place;
        var count = 0;
        for (var key in museumPlaceDataObj) {
          var value = museumPlaceDataObj[key];
          rebuildMarker(value);
          count = count + 1;
        }
        console.log('rebuild ' + count + ' markers from museumData');
        showAllMarkers();
      };

      var rebuildMarker = function(mapMarkerDataObj) {
        // create museumMarker
        var newMarker = makeMuseumMarker(mapMarkerDataObj.googlePlace);
        var storageName = mapMarkerDataObj.resourceRefObj.modelCollection;
        var museumDataToStore = mapMarkerDataObj.museumData;
        // add musuem data to new museumMarker
        updateTheMuseumMarker(storageName, museumDataToStore, newMarker);
      };

      var prefPlacePinOptions = function pinSymbol(colour) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
          fillColor: colour,
          fillOpacity: 0.75,
          strokeColor: 'salmon',
          strokeWeight: 3,
          scale: 0.9
        };
      };

      var selectedPlacePinOptions = function pinSymbol(colour) {
        return {
          path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
          fillColor: colour,
          fillOpacity: 0.75,
          strokeColor: 'gold',
          strokeWeight: 4,
          scale: 1
        };
      };

      var musuemObjectPlacePinOptions = function pinSymbol() {
        return {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "salmon",
          fillOpacity: 1,
          strokeColor: 'yellow',
          strokeWeight: 1,
          scale: 4,
        };
      };

      var musuemMarkerBounce = function(musuemMarker) {
        var marker = musuemMarker.prefPlaceMarker;
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          marker.setAnimation(null);
        }, 1400);
      };

      var searchUsersLocation = function() {
        var geoPosObj = mapsModel.obsUserLocalPlace();
        if (geoPosObj) {
          var latLng = {
            lat: geoPosObj.geoPosition.coords.latitude,
            lng: geoPosObj.geoPosition.coords.longitude
          };
          museumDataHelpers.clearFilter();
          // add museum marker at pref place closest to users geoloction
          searchHere(latLng);
        }
      };

      var panMapToMuseumMarker = function(museumMarker) {
        console.log('panMapToMuseumMarker ' + museumMarker.bestPlace.formatted_address);
        closeInfoWindow();
        if (museumMarker.bestPlace.geometry.hasOwnProperty('bounds')) {
          // if address has some bounds data
          mapsModel.googleMap.fitBounds(museumMarker.bestPlace.geometry.bounds);
          // if after bounds zoom we are really close in, back out zoom a bit
          if (mapsModel.googleMap.getZoom() > 14) {
            mapsModel.googleMap.setZoom(14);
          }
        } else {
          // address has no bounds data, pan to the location and set a zoom level instead
          map.panTo(museumMarker.bestPlace.geometry.location);
          var currZoomLevel = mapsModel.googleMap.getZoom();
          if (currZoomLevel < 11) {
            mapsModel.googleMap.setZoom(12);
          } else {
            mapsModel.googleMap.setZoom(currZoomLevel);
          }
        }
        // indicate marker with a short bounce
        musuemMarkerBounce(museumMarker);
      };

      var openMuseumObjectWindow = function(museumMarker) {
        // pan the map up by 1/3 of map height to show all infobox
        panMapByPercentage(mapsModel.googleMap, 0, -0.4);
        //-----------------------------------------------
        // open musuemPlaceObjects window at map marker for obsSelectedMuseumMArker
        uiModel.musemObjectWindow.open(mapsModel.googleMap, museumMarker.prefPlaceMarker);
        uiModel.obsMusemObjectWindowVisible(true);
      };

      var panMapByPercentage = function(mapRef, offsetX, offsetY) {
        // http://stackoverflow.com/questions/10656743/how-to-offset-the-center-point-in-google-maps-api-v3
        var center = mapRef.getCenter(); // a latLng
        var span = mapRef.getBounds().toSpan(); // a latLng - # of deg map spans
        var newCenter = {
          lat: center.lat() + span.lat() * offsetY,
          lng: center.lng() + span.lng() * offsetX
        };
        mapRef.panTo(newCenter);
      };

      var updateMusemObjectInfoBoxContents = function(objectPlaceObj) {
        var content = 'not done yet...';

        // uiModel.obsCurrentMuseumObject
        // update the musuemMarker infowindow
        uiModel.musemObjectWindow.setContent(content);
      };

      var closeMuseumObjectWindow = function() {
        uiModel.musemObjectWindow.close();
        uiModel.obsMusemObjectWindowVisible(false);
        uiModel.obsSelectedMusuemObjectPlace(false);
      };

      var closeInfoWindow = function() {
        closeMuseumObjectWindow(); // close musuem object details window too
        uiModel.infowindow.close();
        uiModel.obsInfowindowVisible(false);
        uiModel.obsSelectedMusuemMarker(false);
      };

      var openInfoWindow = function(musuemMarkerObj) {
        // update observable for 'selected musuemMarker' - see koSubscribers function for actions done
        uiModel.obsSelectedMusuemMarker(musuemMarkerObj);
        // animate marker
        musuemMarkerBounce(musuemMarkerObj);
        // update infowWindow contents
        updateInfoWindow(musuemMarkerObj);
        // open infowindow on map at musuem marker location
        uiModel.infowindow.open(mapsModel.googleMap, musuemMarkerObj.prefPlaceMarker);
        uiModel.obsInfowindowVisible(true);
      };

      var updateInfoWindow = function(musuemMarker) {
        // update the musuemMarker infowindow
        uiModel.infowindow.setContent(musuemMarker.obsMuseumMarkerListLabel());
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
      // Function: makeMuseumMarker - makes a map marker to hold all museum data
      //--------------------------------------------------------------------------------
      var makeMuseumMarker = function(bestPlace) {
        var markerLabel = '';
        var placeAddressType = bestPlace.address_components[0].types[0];
        if (placeAddressType === 'street_number') {
          // use the street name not the street number for marker label
          markerLabel = bestPlace.address_components[1].long_name;
        } else {
          markerLabel = bestPlace.address_components[0].long_name;
        }
        var labelOffset = 4 * (markerLabel.length);

        // create a google map markerwithlabel for bestPlace
        var marker = new MarkerWithLabel({
          position: bestPlace.geometry.location,
          map: mapsModel.googleMap,
          icon: mapHelpers.prefPlacePinOptions("gold"),
          id: bestPlace.place_id, // a unique google map placeID reference to bestPlace
          draggable: false,
          labelContent: markerLabel, // name for marker label
          labelAnchor: new google.maps.Point(labelOffset, 0),
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
          bestPlace: bestPlace,
          obsMuseumMarkerListLabel: ko.observable(false)
        };

        // add click handler for marker
        // marker.addListener('click', function(e) {
        //   panMapToMuseumMarker(museumMarker); //TODO ??? maybe not
        //   openInfoWindow(museumMarker);
        // });
        marker.addListener('click', function(e) {
          panMapToMuseumMarker(museumMarker); //TODO ??? maybe not
          openInfoWindow(museumMarker);
        });

        // add marker to ko observable array for tracking, disposal etc
        mapsModel.obsArrayMapMarkers.push(museumMarker);
        return museumMarker;
      };

      var searchHere = function(location) {
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
              var searchRadius = 5; // default search radius
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
              var musMarkerforPlace = mapMarkerExistsRef(bestPlace);
              if (musMarkerforPlace !== false) {
                // museum marker already exists for bestplace
                panMapToMuseumMarker(musMarkerforPlace);
                // openInfoWindow(musMarkerforPlace);
                console.log('marker already exits for ' + bestPlace.formatted_address);
              } else {
                // create a new museumMarker for the bestPlace
                var museumMarker = makeMuseumMarker(bestPlace);
                // openInfoWindow(museumMarker);
                // clear map filter if present
                // if (mapsModel.obsFilterSearch !== '') {
                //   museumDataHelpers.clearFilter();
                // }
                //-------------------------------------------------------------------------
                // async request V&A museum place search results
                //-------------------------------------------------------------------------
                museumDataHelpers.requestMuseumPlaces(museumMarker, searchRadius);
                //-------------------------------------------------------------------------
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
      };

      var inLondon = function(location) {
        var centralLondonObj = mapsModel.londonPolygonAreas[1];
        var londonAreaObj = mapsModel.londonPolygonAreas[0];
        if (centralLondonObj.polygon.containsLatLng(location)) {
          return centralLondonObj;
        } else if (londonAreaObj.polygon.containsLatLng(location)) {
          return londonAreaObj;
        } else {
          return false;
        }
      };

      var mapMarkerExistsRef = function(testPlace) {
        var musMarkerArray = mapsModel.obsArrayMapMarkers();
        // check if new best place google ID is within an existing marker
        for (var count = 0; count < musMarkerArray.length; count++) {
          if (musMarkerArray[count].bestPlace.place_id == testPlace.place_id) {
            // return the museumMarker Object if place_id matches
            return musMarkerArray[count];
          }
        }
        return false;
      };

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

      var markerLabelsDisplay = function() {
        var zoomLimit = (mapsModel.googleMap.zoom > 7) ? true : false;
        var markers = mapsModel.compFilterMapList();
        for (var i = 0; i < markers.length; i++) {
          markers[i].prefPlaceMarker.labelVisible = zoomLimit;
        }
      };

      var displayMarkersInBounds = function() {
        // filter all map markers based on visible map bounds
        var boundsFilteredArray = ko.utils.arrayFilter(mapsModel.compFilterMapList(), function(markerObj) {
          var bounds = mapsModel.googleMap.getBounds();
          return bounds.contains(markerObj.prefPlaceMarker.getPosition());
        });
        // console.log('--------');
        // console.dir(boundsFilteredArray);
        //  var sortedArray =  boundsFilteredArray.sort(function(leftMarker, rightMarker) {
        //   var shortLeftName = "";
        //   if (leftMarker.bestPlace.address_components[0].types[0] === 'street_number') {
        //     // if first address component is a street number use the next one
        //     shortLeftName = leftMarker.bestPlace.address_components[1].short_name;
        //   } else {
        //     shortLeftName = leftMarker.bestPlace.address_components[0].short_name;
        //   }
        //   var shortRightName = "";
        //   if (leftMarker.bestPlace.address_components[0].types[0] === 'street_number') {
        //     // if first address component is a street number use the next one
        //     shortRightName = rightMarker.bestPlace.address_components[1].short_name;
        //   } else {
        //     shortRightName = rightMarker.bestPlace.address_components[0].short_name;
        //   }
        //   return shortLeftName == shortRightName ? 0 : (shortLeftName < shortRightName ? -1 : 1);
        // });
        // console.dir(sortedArray);
        //return sortedArray;
        return boundsFilteredArray;
      };

      var filterMarkersOnMap = function() {
        // Comparing two arrays from http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
        var filteredMarkers = ko.utils.compareArrays(mapsModel.obsArrayMapMarkers(), mapsModel.compFilterMapList());
        ko.utils.arrayForEach(filteredMarkers, function(museumMarker) {
          if (museumMarker.status === "deleted") {
            // take marker off map
            museumMarker.value.prefPlaceMarker.setMap(null);
          } else if (museumMarker.status === "retained") {
            // marker on map
            museumMarker.value.prefPlaceMarker.setMap(mapsModel.googleMap);
          }
        });
      };

      var updateMapMarkerDisplay = function() {
        filterMarkersOnMap();
        markerLabelsDisplay();
        displayMarkersInBounds();
      };

      //-----------------------------------------------------
      //  mapHelpers - public vars & functions
      //-----------------------------------------------------
      return {
        makeLondonPolygons: makeLondonPolygons,
        markerListClick: markerListClick,
        removeMarker: removeMarker,
        showAllMarkers: showAllMarkers,
        searchHere: searchHere,
        centerMap: centerMap,
        getMapCenter: getMapCenter,
        prefPlacePinOptions: prefPlacePinOptions,
        selectedPlacePinOptions: selectedPlacePinOptions,
        musuemObjectPlacePinOptions: musuemObjectPlacePinOptions,
        rebuildMarkersFromMusuemData: rebuildMarkersFromMusuemData,
        rebuildMarker: rebuildMarker,
        searchUsersLocation: searchUsersLocation,
        panMapToMuseumMarker: panMapToMuseumMarker,
        mapMarkerExistsRef: mapMarkerExistsRef,
        openMuseumObjectWindow: openMuseumObjectWindow,
        closeMuseumObjectWindow: closeMuseumObjectWindow,
        openInfoWindow: openInfoWindow,
        updateInfoWindow: updateInfoWindow,
        closeInfoWindow: closeInfoWindow,
        markerLabelsDisplay: markerLabelsDisplay,
        displayMarkersInBounds: displayMarkersInBounds,
        filterMarkersOnMap: filterMarkersOnMap,
        updateMapMarkerDisplay: updateMapMarkerDisplay,
        objectPlaceListClick: objectPlaceListClick
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

      // debug helper (not used in app) that jquery fades text in/out when its binding value changes
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
            backgroundColor: 'none',
            disableDoubleClickZoom: true,
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

          // map bounds_changed event handler
          map.addListener('bounds_changed', function() {
            mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
            mapHelpers.markerLabelsDisplay();
          });
          // map zoom event handler
          map.addListener('zoom_changed', function() {
            mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
            mapHelpers.markerLabelsDisplay();
          });
          // map double click event handler
          google.maps.event.addListener(mapsModel.googleMap, 'dblclick', function(event) {
            mapHelpers.searchHere(event.latLng);
            uiModel.obsHelpVisible(false);
          });
          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var halfDocumentHeight = ($(window).height() / 2);
            $('#map').height(halfDocumentHeight);
            var center = map.getCenter();
            mapsModel.googleMap.setCenter(center);
          });
          // infowindow callback handler
          // NOTE we are using a google infoboxes not infowindows
          google.maps.event.addListener(uiModel.infowindow, 'closeclick', function() {
            mapHelpers.closeInfoWindow();
          });

          google.maps.event.addListener(uiModel.musemObjectWindow, 'closeclick', function() {
            mapHelpers.closeMuseumObjectWindow();
          });
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          // mapPanel UPDATE function
        }
      };
    };
    // method to subscribe to observerable changes
    var koSubscribers = function() {

      mapsModel.obsArrayMapMarkers.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        mapHelpers.filterMarkersOnMap();
      }, null, "change");

      mapsModel.compFilterMapList.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        mapHelpers.filterMarkersOnMap();
        mapHelpers.showAllMarkers();
      }, null, "change");

      // -------------------------------------------------------------------
      // BEFORE CHANGE obsSelectedMusuemMarker e.g when infoWindow closes
      // -------------------------------------------------------------------
      uiModel.obsSelectedMusuemMarker.subscribe(function(oldMuseumMarkerObjRef) {
        if (oldMuseumMarkerObjRef) {
          // set style of map marker back to 'normal'
          oldMuseumMarkerObjRef.prefPlaceMarker.setIcon(mapHelpers.prefPlacePinOptions("gold"));
          //-------------------------------------------------------------
        }
      }, null, "beforeChange");

      // -------------------------------------------------------------------
      // ON CHANGE obsSelectedMusuemMarker e.g when infoWindow opens
      // -------------------------------------------------------------------
      uiModel.obsSelectedMusuemMarker.subscribe(function(newMuseumMarkerObj) {
        if (newMuseumMarkerObj) {
          // set style of map marker to 'selected'
          newMuseumMarkerObj.prefPlaceMarker.setIcon(mapHelpers.selectedPlacePinOptions());
          var VaMObjectPlacesData = newMuseumMarkerObj.VaM().place()[0];
          // this is the total number of objectPlaces available from VaM (we may not have them all yet)
          var totalObjectPlacesAvailable = VaMObjectPlacesData.meta.result_count;
          var numObjectPlaceRecords = VaMObjectPlacesData.records.length;
          //console.log('ADD ' + numObjectPlaceRecords + ' of ' + totalObjectPlacesAvailable + ' objectPlace markers to map');
          // populate observable array with the currenly selected musuemMarkers musuem objetct places);
          uiModel.obsCurrentPlaceObjects(VaMObjectPlacesData.records);
        }
      }, null, "change");

      // -------------------------------------------------------------------
      // ON CHANGE obsSelectedMusuemObject
      // -------------------------------------------------------------------
      uiModel.obsSelectedMusuemObjectPlace.subscribe(function(newData) {
        console.log('change obsSelectedMusuemObjectPlace');
        // console.dir(newData);

      }, null, "change");

      // for event AFTER filter input text has changed
      mapsModel.obsFilterSearch.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
        mapHelpers.updateMapMarkerDisplay();
      }, null, "change");

    };

    //-----------------------------------------------------
    // configure the museum apps Knockout ViewModel
    //-----------------------------------------------------
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
    initmuseumPlaces: initmuseumPlaces,
    localStorageP: localStorageP,
    museumData: museumData,
    addMessage: addMessage,
    debugMessageArea: debugMessageArea
  };
  // END MODULE museumApp
  //---------------------------------------------------------
})();



//-----------------------------------
// JQuery document is ready function
//-----------------------------------
$(function() {
  // set height of map area to 50% of the current document height
  // hack to get google map bug to display as div will
  // have 0 height if div id map is not set
  var halfDocumentHeight = ($(window).height() / 2);
  $('#map').height(halfDocumentHeight);
  $('#map').css('visibility', 'visible');
});

// this callback is called when google maps is ready
window.mapsCallback = function() {
  museumApp.init();
};


//---------------------------------------------------------
