<<<<<<< HEAD
//---------------------------------------------------------
//    museumApp MODULE
//---------------------------------------------------------

var museumApp = (function() {
  "use strict";
  // vars are objects as museumApp will add property values
  var museumData = {};
  var museumViewModel = {
    ready: false
  };

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
    name: "Broekwijk, Brussel, Belgium",
    location: {
      lat: 50.851645,
      lng: 4.357623200000035
    }
  }, {
    name: "Leicester Square, London, UK",
    location: {
      lat: 51.5102585,
      lng: -0.1308881999999585
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
      initData.forEach(function(element, index, array) {
        museumApp.museumViewModel.vm.mapHelpers.searchHere(element.location);
      });
    }
  };

  //-------------------
  //  init museum APP
  //-------------------
  var init = function() {
    console.log("INIT");
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
    return true;
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
          // strip out musuem places that have no objects in their data
          var placesArray = museumDataResult.records;
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
          // musuemplaces are also stored inside the Museum Marker
          // so it has references to the places within radius of search
          updateTheMuseumMarker(musuemCollectionType, museumDataResult, updateObjectRef);
          museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemMarker(updateObjectRef);
          // pan and zoom map to (place) map marker location
          museumApp.museumViewModel.vm.mapsModel.googleMap.panTo(updateObjectRef.bestPlace.geometry.location);
          museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(10);
        } else if (musuemCollectionType === 'placeObjects') {
          // add an external imageURL for each museumObject in the museumDataResult
          // when its 'primary_image_id' field is "" we use a deafault image thumbnail
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
      console.dir(jqXHR);
      // output resource ref to console for debug
      console.log('AJAX resource FAILED:' + resourceRefObj.name);
      console.dir(resourceRefObj);
      if (resourceRefObj.dataType === 'json') {
        // if (resourceRefObj.modelCollection === "place") {
        //   // TODO a failed place resource leave museum app in unrecoverable states
        //   // so clean up the musuemMarker etc that have been already made
        // }
        museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(2);
        var errorText = 'Sorry, cannot get V&A museum ' + resourceRefObj.modelCollection + ' data';
        var helpText = '';
        // HTML for AJAX error infoBox window
        var errorHtml = '<div class="container" width="180" height="230">';
        errorHtml += '   <div class="ui segment">';
        errorHtml += '    <div class="ui header">';
        errorHtml += '     <div class="ui tiny image">';
        errorHtml += '      <img src="../img/VA_logo.png"></div>';
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
      } else if (resourceRefObj.dataType === 'script') {
        // set the reqs 'isLoaded' key in appReqs to show not loaded
        resourceRefObj.isLoaded = 'failed';
        var failText = '<div id="helloDiv" class="container">';
        failText += '     <div class="ui segment">';
        failText += '      <p class="ui header">Sorry Musuem App cannot start</p>';
        failText += '      <div class="ui tiny basic red label">';
        failText += '       <h3>' + resourceRefObj.name + ': Script failed to load</h3>';
        failText += '      </div>';
        failText += '     </div>';
        failText += '   </div>';
        // display fail message div
        $("#loadingArea").hide("slow");
        $(document.body).append(failText);
      }
    });
    // 'ALLWAYS' callback
    // request.always(function(jqXHR, textStatus, errorThrown) {
    // });
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
        var maxNumObjectPlaces = parseInt(objectPlace.meta.result_count);
        var numMusuemObjects = parseInt(objectPlace.records.length);
        /// create label string
        var label = "";
        if (maxNumObjectPlaces === 0) {
          label = 'sorry no musuem places';
        } else if (numMusuemObjects === maxNumObjectPlaces) {
          label = numMusuemObjects + " museum place";
        } else if (numMusuemObjects === 1) {
          label = numMusuemObjects + " museum place";
        } else if (numMusuemObjects > 1) {
          label = numMusuemObjects + ' of ' + maxNumObjectPlaces + " museum place";
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
      // infoBox for museum object details
      musemObjectWindow: new InfoBox({
        boxClass: 'musuemobject-infoBox',
        content: '',
        disableAutoPan: false,
        pixelOffset: new google.maps.Size(-150, 0), // offset to show window below musuemMarker label
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
        var label = '';
        var objectPlaceData = uiModel.obsSelectedMusuemObjectPlace().fields;
        // var totalObjects = objectPlaceData.museumobject_count;
        var currentNumObjects = uiModel.obsCurrentMuseumObjects().length;
        var placeName = objectPlaceData.name;
        // label for breadcrumb
        label = placeName + ' -   ' + currentNumObjects + ' object';
        if (currentNumObjects > 1) {
          // add plural if needed to label
          label += 's';
        }
        return label;
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
            museumObj.imgURL = "../img/VandA_logo70x70.png";
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
        uiModel.obsSelectedMusuemObjectPlace(false);
        uiModel.obsCurrentMuseumObjects(false);
        clearSelectedMusuemObject();
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
          url: 'http://www.vam.ac.uk/api/json/place/search', // V&A museum collection.places search REST service
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
          // setup a new object literal to store in the musuemMarker
          var museumCollectionDataObj = {
            googlePlace: preferedPlace,
            resourceRefObj: resourceRefObj,
            museumCollectionType: resourceRefObj.modelCollection, // property name used in musuemData to store data
            museumData: placeDataResults
          };
          //---------------------------------------------------------
          // update the uiModel with museum object places
          //---------------------------------------------------------
          uiModel.obsCurrentPlaceObjects(placeDataResults);
          //---------------------------------------------------------
        } else {
          // else use async AJAX call to try and get some place data and update the uiModel if success
          var index = 0; // NOTE needed as first argument to getAsyncResource function
          getAsyncResource(index, resourceRefObj, museumMarker);
        }
      };

      var loadMorePlacesVisible = ko.computed(function() {
        if (uiModel.obsSelectedMusuemObjectPlace()) {
          var museumPlaceObj = uiModel.obsSelectedMusuemObjectPlace();
          var totalNumObjects = parseInt(museumPlaceObj.fields.museumobject_count);
          var currentNumObjects = uiModel.obsCurrentMuseumObjects().length;
          if (currentNumObjects !== undefined) {
            if (currentNumObjects < totalNumObjects) {
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
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
          url: 'http://www.vam.ac.uk/api/json/museumobject/' + museumObjectNumber, // V&A museum collection.museumobject search REST service
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

      var markerListClick = function(musuemMarker) {
        panMapToMuseumMarker(musuemMarker);
        uiModel.obsSelectedMusuemMarker(musuemMarker);
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
        // prevent th mouseclick eveny=t going to the place list item
        e.stopImmediatePropagation();
      };

      var showAllMarkers = function() {
        museumDataHelpers.clearSelectedMusuemMarker();
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
          mapsModel.googleMap.fitBounds(bounds);
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
          museumDataHelpers.clearFilter();
          // add museum marker at pref place closest to users geoloction
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
            museumDataHelpers.clearSelectedObjectPlace();
          }
          uiModel.obsSelectedMusuemMarker(museumMarker);
        });

        // google.maps.event.addListener(marker, "mouseover", function() {
        //   // set all visible marker to zIndex 0
        //   var visibleMuseumMarkers = mapsModel.obsFilteredBoundsMarkers();
        //   for (var i = 0; i < visibleMuseumMarkers.length; i++) {
        //     visibleMuseumMarkers[i].prefPlaceMarker.setZIndex(0);
        //   }
        //   // raise up the marker the mouse is over
        //   // so label is easier to read and marker is easier to click
        //   marker.setZIndex(1);
        // });

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
                console.log('no peferedPlaceP address');
                // no best place so choose first address of the original geocode results
                // usually a 'street address'
                bestPlace = results[0];
              }
              var musMarkerforPlace = mapMarkerExistsRef(bestPlace);
              if (musMarkerforPlace !== false) {
                // museum marker already exists for bestplace
                panMapToMuseumMarker(musMarkerforPlace);
              } else {
                // create a new museumMarker for the bestPlace
                var museumMarker = makeMuseumMarker(bestPlace);
                // clear map filter if active
                if (mapsModel.obsFilterSearch !== '') {
                  museumDataHelpers.clearFilter();
                }
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
        //displayMarkersInBounds();
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
        console.log('local location not found 😞 with error: ' + geolocationErrorCodes[error]);
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
            // mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
            mapHelpers.markerLabelsDisplay();
          });

          // map zoom event handler
          map.addListener('zoom_changed', function() {
            // mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
            mapHelpers.markerLabelsDisplay();
          });

          // map double click event handler
          google.maps.event.addListener(mapsModel.googleMap, 'dblclick', function(event) {
            museumDataHelpers.clearSelectedMusuemMarker();
            // clear place filter if active TODO could check if new place would be allowed in filter
            museumDataHelpers.clearFilter();
            // do a 'best place' google search
            mapHelpers.searchHere(event.latLng);
            // hide the help caption at top te app
            uiModel.obsHelpVisible(false);
          });

          // browser window resize event handler
          google.maps.event.addDomListener(window, "resize", function() {
            var halfDocumentHeight = ($(window).height() / 2);
            $('#map').height(halfDocumentHeight);
            var center = map.getCenter();
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
        mapHelpers.showAllMarkers();
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
      // selected musuem object place - BEFORE CHANGE
      // -------------------------------------------------------------------
      // uiModel.obsSelectedMusuemObjectPlace.subscribe(function(newPlaceObj) {
      //
      // }, null, "beforeChange");
      // -------------------------------------------------------------------
      // selected musuem object place - ON CHANGE
      // -------------------------------------------------------------------
      // uiModel.obsSelectedMusuemObjectPlace.subscribe(function(newPlaceObj) {
      //
      // }, null, "change");

      // -------------------------------------------------------------------
      // selected musuem object - ON CHANGE
      // -------------------------------------------------------------------
      uiModel.obsSelectedMusuemObject.subscribe(function(newDetailsObj) {
        if (newDetailsObj !== false) {
          mapHelpers.updateMusemObjectInfoBoxContents(newDetailsObj);
        }
      }, null, "change");

      // -------------------------------------------------------------------
      // for event AFTER filter input text has changed - ON CHANGE
      // -------------------------------------------------------------------
      mapsModel.obsFilterSearch.subscribe(function(newValue) {
        // updates the map to show markers in compFilterMapList
        //mapsModel.obsFilteredBoundsMarkers(mapHelpers.displayMarkersInBounds());
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
  // as they are class extensions of google map classes that need to be defined.
  // so we load them using JQuery 'getScript' here in the 'google maps loaded' callback
  $.getScript("js/library/InfoBox.js")
    .done(function(script, textStatus) {
      $.getScript("js/library/MarkerWithLabel.js")
        .done(function(script, textStatus) {
          // all required scripts are now loaded so init the museumApp
          museumApp.init();
        })
        .fail(function(jqxhr, settings, exception) {
          ///
        })
    })
    .fail(function(jqxhr, settings, exception) {
      ///
    });
};

window.googleError = function() {
  "use strict";
  alert("google maps error");
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
=======
var museumApp=function(){var e=!1,o={},a={ready:!1},t=function(){function e(e){return"object"==typeof window[e.name]}function o(e){return"function"==typeof window[e.name]}return{objectTest:e,functionTest:o}}(t),r=[{name:"InfoBox",dataType:"script",url:"js/library/InfoBox.js",isLoaded:"no",libraryTest:"functionTest",isReady:!1},{name:"ko",dataType:"script",url:"js/library/knockout.js",isLoaded:"no",libraryTest:"objectTest",isReady:!1},{name:"MarkerWithLabel",dataType:"script",url:"js/library/MarkerWithLabel.js",isLoaded:"no",libraryTest:"functionTest",isReady:!1}],n=[{name:"City of Bristol, UK",location:{lat:51.454513,lng:-2.5879099999999653}},{name:"Worcester, Worcester, UK",location:{lat:52.193636,lng:-2.22157500000003}},{name:"Broekwijk, Brussel, Belgium",location:{lat:50.851645,lng:4.357623200000035}},{name:"Leicester Square, London, UK",location:{lat:51.5102585,lng:-.1308881999999585}},{name:"Sèvres, Hauts-de-Seine Ile-de-France",location:{lat:48.824329,lng:2.21212}}],s=function(){var e=!!function(){var e,o=+new Date;try{return localStorage.setItem(o,o),e=localStorage.getItem(o)==o,localStorage.removeItem(o),e}catch(a){}}()&&localStorage;return e},l=function(){var e=n;museumApp.localStorageP()&&void 0!==museumApp.museumData.data?museumApp.museumViewModel.vm.mapHelpers.rebuildMarkersFromMusuemData():(console.log("first time app run or no local storage"),u(e))},u=function(e){if(e.length>0){for(var o=0;o<e.length;o++){var a=e[o];museumApp.museumViewModel.vm.mapHelpers.searchHere(a.location)}window.setTimeout(function(){museumApp.museumViewModel.vm.mapHelpers.showAllMarkers()},1e3)}},i=function(){s()&&localStorage.museumDataStored&&(console.log("GOT SOME LOCAL museumDataStored"),o.data=JSON.parse(localStorage.museumDataStored)),$.each(r,c),b("AJAX javascript REQUESTS : "+r.length);var e=function(){for(var e=0,o=0;o<r.length;o++){var a=r[o];n(a)&&(e+=1)}return e===r.length},n=function(e){if(e.isReady===!0)return!0;var o=t[e.libraryTest];return o(e)?(e.isReady=!0,!0):!1},u=function(){if(e()){clearInterval(m),console.log("😀 museum App Scripts READY"),b("😀 museum App Scripts READY"),ko.options.deferUpdates=!0;var o=new f;return a.vm=o,ko.applyBindings(a.vm),a.ready=!0,b(" 😀 viewmodel READY"),l(),$("#loadingArea").hide("slow"),$("body").removeClass("initial-hide"),!0}return!1},i=function(){clearInterval(m),e()||console.log("sorry the musuem app is not working")},m=window.setInterval(u,50);window.setTimeout(i,2e4)},c=function(e,o,a){var t=$.ajax({url:o.url,type:"GET",data:o.search_parameters,dataType:o.dataType,timeout:1e4});t.done(function(e,t,r){if(o.isLoaded="loaded","json"===o.dataType){var n={},s=o.modelCollection;if("place"===s){var l=e.records,u=l.filter(function(e){return e.fields.museumobject_count>0});l.length!==u.length&&(e.meta.result_count=u.length,e.records=u),n={googlePlace:a.bestPlace,resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:e},m(s,e,a),museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemMarker(a),museumApp.museumViewModel.vm.mapsModel.googleMap.panTo(a.bestPlace.geometry.location),museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(10)}else if("placeObjects"===s){museumApp.museumViewModel.vm.museumDataHelpers.setThumbImagePath(e),n={resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:e};var i=e.records;museumApp.museumViewModel.vm.uiModel.obsCurrentMuseumObjects(i)}else if("objectDetails"===s){var c=e[0],p=c.fields.image_set;filteredArray=p.filter(function(e){return e.fields.local.length>0}),e[0].fields.image_set=filteredArray,museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemObject(c),n={resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:c}}$.isEmptyObject(n)?console.log("did not recognise JSON musuemCollectionType "+s):d(n)}}),t.fail(function(e,a,t){if(console.dir(e),console.log("AJAX resource FAILED:"+o.name),console.dir(o),"json"===o.dataType){museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(2);var r="Sorry, cannot get V&A museum "+o.modelCollection+" data",n="",s='<div class="container" width="180" height="230">';s+='   <div class="ui segment">',s+='    <div class="ui header">',s+='     <div class="ui tiny image">',s+='      <img src="../img/VA_logo.png"></div>',s+='      <div class="segment">',s+="        <h3>"+o.name+"</h3>",s+="        <p>"+r+"</p>",s+="        <p>"+n+"</p>",s+="      </div>",s+="    </div>",s+="  </div>",s+="  </div>",museumApp.museumViewModel.vm.mapHelpers.openInfoBoxWithError(s)}else if("script"===o.dataType){o.isLoaded="failed";var l='<div id="helloDiv" class="container">';l+='     <div class="ui segment">',l+='      <p class="ui header">Sorry Musuem App cannot start</p>',l+='      <div class="ui tiny basic red label">',l+="       <h3>"+o.name+": Script failed to load</h3>",l+="      </div>",l+="     </div>",l+="   </div>",$("#loadingArea").hide("slow"),$(document.body).append(l)}b(o.name+" 😞 not loaded with error: "+t)}),t.always(function(e,a,t){b("😀 "+o.name+" :- AJAX "+o.dataType+" "+a)})},m=function(e,o,a){a.VaM().hasOwnProperty[e]?a.VaM()[e].push(o):(a.VaM()[e]=ko.observableArray([]),a.VaM()[e].subscribe(function(e){var o=a.VaM().place()[0],t=parseInt(o.meta.result_count),r=parseInt(o.records.length);0===t?label="sorry no musuem places":r===t?label=r+" museum place":1===r?label=r+" museum place":r>1&&(label=r+" of "+t+" museum place"),t>1&&(label+="s"),a.obsMuseumMarkerListLabel(label)}),a.VaM()[e].push(o))},p=function(e){var o=new Uint8Array((e||40)/2);return window.crypto.getRandomValues(o),[].map.call(o,function(e){return e.toString(16)}).join("")},d=function(e){var a=e.resourceRefObj,t=a.modelCollection,r="unknown_"+p(20);if("place"===t?r=a.placeID:"placeObjects"===t?r=a.search_parameters.place.toString():"objectDetails"===t&&(r=e.museumData.pk.toString()),o.data||(o.data={}),o.data.hasOwnProperty(t)||(o.data[t]={}),o.data[t].hasOwnProperty(r)&&a.search_parameters.hasOwnProperty("offset"))for(var n=o.data[t][r].museumData.records,s=e.museumData,l=0;l<n.length;l++)s.records.unshift(n[l]);o.data[t][r]=e,g()},g=function(){s()&&(localStorage.museumDataStored?localStorage.museumDataStored=JSON.stringify(o.data):(localStorage.museumDataStored={},localStorage.museumDataStored=JSON.stringify(o.data)))},b=function(e){var o='<p class="message">'+e+"</p>";$("#log-area").append(o)},f=function(){var e={placeTypeInPrefOrder:["neighborhood","political","locality","administrative_area_level_4","administrative_area_level_3","administrative_area_level_2"],obsArrayMapMarkers:ko.observableArray([]),obsFilteredBoundsMarkers:ko.observableArray([]),obsUserLocalPlace:ko.observable(!1),obsFilterSearch:ko.observable(""),obsSelectedPlace:ko.observable(!1)};e.compFilterMapList=ko.computed(function(){var o=e.obsFilterSearch().toLowerCase();return""===o?e.obsArrayMapMarkers():ko.utils.arrayFilter(e.obsArrayMapMarkers(),function(e){var a=e.bestPlace.formatted_address.toLowerCase(),t=a.indexOf(o);return t>=0})}),e.compSortedMapMarkers=ko.computed(function(){var o=e.compFilterMapList();if(o.length>1){var a=o.sort(function(e,o){var a="";a="street_number"===e.bestPlace.address_components[0].types[0]?e.bestPlace.address_components[1].long_name.split(" ")[0].toLowerCase():e.bestPlace.address_components[0].long_name.split(" ")[0].toLowerCase();var t="";return t="street_number"===e.bestPlace.address_components[0].types[0]?o.bestPlace.address_components[1].long_name.split(" ")[0].toLowerCase():o.bestPlace.address_components[0].long_name.split(" ")[0].toLowerCase(),a===t?0:t>a?-1:1});return a}return o});var a={musemObjectWindow:new InfoBox({boxClass:"musuemobject-infoBox",content:"",disableAutoPan:!1,pixelOffset:new google.maps.Size(-150,0),zIndex:null,closeBoxURL:"",closeBoxMargin:""}),obsHelpVisible:ko.observable(!0),obsMusemObjectWindowVisible:ko.observable(!1),obsSelectedMusuemMarker:ko.observable(!1),obsSelectedMusuemObjectPlace:ko.observable(!1),obsSelectedMusuemObject:ko.observable(!1),obsCurrentPlaceObjects:ko.observableArray([]),obsCurrentMuseumObjects:ko.observableArray([])};a.compShowMusuemMarkersList=ko.computed(function(){return!a.obsSelectedMusuemMarker()}),a.compShowMusuemPlaceList=ko.computed(function(){return a.compShowMusuemMarkersList()?!1:a.obsCurrentPlaceObjects()===!1?(t.clearSelectedMusuemMarker(),!1):!a.obsSelectedMusuemObjectPlace()}),a.compShowMusuemObjectsList=ko.computed(function(){return a.obsSelectedMusuemObjectPlace()?!a.obsSelectedMusuemObject():!1}),a.compMuseumMarkerCrumb=ko.computed(function(){return a.obsSelectedMusuemMarker()?a.obsSelectedMusuemMarker().prefPlaceMarker.labelContent:""}),a.compObjectPlaceCrumb=ko.computed(function(){if(a.obsSelectedMusuemObjectPlace()){if(0===a.obsCurrentMuseumObjects().length)return"";var e="",o=a.obsSelectedMusuemObjectPlace().fields,t=a.obsCurrentMuseumObjects().length,r=o.name;return e=r+" -   "+t+" object",t>1&&(e+="s"),e}return""}),a.compMusuemObjectCrumb=ko.computed(function(){if(a.obsSelectedMusuemObject()){var e=a.obsSelectedMusuemObject().fields,o=e.title;return""===o&&(o=e.object),o+=", "+e.date_text}return""}),a.compNumOfPlacesForZoomOnMap=ko.computed(function(){var o=e.compFilterMapList().length,a="Zoom "+o+" place";return 0===o?a="no places":o>1&&(a+="s"),a}),a.compFilterButtonLabel=ko.computed(function(){var o=e.compFilterMapList().length,a=e.obsArrayMapMarkers().length;return o===a?"Filter places":"Clear Filter"}),a.compFilterLabelText=ko.computed(function(){var o=e.compFilterMapList().length,a=e.obsArrayMapMarkers().length;return o===a?"all places":0===o?"no places":o+" of "+a+" places"});var t=function(){var t=function(e){for(var o=e.records,a=0;a<o.length;a++){var t=o[a];if(t.fields.primary_image_id.length>0){var r="http://media.vam.ac.uk/media/thira/collection_images/",n=t.fields.primary_image_id,s=n.substring(0,6),l=r+s+"/"+n+"_jpg_s.jpg";t.imgURL=l}else t.imgURL="img/VandA_logo70x70.png"}},n=function(){u(),l(),a.obsCurrentPlaceObjects(!1),a.obsSelectedMusuemMarker(!1)},l=function(){a.obsSelectedMusuemObjectPlace(!1),a.obsCurrentMuseumObjects(!1),u()},u=function(){r.closeMuseumObjectWindow(),a.obsMusemObjectWindowVisible(!1),a.obsSelectedMusuemObject(!1)},i=function(e){var a=e.bestPlace.place_id,t=museumApp.museumData.data.place;delete t[a],s()&&(localStorage.museumDataStored?localStorage.museumDataStored=JSON.stringify(o.data):(localStorage.museumDataStored={},localStorage.museumDataStored=JSON.stringify(o.data)))},m=function(){e.obsFilterSearch("")},p=function(e,o,t){var r=e.bestPlace,n="V&A collection place name search for museumobjects: "+r.address_components[0].short_name,s=r.geometry.location,l={placeLoc:s,placeID:r.place_id,placeName:r.address_components[0].short_name,name:n,modelCollection:"place",dataType:"json",search_parameters:{latitude:r.geometry.location.lat,longitude:r.geometry.location.lng,orderby:"distance",radius:o,limit:45},url:"http://www.vam.ac.uk/api/json/place/search",isLoaded:"no"};t&&(l.search_parameters.offset=t);var u=M(l.modelCollection,l.placeID);if(u!==!1){({googlePlace:r,resourceRefObj:l,museumCollectionType:l.modelCollection,museumData:u});a.obsCurrentPlaceObjects(u)}else{var i=0;c(i,l,e)}},d=ko.computed(function(){if(a.obsSelectedMusuemObjectPlace()){var e=a.obsSelectedMusuemObjectPlace(),o=parseInt(e.fields.museumobject_count),t=a.obsCurrentMuseumObjects().length;return void 0!==t?o>t:!1}return!1}),g=function(){if(a.obsSelectedMusuemObjectPlace()){var e=a.obsSelectedMusuemObjectPlace().pk;b(e,a.obsSelectedMusuemMarker())}},b=function(e,o){var t=0,r="V&A - museum placeObjects for collection.place - pk: "+e,n={name:r,modelCollection:"placeObjects",dataType:"json",search_parameters:{place:e,limit:45},url:"http://www.vam.ac.uk/api/json/museumobject/",isLoaded:"no"},s=M(n.modelCollection,e);if(s){var l=s.museumData.meta.result_count,u=s.museumData.records;if(u.length<l){var i=u.length;n.search_parameters.offset=i,c(t,n,o)}else a.obsCurrentMuseumObjects(s.museumData.records)}else c(t,n,o)},f=function(e){var o=0,a="V&A - museum object details:  "+e,t={name:a,modelCollection:"objectDetails",dataType:"json",search_parameters:{object_number:e},url:"http://www.vam.ac.uk/api/json/museumobject/"+e,isLoaded:"no"};c(o,t)},M=function(e,o){if(!museumApp.museumData.hasOwnProperty("data"))return!1;if(museumApp.museumData.data.hasOwnProperty(e)){var a=museumApp.museumData.data[e];return a.hasOwnProperty(o)?a[o]:!1}},v=function(e){if(e.VaM&&e.VaM().hasOwnProperty("place")){var o=e.VaM().place()[0];return o.records}return[]};return{getMusuemMarkerPlaces:v,requestMuseumPlaces:p,requestPlaceMusuemObjects:b,loadMorePlaceObjects:g,loadMorePlacesVisible:d,getmuseumObjectDetails:f,musuemDataIfExists:M,clearFilter:m,removePlacefromMusuemData:i,clearSelectedObjectPlace:l,clearSelectedMusuemObject:u,clearSelectedMusuemMarker:n,setThumbImagePath:t}}(t),r=function(){var o=function(){var e=[],o=[{lat:51.51942532808189,lng:-.391387939453125},{lat:51.61545844207286,lng:-.2190399169921875},{lat:51.64103302109062,lng:-.10162353515625},{lat:51.5954149508168,lng:.031585693359375},{lat:51.549751017014195,lng:.11260986328125},{lat:51.49121712928709,lng:.1318359375},{lat:51.42104840561726,lng:.0494384765625},{lat:51.40306101512005,lng:-.078277587890625},{lat:51.40777268236964,lng:-.22247314453125},{lat:51.47240196119371,lng:-.3714752197265625}],a=[{lat:51.520493477218274,lng:-.16736984252929688},{lat:51.535872047109315,lng:-.10969161987304688},{lat:51.53864817973768,lng:-.034503936767578125},{lat:51.50307952226442,lng:-.016651153564453125},{lat:51.4973090140083,lng:-.09304046630859375},{lat:51.47122575543907,lng:-.11707305908203125},{lat:51.4608524464555,lng:-.17526626586914062},{lat:51.47218810785753,lng:-.20788192749023438},{lat:51.4973090140083,lng:-.22212982177734375},{lat:51.51739577570338,lng:-.20341873168945312}],t=new google.maps.Polygon({paths:o,strokeColor:"#FF0000",strokeOpacity:.1,strokeWeight:2,fillColor:"#FF0000",fillOpacity:.1}),r=new google.maps.Polygon({paths:a,strokeColor:"blue",strokeOpacity:.1,strokeWeight:2,fillColor:"blue",fillOpacity:.1});return e.push({name:"londonArea",polygon:t}),e.push({name:"centralLondon",polygon:r}),e},n=function(e){h(e),a.obsSelectedMusuemMarker(e)},s=function(e){a.obsSelectedMusuemObjectPlace(e),t.requestPlaceMusuemObjects(e.pk,a.obsSelectedMusuemMarker())},l=function(e){museumObjectNumber=e.fields.object_number,t.getmuseumObjectDetails(museumObjectNumber),k(e)},u=function(o,a){o.prefPlaceMarker.setMap(null),e.obsArrayMapMarkers.remove(o),t.removePlacefromMusuemData(o),a.stopImmediatePropagation()},i=function(){t.clearSelectedMusuemMarker();var o=e.compFilterMapList().length;if(o>0){for(var a=new google.maps.LatLngBounds,r=e.compFilterMapList(),n=0;n<r.length;n++){var s=r[n].prefPlaceMarker;a.extend(s.getPosition())}c(a)}else console.log("no markers on map for bounds")},c=function(o){setTimeout(function(){e.googleMap.fitBounds(o)},10)},p=function(){var e=museumApp.museumData.data.place,o=0;if(e){for(var a in e){var t=e[a];d(t),o+=1}console.log("rebuild "+o+" markers from museumData"),i()}},d=function(e){var o=S(e.googlePlace),a=e.resourceRefObj.modelCollection,t=e.museumData;m(a,t,o)},g=function(e){return{path:"M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",fillColor:e,fillOpacity:.75,strokeColor:"salmon",strokeWeight:3,scale:.9}},b=function(e){return{path:"M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",fillColor:e,fillOpacity:.75,strokeColor:"yellow",strokeWeight:4,scale:1}},f=function(){return{path:google.maps.SymbolPath.CIRCLE,fillColor:"salmon",fillOpacity:1,strokeColor:"yellow",strokeWeight:1,scale:4}},M=function(e){var o=e.prefPlaceMarker;o.setAnimation(google.maps.Animation.BOUNCE),setTimeout(function(){o.setAnimation(null)},1400)},v=function(){var o=e.obsUserLocalPlace();if(o){var a={lat:o.geoPosition.coords.latitude,lng:o.geoPosition.coords.longitude};t.clearFilter(),L(a)}},h=function(o){if(o.bestPlace.geometry.hasOwnProperty("bounds"))e.googleMap.fitBounds(o.bestPlace.geometry.bounds),e.googleMap.getZoom()>14&&e.googleMap.setZoom(14);else{map.panTo(o.bestPlace.geometry.location);var a=e.googleMap.getZoom();11>a?e.googleMap.setZoom(12):e.googleMap.setZoom(a)}M(o)},k=function(){a.musemObjectWindow.open(e.googleMap,a.obsSelectedMusuemMarker().prefPlaceMarker),a.obsMusemObjectWindowVisible(!0)},y=function(o){a.musemObjectWindow.open(e.googleMap),a.musemObjectWindow.setContent(o)},P=function(e){var o="";if(e){var t=e.fields,r="";""!==t.label?r=t.label:""!==t.descriptive_line?r=t.descriptive_line:(""!==t.artist&&(r=t.artist),r+=" - "+t.object+", "+t.date_text),o+='<div class="ui card">',o+='<div class="ui segment">'+r+"</div>",o+=" </div>"}return a.musemObjectWindow.setContent(o),o},O=function(){a.musemObjectWindow.setContent(""),a.musemObjectWindow.close()},j=function(e){map.setCenter(e)},w=function(){return e.googleMap.getCenter()},S=function(o){var n="",s=o.address_components[0].types[0];"street_number"===s?n=void 0!==o.address_components[1]?o.address_components[1].long_name:o.address_components[0].long_name:void 0!==o.address_components[1]&&(n=o.address_components[0].long_name);var l=4*n.length,u=new MarkerWithLabel({position:o.geometry.location,map:e.googleMap,icon:r.prefPlacePinOptions("gold"),id:o.place_id,draggable:!1,labelContent:n,labelAnchor:new google.maps.Point(l,0),labelClass:"place-labels",labelInBackground:!1,labelVisible:!0,visible:!0,animation:google.maps.Animation.DROP,zIndex:0}),i={VaM:ko.observable({}),prefPlaceMarker:u,bestPlace:o,obsMuseumMarkerListLabel:ko.observable(!1)};return u.addListener("click",function(e){h(i),a.obsSelectedMusuemMarker()&&t.clearSelectedObjectPlace(),a.obsSelectedMusuemMarker(i)}),google.maps.event.addListener(u,"mouseover",function(){for(var o=e.obsFilteredBoundsMarkers(),a=0;a<o.length;a++)o[a].prefPlaceMarker.setZIndex(0);u.setZIndex(1)}),e.obsArrayMapMarkers.push(i),i},L=function(o){o instanceof google.maps.LatLng||(o=new google.maps.LatLng(o.lat,o.lng));var a=e.googleMap;e.geocoder.geocode({location:o,bounds:a.bounds},function(a,r){if(r!==google.maps.GeocoderStatus.OK)return console.log("Gocoder Error: "+r),!1;if(!a)return console.log("no geocode results found"),!1;var n=function(o,a){for(var t=o.types,r=0;r<t.length;r++){var n=t[r],s=e.placeTypeInPrefOrder.indexOf(n);if(-1!==s)return!0}return!1},s=$.grep(a,n),l=5,u=!1;if(s.length>0){var i=C(o);i?("centralLondon"===i.name?l=.5:"londonArea"===i.name&&(l=2),u=a[0]):u=s[0]}else console.log("no peferedPlaceP address"),u=a[0];var c=A(u);if(c!==!1)h(c);else{var m=S(u);""!==e.obsFilterSearch&&t.clearFilter(),t.requestMuseumPlaces(m,l)}})},C=function(o){var a=e.londonPolygonAreas[1],t=e.londonPolygonAreas[0];return a.polygon.containsLatLng(o)?a:t.polygon.containsLatLng(o)?t:!1},A=function(o){for(var a=e.obsArrayMapMarkers(),t=0;t<a.length;t++)if(a[t].bestPlace.place_id===o.place_id)return a[t];return!1};google.maps.Polygon.prototype.getBounds||(google.maps.Polygon.prototype.getBounds=function(e){var o,a,t,r=new google.maps.LatLngBounds,n=this.getPaths();for(a=0;a<n.getLength();a++)for(o=n.getAt(a),t=0;t<o.getLength();t++)r.extend(o.getAt(t));return r}),google.maps.Polygon.prototype.containsLatLng=function(e){var o,a,t,r,n,s,l,u,i,c,m,p=!1;if(2===arguments.length)"number"==typeof arguments[0]&&"number"==typeof arguments[1]&&(a=arguments[0],t=arguments[1]);else if(1===arguments.length){if(o=this.getBounds(),!o&&!o.contains(e))return!1;a=e.lat(),t=e.lng()}else console.log("Wrong number of inputs in google.maps.Polygon.prototype.contains.LatLng");for(r=this.getPaths().getLength(),n=0;r>n;n++)for(s=this.getPaths().getAt(n),l=s.getLength(),i=l-1,u=0;l>u;u++)c=s.getAt(u),m=s.getAt(i),(c.lng()<t&&m.lng()>=t||m.lng()<t&&c.lng()>=t)&&c.lat()+(t-c.lng())/(m.lng()-c.lng())*(m.lat()-c.lat())<a&&(p=!p),i=u;return p};var _=function(){for(var o=e.googleMap.zoom>7,a=e.compFilterMapList(),t=0;t<a.length;t++)a[t].prefPlaceMarker.labelVisible=o},D=function(){var o=ko.utils.arrayFilter(e.compFilterMapList(),function(o){var a=e.googleMap.getBounds();return a.contains(o.prefPlaceMarker.getPosition())});return o},T=function(){var o=ko.utils.compareArrays(e.obsArrayMapMarkers(),e.compFilterMapList());ko.utils.arrayForEach(o,function(o){"deleted"===o.status?o.value.prefPlaceMarker.setMap(null):"retained"===o.status&&o.value.prefPlaceMarker.setMap(e.googleMap)})},I=function(){T(),_()};return{makeLondonPolygons:o,markerListClick:n,removeMarker:u,showAllMarkers:i,searchHere:L,centerMap:j,getMapCenter:w,inLondon:C,prefPlacePinOptions:g,selectedPlacePinOptions:b,musuemObjectPlacePinOptions:f,rebuildMarkersFromMusuemData:p,rebuildMarker:d,searchUsersLocation:v,panMapToMuseumMarker:h,mapMarkerExistsRef:A,openMuseumObjectWindow:k,openInfoBoxWithError:y,closeMuseumObjectWindow:O,markerLabelsDisplay:_,displayMarkersInBounds:D,filterMarkersOnMap:T,updateMapMarkerDisplay:I,objectPlaceListClick:s,objectListClick:l,updateMusemObjectInfoBoxContents:P}}(r),n=function(){if("geolocation"in navigator){var o={maximumAge:6e5,timeout:15e3},a=function(o){e.obsUserLocalPlace({geoPosition:o})},t=function(e){museumApp.addMessage("local location not found 😞 with error: "+r[e])},r={0:"inknown Error",1:"permission denied",2:"postion unavailable",3:"timed out"};navigator.geolocation.getCurrentPosition(a,t,o)}},l=function(){ko.bindingHandlers.fadeInText={update:function(e,o){$(e).hide(),ko.bindingHandlers.text.update(e,o),$(e).fadeIn()}},ko.bindingHandlers.mapPanel={init:function(o,n,s,l,u){map=new google.maps.Map(o,{backgroundColor:"none",disableDoubleClickZoom:!0,mapTypeControl:!1,zoomControl:!0,zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_CENTER},scaleControl:!0,mapTypeId:google.maps.MapTypeId.TERRAIN,center:new google.maps.LatLng(51.478771,-.011074),zoom:11}),e.googleMap=map,e.geocoder=new google.maps.Geocoder(map),e.londonPolygonAreas=r.makeLondonPolygons(),map.addListener("bounds_changed",function(){r.markerLabelsDisplay()}),map.addListener("zoom_changed",function(){r.markerLabelsDisplay()}),google.maps.event.addListener(e.googleMap,"dblclick",function(e){t.clearSelectedMusuemMarker(),t.clearFilter(),r.searchHere(e.latLng),a.obsHelpVisible(!1)}),google.maps.event.addDomListener(window,"resize",function(){var o=$(window).height()/2;$("#map").height(o);var a=map.getCenter();e.googleMap.setCenter(a)})},update:function(e,o,a,t,r){}}},u=function(){e.obsArrayMapMarkers.subscribe(function(e){r.filterMarkersOnMap()},null,"change"),e.compFilterMapList.subscribe(function(e){r.filterMarkersOnMap(),r.showAllMarkers()},null,"change"),a.obsSelectedMusuemMarker.subscribe(function(e){e&&e.prefPlaceMarker.setIcon(r.prefPlacePinOptions("gold"))},null,"beforeChange"),a.obsSelectedMusuemMarker.subscribe(function(e){if(e){var o=e.prefPlaceMarker.getPosition(),n=5,s=r.inLondon(o);if(e.prefPlaceMarker.setIcon(r.selectedPlacePinOptions("salmon")),e.VaM().hasOwnProperty("place")){var l=e.VaM().place()[0],u=l.meta.result_count;if(0===u)a.obsCurrentPlaceObjects(!1);else{var i=l.records.length;i===u?a.obsCurrentPlaceObjects(l.records):(s&&("centralLondon"===s.name?n=.5:"londonArea"===s.name&&(n=2)),t.requestMuseumPlaces(e,n,i))}}else s&&("centralLondon"===s.name?n=.5:"londonArea"===s.name&&(n=2)),t.requestMuseumPlaces(e,n)}else a.obsCurrentPlaceObjects(!1)},null,"change"),a.obsSelectedMusuemObjectPlace.subscribe(function(e){},null,"beforeChange"),a.obsSelectedMusuemObjectPlace.subscribe(function(e){},null,"change"),a.obsSelectedMusuemObject.subscribe(function(e){e!==!1&&r.updateMusemObjectInfoBoxContents(e)},null,"change"),e.obsFilterSearch.subscribe(function(e){r.updateMapMarkerDisplay()},null,"change")};return l(),u(),n(),{uiModel:a,mapsModel:e,mapHelpers:r,museumDataHelpers:t}};return{museumViewModel:a,init:i,initAppLibs:r,initmuseumPlaces:n,localStorageP:s,museumData:o,addMessage:b,debugMessageArea:e}}();$(document).ready(function(){var e=document.createElement("script");e.type="text/javascript",e.src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCRpuFnelWb6VGyKNtMyUbKopJC-1anU7g&callback=window.gmap_draw",window.gmap_draw=function(){museumApp.init()},$("head").append(e);var o=$(window).height()/1.7;$("#map").height(o),$("#map").css("visibility","visible")});
>>>>>>> c5dabd70587c54f4a801be250c92c934f2dd5486
