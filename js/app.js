var museumApp=function(){var e=!1,o={},a={ready:!1},t=function(){function e(e){return"object"==typeof window[e.name]}function o(e){return"function"==typeof window[e.name]}return{objectTest:e,functionTest:o}}(t),r=[{name:"InfoBox",dataType:"script",url:"js/library/InfoBox.js",isLoaded:"no",libraryTest:"functionTest",isReady:!1},{name:"ko",dataType:"script",url:"js/library/knockout.js",isLoaded:"no",libraryTest:"objectTest",isReady:!1},{name:"MarkerWithLabel",dataType:"script",url:"js/library/MarkerWithLabel.js",isLoaded:"no",libraryTest:"functionTest",isReady:!1}],n=[{name:"City of Bristol, UK",location:{lat:51.454513,lng:-2.5879099999999653}},{name:"Worcester, Worcester, UK",location:{lat:52.193636,lng:-2.22157500000003}},{name:"Broekwijk, Brussel, Belgium",location:{lat:50.851645,lng:4.357623200000035}},{name:"Leicester Square, London, UK",location:{lat:51.5102585,lng:-.1308881999999585}},{name:"Sèvres, Hauts-de-Seine Ile-de-France",location:{lat:48.824329,lng:2.21212}}],s=function(){var e=!!function(){var e,o=+new Date;try{return localStorage.setItem(o,o),e=localStorage.getItem(o)==o,localStorage.removeItem(o),e}catch(a){}}()&&localStorage;return e},l=function(){var e=n;museumApp.localStorageP()&&void 0!==museumApp.museumData.data?museumApp.museumViewModel.vm.mapHelpers.rebuildMarkersFromMusuemData():(console.log("first time app run or no local storage"),u(e))},u=function(e){if(e.length>0){for(var o=0;o<e.length;o++){var a=e[o];museumApp.museumViewModel.vm.mapHelpers.searchHere(a.location)}window.setTimeout(function(){museumApp.museumViewModel.vm.mapHelpers.showAllMarkers()},1e3)}},i=function(){s()&&localStorage.museumDataStored&&(console.log("GOT SOME LOCAL museumDataStored"),o.data=JSON.parse(localStorage.museumDataStored)),$.each(r,c),b("AJAX javascript REQUESTS : "+r.length);var e=function(){for(var e=0,o=0;o<r.length;o++){var a=r[o];n(a)&&(e+=1)}return e===r.length},n=function(e){if(e.isReady===!0)return!0;var o=t[e.libraryTest];return o(e)?(e.isReady=!0,!0):!1},u=function(){if(e()){clearInterval(m),console.log("😀 museum App Scripts READY"),b("😀 museum App Scripts READY"),ko.options.deferUpdates=!0;var o=new f;return a.vm=o,ko.applyBindings(a.vm),a.ready=!0,b(" 😀 viewmodel READY"),l(),$("#loadingArea").hide("slow"),$("body").removeClass("initial-hide"),!0}return!1},i=function(){clearInterval(m),e()||console.log("sorry the musuem app is not working")},m=window.setInterval(u,50);window.setTimeout(i,2e4)},c=function(e,o,a){var t=$.ajax({url:o.url,type:"GET",data:o.search_parameters,dataType:o.dataType,timeout:1e4});t.done(function(e,t,r){if(o.isLoaded="loaded","json"===o.dataType){var n={},s=o.modelCollection;if("place"===s){var l=e.records,u=l.filter(function(e){return e.fields.museumobject_count>0});l.length!==u.length&&(e.meta.result_count=u.length,e.records=u),n={googlePlace:a.bestPlace,resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:e},m(s,e,a),museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemMarker(a),museumApp.museumViewModel.vm.mapsModel.googleMap.panTo(a.bestPlace.geometry.location),museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(10)}else if("placeObjects"===s){museumApp.museumViewModel.vm.museumDataHelpers.setThumbImagePath(e),n={resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:e};var i=e.records;museumApp.museumViewModel.vm.uiModel.obsCurrentMuseumObjects(i)}else if("objectDetails"===s){var c=e[0],p=c.fields.image_set;filteredArray=p.filter(function(e){return e.fields.local.length>0}),e[0].fields.image_set=filteredArray,museumApp.museumViewModel.vm.uiModel.obsSelectedMusuemObject(c),n={resourceRefObj:o,museumCollectionType:o.modelCollection,museumData:c}}$.isEmptyObject(n)?console.log("did not recognise JSON musuemCollectionType "+s):d(n)}}),t.fail(function(e,a,t){if(console.dir(e),console.log("AJAX resource FAILED:"+o.name),console.dir(o),"json"===o.dataType){museumApp.museumViewModel.vm.mapsModel.googleMap.setZoom(2);var r="Sorry, cannot get V&A museum "+o.modelCollection+" data",n="",s='<div class="container" width="180" height="230">';s+='   <div class="ui segment">',s+='    <div class="ui header">',s+='     <div class="ui tiny image">',s+='      <img src="../img/VA_logo.png"></div>',s+='      <div class="segment">',s+="        <h3>"+o.name+"</h3>",s+="        <p>"+r+"</p>",s+="        <p>"+n+"</p>",s+="      </div>",s+="    </div>",s+="  </div>",s+="  </div>",museumApp.museumViewModel.vm.mapHelpers.openInfoBoxWithError(s)}else if("script"===o.dataType){o.isLoaded="failed";var l='<div id="helloDiv" class="container">';l+='     <div class="ui segment">',l+='      <p class="ui header">Sorry Musuem App cannot start</p>',l+='      <div class="ui tiny basic red label">',l+="       <h3>"+o.name+": Script failed to load</h3>",l+="      </div>",l+="     </div>",l+="   </div>",$("#loadingArea").hide("slow"),$(document.body).append(l)}b(o.name+" 😞 not loaded with error: "+t)}),t.always(function(e,a,t){b("😀 "+o.name+" :- AJAX "+o.dataType+" "+a)})},m=function(e,o,a){a.VaM().hasOwnProperty[e]?a.VaM()[e].push(o):(a.VaM()[e]=ko.observableArray([]),a.VaM()[e].subscribe(function(e){var o=a.VaM().place()[0],t=parseInt(o.meta.result_count),r=parseInt(o.records.length);0===t?label="sorry no musuem places":r===t?label=r+" museum place":1===r?label=r+" museum place":r>1&&(label=r+" of "+t+" museum place"),t>1&&(label+="s"),a.obsMuseumMarkerListLabel(label)}),a.VaM()[e].push(o))},p=function(e){var o=new Uint8Array((e||40)/2);return window.crypto.getRandomValues(o),[].map.call(o,function(e){return e.toString(16)}).join("")},d=function(e){var a=e.resourceRefObj,t=a.modelCollection,r="unknown_"+p(20);if("place"===t?r=a.placeID:"placeObjects"===t?r=a.search_parameters.place.toString():"objectDetails"===t&&(r=e.museumData.pk.toString()),o.data||(o.data={}),o.data.hasOwnProperty(t)||(o.data[t]={}),o.data[t].hasOwnProperty(r)&&a.search_parameters.hasOwnProperty("offset"))for(var n=o.data[t][r].museumData.records,s=e.museumData,l=0;l<n.length;l++)s.records.unshift(n[l]);o.data[t][r]=e,g()},g=function(){s()&&(localStorage.museumDataStored?localStorage.museumDataStored=JSON.stringify(o.data):(localStorage.museumDataStored={},localStorage.museumDataStored=JSON.stringify(o.data)))},b=function(e){var o='<p class="message">'+e+"</p>";$("#log-area").append(o)},f=function(){var e={placeTypeInPrefOrder:["neighborhood","political","locality","administrative_area_level_4","administrative_area_level_3","administrative_area_level_2"],obsArrayMapMarkers:ko.observableArray([]),obsFilteredBoundsMarkers:ko.observableArray([]),obsUserLocalPlace:ko.observable(!1),obsFilterSearch:ko.observable(""),obsSelectedPlace:ko.observable(!1)};e.compFilterMapList=ko.computed(function(){var o=e.obsFilterSearch().toLowerCase();return""===o?e.obsArrayMapMarkers():ko.utils.arrayFilter(e.obsArrayMapMarkers(),function(e){var a=e.bestPlace.formatted_address.toLowerCase(),t=a.indexOf(o);return t>=0})}),e.compSortedMapMarkers=ko.computed(function(){var o=e.compFilterMapList();if(o.length>1){var a=o.sort(function(e,o){var a="";a="street_number"===e.bestPlace.address_components[0].types[0]?e.bestPlace.address_components[1].long_name.split(" ")[0].toLowerCase():e.bestPlace.address_components[0].long_name.split(" ")[0].toLowerCase();var t="";return t="street_number"===e.bestPlace.address_components[0].types[0]?o.bestPlace.address_components[1].long_name.split(" ")[0].toLowerCase():o.bestPlace.address_components[0].long_name.split(" ")[0].toLowerCase(),a===t?0:t>a?-1:1});return a}return o});var a={musemObjectWindow:new InfoBox({boxClass:"musuemobject-infoBox",content:"",disableAutoPan:!1,pixelOffset:new google.maps.Size(-150,0),zIndex:null,closeBoxURL:"",closeBoxMargin:""}),obsHelpVisible:ko.observable(!0),obsMusemObjectWindowVisible:ko.observable(!1),obsSelectedMusuemMarker:ko.observable(!1),obsSelectedMusuemObjectPlace:ko.observable(!1),obsSelectedMusuemObject:ko.observable(!1),obsCurrentPlaceObjects:ko.observableArray([]),obsCurrentMuseumObjects:ko.observableArray([])};a.compShowMusuemMarkersList=ko.computed(function(){return!a.obsSelectedMusuemMarker()}),a.compShowMusuemPlaceList=ko.computed(function(){return a.compShowMusuemMarkersList()?!1:a.obsCurrentPlaceObjects()===!1?(t.clearSelectedMusuemMarker(),!1):!a.obsSelectedMusuemObjectPlace()}),a.compShowMusuemObjectsList=ko.computed(function(){return a.obsSelectedMusuemObjectPlace()?!a.obsSelectedMusuemObject():!1}),a.compMuseumMarkerCrumb=ko.computed(function(){return a.obsSelectedMusuemMarker()?a.obsSelectedMusuemMarker().prefPlaceMarker.labelContent:""}),a.compObjectPlaceCrumb=ko.computed(function(){if(a.obsSelectedMusuemObjectPlace()){if(0===a.obsCurrentMuseumObjects().length)return"";var e="",o=a.obsSelectedMusuemObjectPlace().fields,t=a.obsCurrentMuseumObjects().length,r=o.name;return e=r+" -   "+t+" object",t>1&&(e+="s"),e}return""}),a.compMusuemObjectCrumb=ko.computed(function(){if(a.obsSelectedMusuemObject()){var e=a.obsSelectedMusuemObject().fields,o=e.title;return""===o&&(o=e.object),o+=", "+e.date_text}return""}),a.compNumOfPlacesForZoomOnMap=ko.computed(function(){var o=e.compFilterMapList().length,a="Zoom "+o+" place";return 0===o?a="no places":o>1&&(a+="s"),a}),a.compFilterButtonLabel=ko.computed(function(){var o=e.compFilterMapList().length,a=e.obsArrayMapMarkers().length;return o===a?"Filter places":"Clear Filter"}),a.compFilterLabelText=ko.computed(function(){var o=e.compFilterMapList().length,a=e.obsArrayMapMarkers().length;return o===a?"all places":0===o?"no places":o+" of "+a+" places"});var t=function(){var t=function(e){for(var o=e.records,a=0;a<o.length;a++){var t=o[a];if(t.fields.primary_image_id.length>0){var r="http://media.vam.ac.uk/media/thira/collection_images/",n=t.fields.primary_image_id,s=n.substring(0,6),l=r+s+"/"+n+"_jpg_s.jpg";t.imgURL=l}else t.imgURL="img/VandA_logo70x70.png"}},n=function(){u(),l(),a.obsCurrentPlaceObjects(!1),a.obsSelectedMusuemMarker(!1)},l=function(){a.obsSelectedMusuemObjectPlace(!1),a.obsCurrentMuseumObjects(!1),u()},u=function(){r.closeMuseumObjectWindow(),a.obsMusemObjectWindowVisible(!1),a.obsSelectedMusuemObject(!1)},i=function(e){var a=e.bestPlace.place_id,t=museumApp.museumData.data.place;delete t[a],s()&&(localStorage.museumDataStored?localStorage.museumDataStored=JSON.stringify(o.data):(localStorage.museumDataStored={},localStorage.museumDataStored=JSON.stringify(o.data)))},m=function(){e.obsFilterSearch("")},p=function(e,o,t){var r=e.bestPlace,n="V&A collection place name search for museumobjects: "+r.address_components[0].short_name,s=r.geometry.location,l={placeLoc:s,placeID:r.place_id,placeName:r.address_components[0].short_name,name:n,modelCollection:"place",dataType:"json",search_parameters:{latitude:r.geometry.location.lat,longitude:r.geometry.location.lng,orderby:"distance",radius:o,limit:45},url:"http://www.vam.ac.uk/api/json/place/search",isLoaded:"no"};t&&(l.search_parameters.offset=t);var u=M(l.modelCollection,l.placeID);if(u!==!1){({googlePlace:r,resourceRefObj:l,museumCollectionType:l.modelCollection,museumData:u});a.obsCurrentPlaceObjects(u)}else{var i=0;c(i,l,e)}},d=ko.computed(function(){if(a.obsSelectedMusuemObjectPlace()){var e=a.obsSelectedMusuemObjectPlace(),o=parseInt(e.fields.museumobject_count),t=a.obsCurrentMuseumObjects().length;return void 0!==t?o>t:!1}return!1}),g=function(){if(a.obsSelectedMusuemObjectPlace()){var e=a.obsSelectedMusuemObjectPlace().pk;b(e,a.obsSelectedMusuemMarker())}},b=function(e,o){var t=0,r="V&A - museum placeObjects for collection.place - pk: "+e,n={name:r,modelCollection:"placeObjects",dataType:"json",search_parameters:{place:e,limit:45},url:"http://www.vam.ac.uk/api/json/museumobject/",isLoaded:"no"},s=M(n.modelCollection,e);if(s){var l=s.museumData.meta.result_count,u=s.museumData.records;if(u.length<l){var i=u.length;n.search_parameters.offset=i,c(t,n,o)}else a.obsCurrentMuseumObjects(s.museumData.records)}else c(t,n,o)},f=function(e){var o=0,a="V&A - museum object details:  "+e,t={name:a,modelCollection:"objectDetails",dataType:"json",search_parameters:{object_number:e},url:"http://www.vam.ac.uk/api/json/museumobject/"+e,isLoaded:"no"};c(o,t)},M=function(e,o){if(!museumApp.museumData.hasOwnProperty("data"))return!1;if(museumApp.museumData.data.hasOwnProperty(e)){var a=museumApp.museumData.data[e];return a.hasOwnProperty(o)?a[o]:!1}},v=function(e){if(e.VaM&&e.VaM().hasOwnProperty("place")){var o=e.VaM().place()[0];return o.records}return[]};return{getMusuemMarkerPlaces:v,requestMuseumPlaces:p,requestPlaceMusuemObjects:b,loadMorePlaceObjects:g,loadMorePlacesVisible:d,getmuseumObjectDetails:f,musuemDataIfExists:M,clearFilter:m,removePlacefromMusuemData:i,clearSelectedObjectPlace:l,clearSelectedMusuemObject:u,clearSelectedMusuemMarker:n,setThumbImagePath:t}}(t),r=function(){var o=function(){var e=[],o=[{lat:51.51942532808189,lng:-.391387939453125},{lat:51.61545844207286,lng:-.2190399169921875},{lat:51.64103302109062,lng:-.10162353515625},{lat:51.5954149508168,lng:.031585693359375},{lat:51.549751017014195,lng:.11260986328125},{lat:51.49121712928709,lng:.1318359375},{lat:51.42104840561726,lng:.0494384765625},{lat:51.40306101512005,lng:-.078277587890625},{lat:51.40777268236964,lng:-.22247314453125},{lat:51.47240196119371,lng:-.3714752197265625}],a=[{lat:51.520493477218274,lng:-.16736984252929688},{lat:51.535872047109315,lng:-.10969161987304688},{lat:51.53864817973768,lng:-.034503936767578125},{lat:51.50307952226442,lng:-.016651153564453125},{lat:51.4973090140083,lng:-.09304046630859375},{lat:51.47122575543907,lng:-.11707305908203125},{lat:51.4608524464555,lng:-.17526626586914062},{lat:51.47218810785753,lng:-.20788192749023438},{lat:51.4973090140083,lng:-.22212982177734375},{lat:51.51739577570338,lng:-.20341873168945312}],t=new google.maps.Polygon({paths:o,strokeColor:"#FF0000",strokeOpacity:.1,strokeWeight:2,fillColor:"#FF0000",fillOpacity:.1}),r=new google.maps.Polygon({paths:a,strokeColor:"blue",strokeOpacity:.1,strokeWeight:2,fillColor:"blue",fillOpacity:.1});return e.push({name:"londonArea",polygon:t}),e.push({name:"centralLondon",polygon:r}),e},n=function(e){h(e),a.obsSelectedMusuemMarker(e)},s=function(e){a.obsSelectedMusuemObjectPlace(e),t.requestPlaceMusuemObjects(e.pk,a.obsSelectedMusuemMarker())},l=function(e){museumObjectNumber=e.fields.object_number,t.getmuseumObjectDetails(museumObjectNumber),k(e)},u=function(o,a){o.prefPlaceMarker.setMap(null),e.obsArrayMapMarkers.remove(o),t.removePlacefromMusuemData(o),a.stopImmediatePropagation()},i=function(){t.clearSelectedMusuemMarker();var o=e.compFilterMapList().length;if(o>0){for(var a=new google.maps.LatLngBounds,r=e.compFilterMapList(),n=0;n<r.length;n++){var s=r[n].prefPlaceMarker;a.extend(s.getPosition())}c(a)}else console.log("no markers on map for bounds")},c=function(o){setTimeout(function(){e.googleMap.fitBounds(o)},10)},p=function(){var e=museumApp.museumData.data.place,o=0;if(e){for(var a in e){var t=e[a];d(t),o+=1}console.log("rebuild "+o+" markers from museumData"),i()}},d=function(e){var o=S(e.googlePlace),a=e.resourceRefObj.modelCollection,t=e.museumData;m(a,t,o)},g=function(e){return{path:"M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",fillColor:e,fillOpacity:.75,strokeColor:"salmon",strokeWeight:3,scale:.9}},b=function(e){return{path:"M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0",fillColor:e,fillOpacity:.75,strokeColor:"yellow",strokeWeight:4,scale:1}},f=function(){return{path:google.maps.SymbolPath.CIRCLE,fillColor:"salmon",fillOpacity:1,strokeColor:"yellow",strokeWeight:1,scale:4}},M=function(e){var o=e.prefPlaceMarker;o.setAnimation(google.maps.Animation.BOUNCE),setTimeout(function(){o.setAnimation(null)},1400)},v=function(){var o=e.obsUserLocalPlace();if(o){var a={lat:o.geoPosition.coords.latitude,lng:o.geoPosition.coords.longitude};t.clearFilter(),L(a)}},h=function(o){if(o.bestPlace.geometry.hasOwnProperty("bounds"))e.googleMap.fitBounds(o.bestPlace.geometry.bounds),e.googleMap.getZoom()>14&&e.googleMap.setZoom(14);else{map.panTo(o.bestPlace.geometry.location);var a=e.googleMap.getZoom();11>a?e.googleMap.setZoom(12):e.googleMap.setZoom(a)}M(o)},k=function(){a.musemObjectWindow.open(e.googleMap,a.obsSelectedMusuemMarker().prefPlaceMarker),a.obsMusemObjectWindowVisible(!0)},y=function(o){a.musemObjectWindow.open(e.googleMap),a.musemObjectWindow.setContent(o)},P=function(e){var o="";if(e){var t=e.fields,r="";""!==t.label?r=t.label:""!==t.descriptive_line?r=t.descriptive_line:(""!==t.artist&&(r=t.artist),r+=" - "+t.object+", "+t.date_text),o+='<div class="ui card">',o+='<div class="ui segment">'+r+"</div>",o+=" </div>"}return a.musemObjectWindow.setContent(o),o},O=function(){a.musemObjectWindow.setContent(""),a.musemObjectWindow.close()},j=function(e){map.setCenter(e)},w=function(){return e.googleMap.getCenter()},S=function(o){var n="",s=o.address_components[0].types[0];"street_number"===s?n=void 0!==o.address_components[1]?o.address_components[1].long_name:o.address_components[0].long_name:void 0!==o.address_components[1]&&(n=o.address_components[0].long_name);var l=4*n.length,u=new MarkerWithLabel({position:o.geometry.location,map:e.googleMap,icon:r.prefPlacePinOptions("gold"),id:o.place_id,draggable:!1,labelContent:n,labelAnchor:new google.maps.Point(l,0),labelClass:"place-labels",labelInBackground:!1,labelVisible:!0,visible:!0,animation:google.maps.Animation.DROP,zIndex:0}),i={VaM:ko.observable({}),prefPlaceMarker:u,bestPlace:o,obsMuseumMarkerListLabel:ko.observable(!1)};return u.addListener("click",function(e){h(i),a.obsSelectedMusuemMarker()&&t.clearSelectedObjectPlace(),a.obsSelectedMusuemMarker(i)}),google.maps.event.addListener(u,"mouseover",function(){for(var o=e.obsFilteredBoundsMarkers(),a=0;a<o.length;a++)o[a].prefPlaceMarker.setZIndex(0);u.setZIndex(1)}),e.obsArrayMapMarkers.push(i),i},L=function(o){o instanceof google.maps.LatLng||(o=new google.maps.LatLng(o.lat,o.lng));var a=e.googleMap;e.geocoder.geocode({location:o,bounds:a.bounds},function(a,r){if(r!==google.maps.GeocoderStatus.OK)return console.log("Gocoder Error: "+r),!1;if(!a)return console.log("no geocode results found"),!1;var n=function(o,a){for(var t=o.types,r=0;r<t.length;r++){var n=t[r],s=e.placeTypeInPrefOrder.indexOf(n);if(-1!==s)return!0}return!1},s=$.grep(a,n),l=5,u=!1;if(s.length>0){var i=C(o);i?("centralLondon"===i.name?l=.5:"londonArea"===i.name&&(l=2),u=a[0]):u=s[0]}else console.log("no peferedPlaceP address"),u=a[0];var c=A(u);if(c!==!1)h(c);else{var m=S(u);""!==e.obsFilterSearch&&t.clearFilter(),t.requestMuseumPlaces(m,l)}})},C=function(o){var a=e.londonPolygonAreas[1],t=e.londonPolygonAreas[0];return a.polygon.containsLatLng(o)?a:t.polygon.containsLatLng(o)?t:!1},A=function(o){for(var a=e.obsArrayMapMarkers(),t=0;t<a.length;t++)if(a[t].bestPlace.place_id===o.place_id)return a[t];return!1};google.maps.Polygon.prototype.getBounds||(google.maps.Polygon.prototype.getBounds=function(e){var o,a,t,r=new google.maps.LatLngBounds,n=this.getPaths();for(a=0;a<n.getLength();a++)for(o=n.getAt(a),t=0;t<o.getLength();t++)r.extend(o.getAt(t));return r}),google.maps.Polygon.prototype.containsLatLng=function(e){var o,a,t,r,n,s,l,u,i,c,m,p=!1;if(2===arguments.length)"number"==typeof arguments[0]&&"number"==typeof arguments[1]&&(a=arguments[0],t=arguments[1]);else if(1===arguments.length){if(o=this.getBounds(),!o&&!o.contains(e))return!1;a=e.lat(),t=e.lng()}else console.log("Wrong number of inputs in google.maps.Polygon.prototype.contains.LatLng");for(r=this.getPaths().getLength(),n=0;r>n;n++)for(s=this.getPaths().getAt(n),l=s.getLength(),i=l-1,u=0;l>u;u++)c=s.getAt(u),m=s.getAt(i),(c.lng()<t&&m.lng()>=t||m.lng()<t&&c.lng()>=t)&&c.lat()+(t-c.lng())/(m.lng()-c.lng())*(m.lat()-c.lat())<a&&(p=!p),i=u;return p};var _=function(){for(var o=e.googleMap.zoom>7,a=e.compFilterMapList(),t=0;t<a.length;t++)a[t].prefPlaceMarker.labelVisible=o},D=function(){var o=ko.utils.arrayFilter(e.compFilterMapList(),function(o){var a=e.googleMap.getBounds();return a.contains(o.prefPlaceMarker.getPosition())});return o},T=function(){var o=ko.utils.compareArrays(e.obsArrayMapMarkers(),e.compFilterMapList());ko.utils.arrayForEach(o,function(o){"deleted"===o.status?o.value.prefPlaceMarker.setMap(null):"retained"===o.status&&o.value.prefPlaceMarker.setMap(e.googleMap)})},I=function(){T(),_()};return{makeLondonPolygons:o,markerListClick:n,removeMarker:u,showAllMarkers:i,searchHere:L,centerMap:j,getMapCenter:w,inLondon:C,prefPlacePinOptions:g,selectedPlacePinOptions:b,musuemObjectPlacePinOptions:f,rebuildMarkersFromMusuemData:p,rebuildMarker:d,searchUsersLocation:v,panMapToMuseumMarker:h,mapMarkerExistsRef:A,openMuseumObjectWindow:k,openInfoBoxWithError:y,closeMuseumObjectWindow:O,markerLabelsDisplay:_,displayMarkersInBounds:D,filterMarkersOnMap:T,updateMapMarkerDisplay:I,objectPlaceListClick:s,objectListClick:l,updateMusemObjectInfoBoxContents:P}}(r),n=function(){if("geolocation"in navigator){var o={maximumAge:6e5,timeout:15e3},a=function(o){e.obsUserLocalPlace({geoPosition:o})},t=function(e){museumApp.addMessage("local location not found 😞 with error: "+r[e])},r={0:"inknown Error",1:"permission denied",2:"postion unavailable",3:"timed out"};navigator.geolocation.getCurrentPosition(a,t,o)}},l=function(){ko.bindingHandlers.fadeInText={update:function(e,o){$(e).hide(),ko.bindingHandlers.text.update(e,o),$(e).fadeIn()}},ko.bindingHandlers.mapPanel={init:function(o,n,s,l,u){map=new google.maps.Map(o,{backgroundColor:"none",disableDoubleClickZoom:!0,mapTypeControl:!1,zoomControl:!0,zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_CENTER},scaleControl:!0,mapTypeId:google.maps.MapTypeId.TERRAIN,center:new google.maps.LatLng(51.478771,-.011074),zoom:11}),e.googleMap=map,e.geocoder=new google.maps.Geocoder(map),e.londonPolygonAreas=r.makeLondonPolygons(),map.addListener("bounds_changed",function(){r.markerLabelsDisplay()}),map.addListener("zoom_changed",function(){r.markerLabelsDisplay()}),google.maps.event.addListener(e.googleMap,"dblclick",function(e){t.clearSelectedMusuemMarker(),t.clearFilter(),r.searchHere(e.latLng),a.obsHelpVisible(!1)}),google.maps.event.addDomListener(window,"resize",function(){var o=$(window).height()/2;$("#map").height(o);var a=map.getCenter();e.googleMap.setCenter(a)})},update:function(e,o,a,t,r){}}},u=function(){e.obsArrayMapMarkers.subscribe(function(e){r.filterMarkersOnMap()},null,"change"),e.compFilterMapList.subscribe(function(e){r.filterMarkersOnMap(),r.showAllMarkers()},null,"change"),a.obsSelectedMusuemMarker.subscribe(function(e){e&&e.prefPlaceMarker.setIcon(r.prefPlacePinOptions("gold"))},null,"beforeChange"),a.obsSelectedMusuemMarker.subscribe(function(e){if(e){var o=e.prefPlaceMarker.getPosition(),n=5,s=r.inLondon(o);if(e.prefPlaceMarker.setIcon(r.selectedPlacePinOptions("salmon")),e.VaM().hasOwnProperty("place")){var l=e.VaM().place()[0],u=l.meta.result_count;if(0===u)a.obsCurrentPlaceObjects(!1);else{var i=l.records.length;i===u?a.obsCurrentPlaceObjects(l.records):(s&&("centralLondon"===s.name?n=.5:"londonArea"===s.name&&(n=2)),t.requestMuseumPlaces(e,n,i))}}else s&&("centralLondon"===s.name?n=.5:"londonArea"===s.name&&(n=2)),t.requestMuseumPlaces(e,n)}else a.obsCurrentPlaceObjects(!1)},null,"change"),a.obsSelectedMusuemObjectPlace.subscribe(function(e){},null,"beforeChange"),a.obsSelectedMusuemObjectPlace.subscribe(function(e){},null,"change"),a.obsSelectedMusuemObject.subscribe(function(e){e!==!1&&r.updateMusemObjectInfoBoxContents(e)},null,"change"),e.obsFilterSearch.subscribe(function(e){r.updateMapMarkerDisplay()},null,"change")};return l(),u(),n(),{uiModel:a,mapsModel:e,mapHelpers:r,museumDataHelpers:t}};return{museumViewModel:a,init:i,initAppLibs:r,initmuseumPlaces:n,localStorageP:s,museumData:o,addMessage:b,debugMessageArea:e}}();$(document).ready(function(){var e=document.createElement("script");e.type="text/javascript",e.src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCRpuFnelWb6VGyKNtMyUbKopJC-1anU7g&callback=window.gmap_draw",window.gmap_draw=function(){museumApp.init()},$("head").append(e);var o=$(window).height()/1.7;$("#map").height(o),$("#map").css("visibility","visible")});