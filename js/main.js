(function () {

    var map, googleLayer, realtimeLayer, ws;
    var apiHost = "http://www.tagkartan.se/json/tag2.php?bounds=59.310,21.553,56.016,7.447&_=1504810095022";

    let GeoJSONData = {
        "type": "FeatureCollection",
        "features": []

    };

    function initGoogleMapWithRealtimeLayer() {
        map = new L.Map('map', {center: new L.LatLng(57.7, 14.5), zoom: 9});
        googleLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        });
        map.addLayer(googleLayer);
        fetchTrainData();
        initRealtimeLayer();
    }

    function fetchTrainData() {
        ws = new WebSocket("ws://localhost:8080/");

        ws.onopen = function () {
            console.log("Connection opened...")
        };

        ws.onclose = function () {
            console.log("Connection closed...")
        };


    }

    function transformTrainJSONToGeoJSONAndRender(initialData) {

        let jsonData = JSON.parse(initialData);
        jsonData.forEach(function (d) {
            let allTrainsInResponse = parseTrainNumberAndType([d.trains[0]]);

            allTrainsInResponse.forEach(function (train) {
                let dCopy = _.clone(d, true);
                dCopy.train = train;
                let feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [d["longitude"], d["latitude"]]
                    },
                    "id": train.id,
                    "properties": dCopy
                };

                let layer = getLayer(realtimeLayer,feature.properties.train.id);
                if (layer)
                    realtimeLayer.removeLayer(layer);

                realtimeLayer.addData(feature);
            });
        });

    }

    function getLayer(layerGroup, id) {
        for (var i in layerGroup._layers) {
            if (layerGroup._layers[i].feature.id == id) {
                return layerGroup._layers[i];
            }
        }
    }

    function parseTrainNumberAndType(trainData) {

        let trains = [];
        trainData.forEach(function (train) {
            if (!_.isEmpty(train)) {
                let trainDataArray = train.split('.');
                let number = _.parseInt(trainDataArray[0]);
                let trainType = trainDataArray[1];


                trains.push({
                    id: number,
                    type: trainType
                });
            }
        });

        return trains;
    }

    function initRealtimeLayer() {

        var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };


        ws.onmessage = function (evt) {
            transformTrainJSONToGeoJSONAndRender(evt.data);
        };


        realtimeLayer = L.geoJSON(GeoJSONData, {
            getFeatureId: function (f) {
                console.log(f);
                return f.properties.train.id;
            },
            pointToLayer: function (feature, latlng) {

                return new L.CircleMarker(latlng, geojsonMarkerOptions).bindTooltip(feature.properties.train.id + ' ' + feature.properties.train.type, {permanent: true, opacity: 0.7}).openTooltip();

                //return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: function (feature, layer) {
                //layer.bindPopup();
            }
        }).addTo(map);

        /* realtimeLayer.on('update', function () {
         //  map.fitBounds(realtimeLayer.getBounds(), {maxZoom: 3});
         });*/
    }

    initGoogleMapWithRealtimeLayer();

})();