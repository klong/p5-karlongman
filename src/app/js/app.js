//---------------------------------------------------------
//    museumApp MODULE
//---------------------------------------------------------

var museumApp = (function() {
  "use strict";
  // vars are objects as museumApp will add property values
  var museumData = {};
  var museumViewModel = {
    ready: false,
    makingDefaultPlaces: true // makingDefaultPlaces is true until we check for any local stored museum data
  };
  var googleFail = false;

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
    name: "Worcester, Worcester, UK",
    location: {
      lat: 52.193636,
      lng: -2.22157500000003
    }
  }, {
    name: "Leicester Square, London, UK",
    location: {
      lat: 51.5102585,
      lng: -0.1308881999999585
    }
  }, {
    name: "Broekwijk, Brussel, Belgium",
    location: {
      lat: 50.851645,
      lng: 4.357623200000035
    }
  }, {
    name: "Sèvres, Hauts-de-Seine Ile-de-France",
    location: {
      lat: 48.82432900,
      lng: 2.21212000
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
    if ((!museumApp.localStorageP()) || (museumApp.museumData.data === undefined)) {
      var initData = initmuseumPlaces;
      // localStorage is disabled or is the first time app is run.
      // so make some default museumMarkers using lat lng locations in initmuseumPlaces
      console.log('first time app run or no local storage');
      // make default 5 museum places map markers on map
      makeDefaultMusuemPlaces(initData);
    } else {
      museumApp.museumViewModel.vm.mapHelpers.rebuildMarkersFromMusuemData();
      // we have localStorage museumData so makingDefaultPlaces is false
      museumViewModel.makingDefaultPlaces = false;
    }
  };

  var makeDefaultMusuemPlaces = function(initData) {
    if (initData.length > 0) {
      for (var i = 0; i < initData.length; i++) {
        museumApp.museumViewModel.vm.mapHelpers.searchHere(initData[i].location);
      }
    }
  };

  //-------------------
  //   museum APP fail - google maps API or extend classes failure
  //-------------------
  var appFail = function(errorText) {
    var errorHtmlText = '';
    errorHtmlText += '<section class="ui negative large message">';
    errorHtmlText += '<i class="large orange bug icon"></i>';
    errorHtmlText += '<h3>Sorry, failed to get ' + errorText + '</span></h3>';
    errorHtmlText += '<p>Refresh the browser page or try again later ...</p>';
    errorHtmlText += '</section>';
    museumApp.googleFail = errorHtmlText;
    // initialise the knockout viewmodel
    ko.applyBindings();
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
        // have some exisiting localStorage.museumDataStored
        // rehydrate the local stringify stored JSON data
        // NOTE: needed to add new property on museumData obj for this to work ??
        museumData.data = JSON.parse(localStorage.museumDataStored);
      }
    }
    // -----------------------------------
    // create Knockout options & APP VIEWMODEL
    ko.options.deferUpdates = true;
    var vm = new MusAppViewModel();
    // add the vm as new property of museumViewModel prototype object
    museumViewModel.vm = vm;
    //-----------------------------------
    // apply bindings APP VIEWMODEL
    ko.applyBindings(museumViewModel.vm);
    museumViewModel.ready = true;
    makeInitMapmuseumData();
    // hide loading area div
    $('#loadingArea').hide("slow");
    // unhide the initial hidden divs of UI (hidden make display less messy)
    $('body').removeClass('initial-hide');
    // set browser window resize handler to show all map markers
    window.addEventListener("resize", function() {
      museumViewModel.vm.mapHelpers.zoomToAllPlaces();
    });
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
          // strip out the musuem places that have no objects in their fields data
          var placesArray = museumDataResult.records;
          if (placesArray.length === 0) {
            // the place does not have any V&A museum places
            var placeLabel = updateObjectRef.prefPlaceMarker.labelContent;
            museumApp.museumViewModel.vm.uiModel.obsUIerrorHtml('<span>sorry no musuem object places found at <em>' + placeLabel + '</em></span>');
            // pause a bit then remove the musuem marker from the app
            // as there are no musuem object places nearby
            var clearMarkerWait = 1800; // wait in milliseconds
            var clearMuseumMarker = function() {
              clearTimeout(clearMuseumMarker);
              museumApp.museumViewModel.vm.mapHelpers.removeMarker(updateObjectRef);
            };
            setTimeout(clearMuseumMarker, clearMarkerWait);
            return false;
          }
          // we have some museum object places data
          var filteredDataArray = placesArray.filter(function(hasSomeObjects) {
            return hasSomeObjects.fields.museumobject_count > 0;
          });
          if (placesArray.length !== filteredDataArray.length) {
            museumDataResult.meta.result_count = filteredDataArray.length;
            museumDataResult.records = filteredDataArray;
          }
          // an object literal for 'place' musuemData
          museumCollectionDataObj = {
            googlePlace: updateObjectRef.bestPlace,
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection,
            museumData: museumDataResult
          };
          // museum object places are also stored inside the Museum Marker
          // so it has references to the places within radius of search
          updateTheMuseumMarker(musuemCollectionType, museumDataResult, updateObjectRef);
          if (museumViewModel.makingDefaultPlaces) {
            var markersMadeCount = museumApp.museumViewModel.vm.mapsModel.obsArrayMapMarkers().length;
            var totalInitialMarkers = initmuseumPlaces.length;
            if (markersMadeCount > totalInitialMarkers) {
              // have we made all of the markers made referenced in initmuseumPlaces object
              // this is the first new marker
              museumViewModel.makingDefaultPlaces = false;
              museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemMarker(updateObjectRef);
            }
          } else {
            // all inital markers have been made or made from local storage
            // so new markers made can be selected straight away
            museumApp.museumViewModel.vm.museumDataHelpers.clearSelectedMusuemMarker();
            museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemMarker(updateObjectRef);
          }
        } else if (musuemCollectionType === 'placeObjects') {
          // add an external imageURL for each museumObject in the museumDataResult
          // when its 'primary_image_id' field is "" we use a default image thumbnail
          museumApp.museumViewModel.vm.museumDataHelpers.setThumbImagePath(museumDataResult);
          // an object literal for 'placeObjects' musuemData
          museumCollectionDataObj = {
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection,
            museumData: museumDataResult
          };
          //------------------------------------------------
          // update the UI model
          var museumObjects = museumDataResult.records;
          museumApp.museumViewModel.vm.uiModel.obsCurrentMuseumObjects(museumObjects);
          //------------------------------------------------
        } else if (musuemCollectionType === 'objectDetails') {
          var objectDetails = museumDataResult[0];
          // strip out any images in image_set that have no path
          var imageArray = objectDetails.fields.image_set;
          var filteredArray = imageArray.filter(function(imageDetails) {
            // keep imageDetails that have a local path that is not an empty string
            return (imageDetails.fields.local.length > 0);
          });
          // update the museumDataResult array
          museumDataResult[0].fields.image_set = filteredArray;
          // update the UI model
          museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemObject(objectDetails);
          // an object literal for 'objectDetails' musuemData
          museumCollectionDataObj = {
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection,
            museumData: objectDetails
          };
        }
        //-----------------------------------------------------
        // update musuemData and localstorage cache
        updateMuseumData(museumCollectionDataObj);
      }
      //-----------------------------------------------------------------------
    });
    // 'FAIL' callback e.g resource error or network timeout
    request.fail(function(jqXHR, textStatus, errorThrown) {
      if (resourceRefObj.dataType === 'json') {
        museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(2);
        var errorText = 'Sorry, cannot get V&A museum ' + resourceRefObj.modelCollection + ' data';
        var helpText = '';
        // HTML for AJAX error infoBox window
        var errorHtml = '<div class="container" width="180" height="230">';
        errorHtml += '   <div class="ui segment">';
        errorHtml += '    <div class="ui header">';
        errorHtml += '     <div class="ui tiny image">';
        errorHtml += '      <img src="img/VA_logo.png"></div>';
        errorHtml += '      <div class="segment">';
        errorHtml += '        <h3>' + resourceRefObj.name + '</h3>';
        errorHtml += '        <p>' + errorText + '</p>';
        errorHtml += '        <p>' + helpText + '</p>';
        errorHtml += '      </div>';
        errorHtml += '    </div>';
        errorHtml += '  </div>';
        errorHtml += '  </div>';
        // open map infoBox window
        museumApp.museumViewModel.vm.mapHelpers.openInfoBoxWithError(errorHtml);
      }
    });
    // 'ALLWAYS' callback
    request.always(function(jqXHR, textStatus, errorThrown) {
      //museumApp.museumViewModel.vm.uiModel.obsUIerrorHtml("loading museum data ...");
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
        // add description label
        var objectPlace = musuemMarker.VaM().place()[0];
        // get max number and actual num of objectPlaces in VaM database as a string
        var maxNumObjectPlaces = +objectPlace.meta.result_count; // convert string to int
        var numMusuemObjects = objectPlace.records.length;
        /// create label string
        var label = "";
        if (maxNumObjectPlaces === 0) {
          var placeLabel = musuemMarker.prefPlaceMarker.labelContent;
          museumApp.museumViewModel.vm.uiModel.obsUIerrorHtml('<span>sorry no musuem object places found at <em>' + placeLabel + '</em></span>');
          // pause a bit then remove the musuem marker from the app
          // as there are no musuem object places nearby
          var clearMarkerWait = 2100; // wait in milliseconds
          var clearMuseumMarker = function() {
            clearTimeout(clearMuseumMarker);
            museumApp.museumViewModel.vm.mapHelpers.removeMarker(musuemMarker);
          };
          setTimeout(clearMuseumMarker, clearMarkerWait);
          return false;
        } else if (numMusuemObjects === maxNumObjectPlaces) {
          label = numMusuemObjects + " museum object place";
        } else if (numMusuemObjects === 1) {
          label = numMusuemObjects + " museum object place";
        } else if (numMusuemObjects > 1) {
          label = numMusuemObjects + ' of ' + maxNumObjectPlaces + " museum object place";
        }
        if (maxNumObjectPlaces > 1) {
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
    var storedObjectName = 'unknown_' + generateId(20);
    if (storageName === 'place') {
      storedObjectName = resourceRefObj.placeID;
      // 'place' property - google place id
    } else if (storageName === 'placeObjects') {
      // note VaM primary key for place is a number
      // so we convert to a string to use it as a property name
      storedObjectName = resourceRefObj.search_parameters.place.toString();
    } else if (storageName === 'objectDetails') {
      storedObjectName = museumCollectionData.museumData.pk.toString();
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

  //----------------------------------------------------------------------------
  //  museum App VIEWMODEL creator
  //----------------------------------------------------------------------------
  var MusAppViewModel = function() {

    //----------------
    //  maps Model
    //----------------
    var mapsModel = {

      placeTypeInPrefOrder: ["neighborhood", "locality", "political", "administrative_area_level_4", "administrative_area_level_3", "postal_town"],
      //-----------------------------------------------------
      //  KnockoutJS observable & observableArray variables
      //-----------------------------------------------------
      // observable array to store reference to all map marker objects
      obsArrayMapMarkers: ko.observableArray([]),
      //obsFilteredBoundsMarkers: ko.observableArray([]),
      // obsUserLocalPlace is used to allow a button to set map to the browser geolocation
      // if service not allowed then button is not visible
      obsUserLocalPlace: ko.observable(false),
      obsFilterSearch: ko.observable(''),
      obsSelectedPlace: ko.observable(false)

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
          if (rightMarker.bestPlace.address_components[0].types[0] === 'street_number') {
            // if first address component is a street number use the next address component
            rightName = rightMarker.bestPlace.address_components[1].long_name.split(' ')[0].toLowerCase();
          } else {
            rightName = rightMarker.bestPlace.address_components[0].long_name.split(' ')[0].toLowerCase();
          }
          return leftName === rightName ? 0 : (leftName < rightName ? -1 : 1);
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
      obsUIerrorHtml: ko.observable(false),
      appUIWarnTimeOutID: false,
      // infoBox for museum object details
      musemObjectWindow: new InfoBox({
        boxClass: 'musuemobject-infoBox',
        content: '',
        disableAutoPan: false,
        pixelOffset: new google.maps.Size(-150, 28), // offset to show window below musuemMarker label
        zIndex: null,
        closeBoxURL: "",
        closeBoxMargin: "",
      }),
      //------------------------------------
      // uiModel observables for use in UI
      obsHelpVisible: ko.observable(true),
      //obsInfowindowVisible: ko.observable(false), // default infoWindow is closed
      obsMusemObjectWindowVisible: ko.observable(false),
      obsSelectedMusuemMarker: ko.observable(false),
      obsSelectedMusuemObjectPlace: ko.observable(false),
      obsSelectedMusuemObject: ko.observable(false),
      // observable Arrays for use museum data objects in UI
      obsCurrentPlaceObjects: ko.observableArray([]),
      obsCurrentMuseumObjects: ko.observableArray([])
    };

    uiModel.compShowMusuemMarkersList = ko.computed(function() {
      // show list of map markers if we have not selected one
      return uiModel.obsSelectedMusuemMarker() ? false : true;
    });

    uiModel.compShowMusuemPlaceList = ko.computed(function() {
      if (!uiModel.compShowMusuemMarkersList()) {
        if (uiModel.obsCurrentPlaceObjects() === false) {
          // museum marker has no object places so unselect the marker
          // to reshow the map marker list
          museumDataHelpers.clearSelectedMusuemMarker();
          return false;
        }
        // when the musuem places list is hidden
        if (uiModel.obsSelectedMusuemObjectPlace()) {
          // hide if we select a place from this list
          return false;
        } else {
          // show places list when obsSelectedMusuemObjectPlace is false
          return true;
        }
      } else {
        // the map markers list is being shown
        return false;
      }
    });

    uiModel.compShowMusuemObjectsList = ko.computed(function() {
      // show object list if we have selected a place
      if (uiModel.obsSelectedMusuemObjectPlace()) {
        // and we haven't selected a musuem object yet
        if (!uiModel.obsSelectedMusuemObject()) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });

    uiModel.compMuseumMarkerCrumb = ko.computed(function() {
      if (uiModel.obsSelectedMusuemMarker()) {
        return uiModel.obsSelectedMusuemMarker().prefPlaceMarker.labelContent;
      } else {
        // default when no selected map marker
        return '';
      }
    });

    uiModel.compObjectPlaceCrumb = ko.computed(function() {
      if (uiModel.obsSelectedMusuemObjectPlace()) {
        if (uiModel.obsCurrentMuseumObjects().length === 0) {
          return '';
        }
        var objectPlaceData = uiModel.obsSelectedMusuemObjectPlace().fields.name;
        return objectPlaceData;
      } else {
        // default when no selected object place
        return '';
      }
    });

    uiModel.compMusuemObjectCrumb = ko.computed(function() {
      if (uiModel.obsSelectedMusuemObject()) {
        var objectDetails = uiModel.obsSelectedMusuemObject().fields;
        var label = objectDetails.title;
        if (label === "") {
          label = objectDetails.object;
        }
        label += ', ' + objectDetails.date_text;
        return label;
      } else {
        // default when no selected museum object
        return '';
      }
    });

    uiModel.compNumOfFilteredPlaces = ko.computed(function() {
      var filteredPlacesCount = mapsModel.compFilterMapList().length;
      var totalPlaces = mapsModel.obsArrayMapMarkers().length;
      var buttonLabel = filteredPlacesCount + ' filtered place';
      if (filteredPlacesCount === 0) {
        buttonLabel = 'no places';
      } else if (filteredPlacesCount === totalPlaces) {
        buttonLabel = 'All places';
      } else if (filteredPlacesCount > 1) {
        // add plural to places
        buttonLabel = buttonLabel + 's';
      }
      return buttonLabel;
    });

    uiModel.compFilterButtonLabel = ko.computed(function() {
      var count = mapsModel.compFilterMapList().length;
      var total = mapsModel.obsArrayMapMarkers().length;
      if (count === total) {
        return 'Filter ' + total + ' places';
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

      var setThumbImagePath = function(museumObjectsDataArray) {
        var recordsArray = museumObjectsDataArray.records;
        for (var i = 0; i < recordsArray.length; i++) {
          var museumObj = recordsArray[i];
          if (museumObj.fields.primary_image_id.length > 0) {
            // if musuem object has a primary image path
            var VaMURL = "http://media.vam.ac.uk/media/thira/collection_images/";
            var imgNumber = museumObj.fields.primary_image_id;
            var firstSixChars = imgNumber.substring(0, 6);
            var imgURL = VaMURL + firstSixChars + "/" + imgNumber + '_jpg_s.jpg';
            // create a new 'imgURL' property on fields object
            museumObj.imgURL = imgURL;
          } else {
            museumObj.imgURL = "img/VandA_logo70x70.png";
          }
        }
      };

      var clearSelectedMusuemMarker = function() {
        clearSelectedMusuemObject();
        clearSelectedObjectPlace();
        uiModel.obsCurrentPlaceObjects(false);
        uiModel.obsSelectedMusuemMarker(false);
      };

      var clearSelectedObjectPlace = function() {
        clearSelectedMusuemObject();
        uiModel.obsSelectedMusuemObjectPlace(false);
        uiModel.obsCurrentMuseumObjects(false);
      };

      var clearSelectedMusuemObject = function() {
        mapHelpers.closeMuseumObjectWindow();
        uiModel.obsMusemObjectWindowVisible(false);
        uiModel.obsSelectedMusuemObject(false);
      };

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

      var requestMuseumPlaces = function(museumMarker, searchRadius, offset) {
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
          },
          url: 'https://www.vam.ac.uk/api/json/place/search', // V&A museum collection.places search REST service
          isLoaded: 'no'
        };
        if (offset) {
          // add offset property to resoureRef object
          resourceRefObj.search_parameters.offset = offset;
        }
        // setup the musuem places from existing museumData if available
        var placeDataResults = musuemDataIfExists(resourceRefObj.modelCollection, resourceRefObj.placeID);
        // we have no exisitng museumData
        if (placeDataResults !== false) {
          //--------------------------------------------------------------
          // have existing museum object places data so update the uiModel
          //--------------------------------------------------------------
          uiModel.obsCurrentPlaceObjects(placeDataResults);
          uiModel.obsSelectedMusuemMarker(museumMarker);
          mapHelpers.panMapToMuseumMarker(museumMarker);
        } else {
          // else use async AJAX call to try and get some museum objects data and update the uiModel if success
          var index = 0; // NOTE needed as first argument to getAsyncResource function
          getAsyncResource(index, resourceRefObj, museumMarker);
        }
      };

      var loadMorePlacesVisible = ko.computed(function() {
        if (uiModel.obsSelectedMusuemObjectPlace()) {
          var museumPlaceObj = uiModel.obsSelectedMusuemObjectPlace();
          var totalNumObjects = +museumPlaceObj.fields.museumobject_count; // + prefix converts string to number
          var currentNumObjects = uiModel.obsCurrentMuseumObjects().length;
          if (currentNumObjects !== undefined) {
            // we have some existing museum objects
            if (currentNumObjects < totalNumObjects) {
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          // no selected museum object place
          return false;
        }
      });

      var loadMorePlaceObjects = function() {
        if (uiModel.obsSelectedMusuemObjectPlace()) {
          var placePrimaryKey = uiModel.obsSelectedMusuemObjectPlace().pk;
          requestPlaceMusuemObjects(placePrimaryKey, uiModel.obsSelectedMusuemMarker());
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
          url: 'https://www.vam.ac.uk/api/json/museumobject/', // V&A museum collection.museumobject search REST service
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
          var museumPlacesRecords = placeObjectsDataResults.museumData.records;
          if (museumPlacesRecords.length < totalPlacesAvailable) {
            // make another request offset from the ones we have
            // note: the V&A API has 45 record limit per request
            // the API will return less than 45 records if total is less than limit
            var offsetNum = museumPlacesRecords.length;
            // add an OFFSET PARAMETER to ajax request for results after the ones we have already
            resourceRefObj.search_parameters.offset = offsetNum;
            getAsyncResource(index, resourceRefObj, selectedMuseumMarker);
          } else {
            // we have all available object places in museumData
            uiModel.obsCurrentMuseumObjects(placeObjectsDataResults.museumData.records);
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
            object_number: museumObjectNumber
          },
          url: 'https://www.vam.ac.uk/api/json/museumobject/' + museumObjectNumber, // V&A museum collection.museumobject search REST service
          isLoaded: 'no'
        };
        // make an AJAX async call for placeObjects data we dont store this object details data
        getAsyncResource(index, resourceRefObj);
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
        loadMorePlaceObjects: loadMorePlaceObjects,
        loadMorePlacesVisible: loadMorePlacesVisible,
        getmuseumObjectDetails: getmuseumObjectDetails,
        musuemDataIfExists: musuemDataIfExists,
        //-------------------------------------------------
        //simpleFormattedplaceName: simpleFormattedplaceName,
        clearFilter: clearFilter,
        removePlacefromMusuemData: removePlacefromMusuemData,
        clearSelectedObjectPlace: clearSelectedObjectPlace,
        clearSelectedMusuemObject: clearSelectedMusuemObject,
        clearSelectedMusuemMarker: clearSelectedMusuemMarker,
        setThumbImagePath: setThumbImagePath
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

      var markerListClick = function(museumMarker) {
        panMapToMuseumMarker(museumMarker);
        uiModel.obsSelectedMusuemMarker(museumMarker);
        // indicate marker with a short bounce
        musuemMarkerBounce(museumMarker);
      };

      var objectPlaceListClick = function(objectPlaceObj) {
        // set the uiModel state
        uiModel.obsSelectedMusuemObjectPlace(objectPlaceObj);
        // get museum data for objectPlace (from museumData or AJAX call)
        museumDataHelpers.requestPlaceMusuemObjects(objectPlaceObj.pk, uiModel.obsSelectedMusuemMarker());
      };

      var objectListClick = function(museumObj) {
        var museumObjectNumber = museumObj.fields.object_number;
        museumDataHelpers.getmuseumObjectDetails(museumObjectNumber);
        // open the musuemObject details window
        openMuseumObjectWindow(museumObj);
      };

      var removeMarker = function(musuemMarker, e) {
        // take the musuemMarkers google marker off map
        musuemMarker.prefPlaceMarker.setMap(null);
        // remove the musuemMarker from musuem app
        mapsModel.obsArrayMapMarkers.remove(musuemMarker);
        // remove musuemMarkerRef from musuemData (and localstorage)
        // so that its not rebuild at next session
        museumDataHelpers.removePlacefromMusuemData(musuemMarker);
        if (e !== undefined) {
          // prevent the mouseclick eveny=t going to the place list item
          e.stopImmediatePropagation();
        }
      };

      var showAllPlaces = function() {
        museumDataHelpers.clearSelectedMusuemMarker();
        zoomToAllPlaces();
      };

      var zoomToAllPlaces = function() {
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
          mapsModel.googleMap.fitBounds(bounds);
        }
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
        zoomToAllPlaces();
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
          strokeColor: 'yellow',
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
          if (uiModel.obsSelectedMusuemMarker()) {
            museumDataHelpers.clearSelectedMusuemMarker();
          }
          // create a new museum marker at pref preferred place closest to users actual geoloction
          // or selects existing musuemMarker if already made
          searchHere(latLng);
        }
      };

      var panMapToMuseumMarker = function(museumMarker) {
        if (museumMarker.bestPlace.geometry.hasOwnProperty('bounds')) {
          // if address has some bounds data
          mapsModel.googleMap.fitBounds(museumMarker.bestPlace.geometry.bounds);
          // if after bounds zoom we are really close in, back out zoom a bit
          if (mapsModel.googleMap.getZoom() > 14) {
            mapsModel.googleMap.setZoom(14);
          }
        } else {
          // address has no bounds data, pan to the location and set the zoom level
          mapsModel.googleMap.panTo(museumMarker.bestPlace.geometry.location);
          var currZoomLevel = mapsModel.googleMap.getZoom();
          if (currZoomLevel < 11) {
            mapsModel.googleMap.setZoom(12);
          } else {
            mapsModel.googleMap.setZoom(currZoomLevel);
          }
        }
        // indicate marker with a short bounce
        //musuemMarkerBounce(museumMarker);
      };

      var openMuseumObjectWindow = function() {
        // pan the map up by 1/3 of map height to show all infobox
        //panMapByPercentage(mapsModel.googleMap, 0, -0.6);

        // open musuemPlaceObjects window at map marker for obsSelectedMusuemMarker
        uiModel.musemObjectWindow.open(mapsModel.googleMap, uiModel.obsSelectedMusuemMarker().prefPlaceMarker);
        // infoBox is open : true
        uiModel.obsMusemObjectWindowVisible(true);
      };

      var openInfoBoxWithError = function(errorText) {
        uiModel.musemObjectWindow.open(mapsModel.googleMap);
        uiModel.musemObjectWindow.setContent(errorText);
      };

      // var panMapByPercentage = function(mapRef, offsetX, offsetY) {
      //   // http://stackoverflow.com/questions/10656743/how-to-offset-the-center-point-in-google-maps-api-v3
      //   var center = mapRef.getCenter(); // a latLng
      //   var span = mapRef.getBounds().toSpan(); // a latLng - # of deg map spans
      //   var newCenter = {
      //     lat: center.lat() + span.lat() * offsetY,
      //     lng: center.lng() + span.lng() * offsetX
      //   };
      //   mapRef.panTo(newCenter);
      // };

      var updateMusemObjectInfoBoxContents = function(objectDetails) {
        var content = '';
        if (objectDetails) {
          var details = objectDetails.fields;
          var labelText = ""; // default label is empty
          if (details.label !== "") {
            labelText = details.label;
          } else if (details.descriptive_line !== "") {
            labelText = details.descriptive_line;
          } else {
            if (details.artist !== "") {
              labelText = details.artist;
            }
            // all VaM details seem to have these field
            labelText += ' - ' + details.object + ', ' + details.date_text;
          }
          content += '<div class="ui card">';
          content += '<div class="ui segment">' + labelText + '</div>';
          content += ' </div>';

        }
        // update the musuemMarker infowindow
        uiModel.musemObjectWindow.setContent(content);
        return content;
      };

      var closeMuseumObjectWindow = function() {
        uiModel.musemObjectWindow.setContent('');
        uiModel.musemObjectWindow.close();
      };

      // center map on location
      var centerMap = function(loc) {
        google.maps.setCenter(loc);
      };

      var getMapCenter = function() {
        return mapsModel.googleMap.getCenter();
      };

      //--------------------------------------------------------------------------------
      // Function: makeMuseumMarker - makes a map marker to hold all museum data
      //--------------------------------------------------------------------------------
      var makeMuseumMarker = function(bestPlace) {
        var markerLabel = ''; // default marker label is none
        var placeAddressType = bestPlace.address_components[0].types[0];
        if (placeAddressType === 'street_number') {
          // use the street name not the street number for marker label
          if (bestPlace.address_components[1] !== undefined) {
            markerLabel = bestPlace.address_components[1].long_name;
          } else {
            markerLabel = bestPlace.address_components[0].long_name;
          }
        } else {
          if (bestPlace.address_components[1] !== undefined) {
            markerLabel = bestPlace.address_components[0].long_name;
          }
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
          animation: google.maps.Animation.DROP,
          zIndex: 0
        });

        // create 'musuemMarker' object literal
        var museumMarker = {
          VaM: ko.observable({}),
          prefPlaceMarker: marker,
          bestPlace: bestPlace,
          obsMuseumMarkerListLabel: ko.observable(false)
        };

        marker.addListener('click', function() {
          panMapToMuseumMarker(museumMarker);
          if (uiModel.obsSelectedMusuemMarker()) {
            // another marker is currently selected
            museumDataHelpers.clearSelectedMusuemMarker();
          }
          uiModel.obsSelectedMusuemMarker(museumMarker);
          // indicate marker with a short bounce
          musuemMarkerBounce(museumMarker);
        });

        // add marker to ko observable array for tracking, disposal etc
        mapsModel.obsArrayMapMarkers.push(museumMarker);
        return museumMarker;
      };

      var searchHere = function(location) {
        // if location is not valid google LatLng object (e.g comes from initmuseumPlaces)
        // convert it to a google LatLng
        // if uiSelectMarkerP is true the marker will be 'selected' on the map
        if (!(location instanceof google.maps.LatLng)) {
          location = new google.maps.LatLng(location.lat, location.lng);
        }
        // use geocoder to find 'preferred place'
        mapsModel.geocoder.geocode({
          'location': location,
          'bounds': mapsModel.googleMap.bounds // bias search results to the visible area of map
        }, function(results, status) {
          if (status === google.maps.GeocoderStatus.OK) {
            if (results) {
              var peferedPlaceP = function(curElement, index) {
                // local function used by $.grep function below
                // looks for preferred types of addresses in the address types returned by google places service
                var curTypes = curElement.types;
                var curTypesLength = curTypes.length;
                for (var i = 0; i < curTypesLength; i++) {
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
                  // search location is in within london
                  // so make search radius much smaller as V&M place data is much richer
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
                //no peferedPlaceP address
                // no 'best place' so choose first address of the original geocode results
                // usually a 'street address'
                bestPlace = results[0];
              }
              // got place on map - see what to do with it
              if (bestPlace.types[0] === "country") {
                // google geocoder tends to return a 'country' e.g United Kingdom for clicks in areas near coast
                // so we don't want this as it is a too general area
                uiModel.obsUIerrorHtml("Sorry can't find any places at this location");
                return false;
              }
              var musMarkerforPlace = mapMarkerExistsRef(bestPlace);
              if (musMarkerforPlace !== false) {
                // ------------------------------------------------------
                // the museum marker already exists in obsArrayMapMarkers
                // ------------------------------------------------------
                if (mapsModel.obsFilterSearch !== '') {
                  var indexOf = mapsModel.compFilterMapList().indexOf(musMarkerforPlace);
                  if (indexOf === -1) {
                    // users location is not in the current filtered place list
                    // so we have to clear any current filter
                    museumDataHelpers.clearFilter();
                  }
                }
                panMapToMuseumMarker(musMarkerforPlace);
                // select the musuem marker in the ui
                uiModel.obsSelectedMusuemMarker(musMarkerforPlace);
                // indicate marker with a short bounce
                musuemMarkerBounce(musMarkerforPlace);
                return true;
              } else {
                // a new bestPlace so create a museum marker
                var museumMarker = makeMuseumMarker(bestPlace);
                // clear map filter if active as its a 'new' marker and cannot be in the filtered list
                if (mapsModel.obsFilterSearch !== '') {
                  museumDataHelpers.clearFilter();
                }
                //----------------------------------------------------------------------------------
                // async request V&A museum place search
                // note: we cannot select the marker in ui until museum object async search callback
                //----------------------------------------------------------------------------------
                museumDataHelpers.requestMuseumPlaces(museumMarker, searchRadius);
                //----------------------------------------------------------------------------------
                return true;
              }
            } else {
              // no geocode results found
              uiModel.obsUIerrorHtml("No place found at this location. Please try somewhere else on the map");
              return false;
            }
          } else {
            // Gocoder Error
            uiModel.obsUIerrorHtml("Sorry can't find any places at this location");
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
          if (musMarkerArray[count].bestPlace.place_id === testPlace.place_id) {
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
        if (arguments.length === 2) {
          if (
            typeof arguments[0] === "number" &&
            typeof arguments[1] === "number"
          ) {
            lat = arguments[0];
            lng = arguments[1];
          }
        } else if (arguments.length === 1) {
          bounds = this.getBounds();
          if (!bounds && !bounds.contains(latLng)) {
            return false;
          }
          lat = latLng.lat();
          lng = latLng.lng();
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
        var zoomLimit = (mapsModel.googleMap.zoom > 5) ? true : false; // set zoom level that markers are shown from
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
        return boundsFilteredArray;
      };

      var filterMarkersOnMap = function() {
        // Comparing two arrays from http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
        var filteredMarkers = ko.utils.compareArrays(mapsModel.obsArrayMapMarkers(), mapsModel.compFilterMapList());
        ko.utils.arrayForEach(filteredMarkers, function(museumMarker) {
          if (museumMarker.status === "deleted") {
            museumMarker.value.prefPlaceMarker.setVisible(false);
          } else if (museumMarker.status === "retained") {
            museumMarker.value.prefPlaceMarker.setVisible(true);
          }
        });
      };

      var updateMapMarkerDisplay = function() {
        filterMarkersOnMap();
        markerLabelsDisplay();
        //displayMarkersInBounds();
      };

      //-----------------------------------------------------
      //  mapHelpers - public vars & functions
      //-----------------------------------------------------
      return {
        makeLondonPolygons: makeLondonPolygons,
        markerListClick: markerListClick,
        removeMarker: removeMarker,
        showAllPlaces: showAllPlaces,
        zoomToAllPlaces: zoomToAllPlaces,
        searchHere: searchHere,
        centerMap: centerMap,
        getMapCenter: getMapCenter,
        inLondon: inLondon,
        prefPlacePinOptions: prefPlacePinOptions,
        selectedPlacePinOptions: selectedPlacePinOptions,
        musuemObjectPlacePinOptions: musuemObjectPlacePinOptions,
        rebuildMarkersFromMusuemData: rebuildMarkersFromMusuemData,
        rebuildMarker: rebuildMarker,
        searchUsersLocation: searchUsersLocation,
        panMapToMuseumMarker: panMapToMuseumMarker,
        mapMarkerExistsRef: mapMarkerExistsRef,
        openMuseumObjectWindow: openMuseumObjectWindow,
        openInfoBoxWithError: openInfoBoxWithError,
        closeMuseumObjectWindow: closeMuseumObjectWindow,
        markerLabelsDisplay: markerLabelsDisplay,
        displayMarkersInBounds: displayMarkersInBounds,
        filterMarkersOnMap: filterMarkersOnMap,
        updateMapMarkerDisplay: updateMapMarkerDisplay,
        objectPlaceListClick: objectPlaceListClick,
        objectListClick: objectListClick,
        updateMusemObjectInfoBoxContents: updateMusemObjectInfoBoxContents
      };
    }(mapHelpers);
    //  END mapHelpers MODULE
    //-----------------------------------------------------

    // try and retrieve the users GEOLOCATION and then upscale to a preferred google place
    var getUsersLocalPlace = function() {
      if ("geolocation" in navigator) {
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
          // no error report in UI as button is not visible unless is successful
        };
        // try and get users geolocation from browser service
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
      }
    };
    //-----------------------------------------------------
    // Method to add custom knockout binding handlers
    //-----------------------------------------------------
    var koBindingHandlers = function() {

      // custom knockout binding handler for GOOGLE MAP
      ko.bindingHandlers.mapPanel = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          var map = new google.maps.Map(element, {
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
            mapHelpers.markerLabelsDisplay();
          });

          // map zoom event handler
          map.addListener('zoom_changed', function() {
            mapHelpers.markerLabelsDisplay();
          });

          // map double click event handler
          google.maps.event.addListener(mapsModel.googleMap, 'dblclick', function(event) {
            // we clear the place filter if active though
            // TODO we could check if an existing place is in filtered list
            // // so we dont reset the ui more than necessary
            museumDataHelpers.clearFilter();
            // do a 'best place' google search
            mapHelpers.searchHere(event.latLng);
            // hide the apps 'double click help caption'
            uiModel.obsHelpVisible(false);
          });

          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var halfDocumentHeight = ($(window).height() / 2);
            $('#map').height(halfDocumentHeight);
            var center = mapsModel.googleMap.getCenter();
            mapsModel.googleMap.setCenter(center);
          });
        },
        update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
          // TODO mapPanel UPDATE function
        }
      };
    };
    // method to subscribe to observerable changes
    var koSubscribers = function() {
      // -----------------------------------------------
      // all map markers - observable array - ON CHANGE
      // -----------------------------------------------
      mapsModel.obsArrayMapMarkers.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        mapHelpers.filterMarkersOnMap();
      }, null, "change");

      // ----------------------------------------------------
      // filtered map markers - observable array - ON CHANGE
      // ----------------------------------------------------
      mapsModel.compFilterMapList.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        mapHelpers.filterMarkersOnMap();
        mapHelpers.zoomToAllPlaces();
      }, null, "change");

      // ---------------------------------------
      // selected musuem marker - BEFORE CHANGE
      // ---------------------------------------
      uiModel.obsSelectedMusuemMarker.subscribe(function(oldMuseumMarkerObjRef) {
        if (oldMuseumMarkerObjRef) {
          // set style of map marker back to 'normal'
          oldMuseumMarkerObjRef.prefPlaceMarker.setIcon(mapHelpers.prefPlacePinOptions("gold"));
        }
      }, null, "beforeChange");
      // ---------------------------------------
      // selected musuem marker - ON CHANGE
      // ---------------------------------------
      uiModel.obsSelectedMusuemMarker.subscribe(function(newMuseumMarkerObj) {
        if (newMuseumMarkerObj) {
          // these three vars are declared here for scope in both if blocks below
          var location = newMuseumMarkerObj.prefPlaceMarker.getPosition();
          var searchRadius = 5; // default search radius in km
          var inlondonPoly = mapHelpers.inLondon(location);
          // set style of map marker to 'selected'
          newMuseumMarkerObj.prefPlaceMarker.setIcon(mapHelpers.selectedPlacePinOptions("salmon"));
          if (!newMuseumMarkerObj.VaM().hasOwnProperty('place')) {
            // musuemMarker does NOT have any museum places VaM data
            // maybe from failed VaM AJAX request, so try the request again
            if (inlondonPoly) {
              // search location is in within london
              // so make search radius much smaller as V&M place data is much richer
              if (inlondonPoly.name === 'centralLondon') {
                searchRadius = 0.5;
              } else {
                if (inlondonPoly.name === 'londonArea') {
                  searchRadius = 2;
                }
              }
            }
            //-------------------------------------------------------------------------
            // async request V&A museum place search
            //-------------------------------------------------------------------------
            museumDataHelpers.requestMuseumPlaces(newMuseumMarkerObj, searchRadius);
            //-------------------------------------------------------------------------
          } else {
            // we have some VaM place data (it may be zero results though)
            var VaMObjectPlacesData = newMuseumMarkerObj.VaM().place()[0];
            var totalObjectPlacesAvailable = VaMObjectPlacesData.meta.result_count;
            // this is the total number of objectPlaces available from VaM (we may not have them all yet)
            if (totalObjectPlacesAvailable === 0) {
              // if the place does not have any musuem places
              // this will prevent the musuem place list area showing with no results
              uiModel.obsCurrentPlaceObjects(false);
            } else {
              // there are some musuem places,  but check if we have total
              var numObjectPlaceRecords = VaMObjectPlacesData.records.length;
              if (numObjectPlaceRecords === totalObjectPlacesAvailable) {
                // we have total places so update the uiModel;
                uiModel.obsCurrentPlaceObjects(VaMObjectPlacesData.records);
              } else {
                //-------------------------------------------------------------------------
                // we dont have all the places so make a request for some more with offset
                //-------------------------------------------------------------------------
                if (inlondonPoly) {
                  // search location is in within london
                  // so make search radius much smaller as V&M place data is much richer
                  if (inlondonPoly.name === 'centralLondon') {
                    searchRadius = 0.5;
                  } else {
                    if (inlondonPoly.name === 'londonArea') {
                      searchRadius = 2;
                    }
                  }
                }
                // async request V&A museum place search with an offset
                //---------------------------------------------------------------------------------------------
                museumDataHelpers.requestMuseumPlaces(newMuseumMarkerObj, searchRadius, numObjectPlaceRecords);
                //---------------------------------------------------------------------------------------------
              }
            }
          }
        } else {
          uiModel.obsCurrentPlaceObjects(false);
        }
      }, null, "change");

      // -------------------------------------------------------------------
      // selected musuem object - ON CHANGE
      // -------------------------------------------------------------------
      uiModel.obsSelectedMusuemObject.subscribe(function(newDetailsObj) {
        if (newDetailsObj !== false) {
          mapHelpers.updateMusemObjectInfoBoxContents(newDetailsObj);
        }
      }, null, "change");

      // -------------------------------------------------------------------
      // obsUIerrorHtml - ON CHANGE
      // -------------------------------------------------------------------
      uiModel.obsUIerrorHtml.subscribe(function(newValue) {
        // pause a bit then set the UI message to false
        var aWhile = 3000; // wait in milliseconds
        var clearMessage = function() {
          clearTimeout(uiModel.appUIWarnTimeOutID);
          uiModel.obsUIerrorHtml(false);
        };
        uiModel.appUIWarnTimeOutID = setTimeout(clearMessage, aWhile);
      }, null, "change");

      // -------------------------------------------------------------------
      // for event AFTER filter input text has changed - ON CHANGE
      // -------------------------------------------------------------------
      mapsModel.obsFilterSearch.subscribe(function(newValue) {
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
    appFail: appFail,
    googleFail: googleFail,
    initmuseumPlaces: initmuseumPlaces,
    localStorageP: localStorageP,
    museumData: museumData
  };
  // END MODULE museumApp
  //---------------------------------------------------------
})();



window.googleSuccess = function() {
  "use strict";
  // we have to load InfoBox and MarkerWithLabel scripts after google maps library
  // as they are extended classes of google maps API.
  // so we load them using JQuery 'getScript' here in the 'google maps loaded' callback
  $.getScript("js/library/InfoBox.js")
    .done(function() {
      $.getScript("js/library/MarkerWithLabel.js")
        .done(function() {
          // google class scripts loaded
          // ---------------------------------------
          // init the museumApp and its viewModel
          museumApp.init();
          // ---------------------------------------
        })
        .fail(function() {
          // MarkerWithLabel script failed to load
          if (typeof ko === "object") {
            museumApp.appFail('MarkerWithLabel');
          }
        });
    })
    .fail(function() {
      // InfoBox script failed to load
      if (typeof ko === "object") {
        museumApp.appFail('InfoBox');
      }
    });
};

window.googleError = function() {
  "use strict";
  if (typeof ko === "object") {
    museumApp.appFail('google maps');
  }
};

//-----------------------------------
// JQuery document is ready function
//-----------------------------------
$(document).ready(function() {
  "use strict";
  // set height of map area to 50% of the current document height
  // hack to get google map bug to display as div will
  // have 0 height if div id map is not set
  var halfDocumentHeight = ($(window).height() / 1.7);
  $('#map').height(halfDocumentHeight);
  $('#map').css('visibility', 'visible');
});

//---------------------------------------------------------
