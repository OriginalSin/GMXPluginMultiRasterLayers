(function () {
    _translationsHash.addtext('rus', {MultiRasterLayers: {
        button: 'Мультирастр'
    }});
    _translationsHash.addtext('eng', {MultiRasterLayers: {
        button : 'MultiRasterLayers'
    }});

    var multiRasterLayer;

    var addMultiRasterLayer = function (layersIds) {
        var lmap = nsGmx.leafletMap,
            gmxLayers = lmap.gmxControlsManager.get('layers');

        var data = layersIds.reduce(function (p, it, i) {
            var layerId = it.trim(),
                layer = nsGmx.gmxMap.layersByID[layerId],
                opt = layer;
            if (layer) {
                var options = layer.options;
                p.push([
                    i + 1,
                    options.zIndexOffset + options.zIndex,
                    layerId,
                    layer._gmx.geometry
                ]);
                return p;
            } else {
                console.warning('MultiRasterLayers plugin: Layer ', layerId, 'not found!');
            }
        }, []);

        var info = {
            properties: {
                type: 'Vector',
                GeometryType: 'polygon',
                ZIndexField: '_zIndex',
                attributes: ['_zIndex', 'GMX_RasterCatalogID'],
                attrTypes: ['integer', 'string'],
                IsRasterCatalog: true,
                RCMinZoomForRasters: 5
            }
        };
        multiRasterLayer = L.gmx.createLayer(info)
            .setStyles([
                {
                    MinZoom: 1, MaxZoom: 4, 
                    RenderStyle: {
                        color: 0xFF0000,
                        weight: 1
                    }
                },
                {
                    MinZoom: 5, MaxZoom: 21, 
                    // DisableBalloonOnMouseMove: true,
                    RenderStyle: {
                        weight: 0
                    },
                    HoverStyle: {
                        color: 0xFF0000,
                        weight: 0
                    }
                }
            ])
            .addData(data);
        gmxLayers.addOverlay(multiRasterLayer, _gtxt('MultiRasterLayers.button'));
    }

    var publicInterface = {
        pluginName: 'MultiRasterLayers',
        afterViewer: function (params) {
            var layersIds = params.layers ? params.layers.split(',') : null;
            if (!layersIds) {   // all raster layers
                layersIds = nsGmx.gmxMap.layers.reduce(function (p, layer) {
                    var rawProp = layer.getGmxProperties();
                    if (rawProp.type === 'Raster') {
                        p.push(rawProp.name);
                    }
                    return p;
                }, []);
            }
            addMultiRasterLayer(layersIds);
        },
        unload: function() {
            var lmap = nsGmx.leafletMap,
                gmxLayers = lmap.gmxControlsManager.get('layers');
            gmxLayers.removeLayer(multiRasterLayer);
            lmap.removeLayer(multiRasterLayer);
        }
    }

    window.gmxCore && window.gmxCore.addModule('MultiRasterLayers', publicInterface);
})();
