(function () {
    _translationsHash.addtext('rus', {MultiRasterLayers: {
        button: 'Мультирастр'
    }});
    _translationsHash.addtext('eng', {MultiRasterLayers: {
        button : 'MultiRasterLayers'
    }});

    var multiRasterLayer,
        visibleLayers = {},
        isExternalVisible = function () {
            return true;
        },
        getItemFromLayer = function (layer) {
            var options = layer.options,
                rawProp = layer.getGmxProperties(),
                layerId = rawProp.name,
                gmx_id = Object.keys(visibleLayers).length + 1;

            return [
                gmx_id,
                gmx_id,
                options.zIndexOffset + options.zIndex,
                rawProp.styles[0].MinZoom || 1,
                rawProp.styles[0].MaxZoom || 21,
                layerId,
                layer._gmx.geometry
            ];
        },
        setVisible = function (layer, flag) {
            visibleLayers[layer.getGmxProperties().name] = layer.isExternalVisible = flag ? isExternalVisible : null;
            layer.redraw();
        };

    var addMultiRasterLayer = function (layersIds) {
        var lmap = nsGmx.leafletMap,
            gmxLayers = lmap.gmxControlsManager.get('layers');

        var data = layersIds.reduce(function (p, layer) {
            p.push(getItemFromLayer(layer));
            setVisible(layer, layer._map);
            return p;
        }, []);
        nsGmx.leafletMap
            .on('layeradd', function (ev) {
                var layer = ev.layer;
                if (layer instanceof L.gmx.RasterLayer) {
                    if (!(layer.getGmxProperties().name in visibleLayers)) {
                        multiRasterLayer.addData([getItemFromLayer(layer)]);
                    }
                    setVisible(layer, true);
                    multiRasterLayer.repaint();
                }
            })
            .on('layerremove', function (ev) {
                var layer = ev.layer;
                if (layer instanceof L.gmx.RasterLayer) {
                    setVisible(layer, false);
                    multiRasterLayer.repaint();
                }
            });

        var info = {
            properties: {
                type: 'Vector',
                GeometryType: 'polygon',
                identityField: 'gmx_id',
                ZIndexField: '_zIndex',
                attributes: ['gmx_id', '_zIndex', 'MinZoom', 'MaxZoom', 'GMX_RasterCatalogID'],
                attrTypes: ['integer', 'integer', 'integer', 'integer', 'string'],
                IsRasterCatalog: true,
                RCMinZoomForRasters: 1
            }
        };
        multiRasterLayer = L.gmx.createLayer(info)
            .setFilter(function (it) {
                var zoom = nsGmx.leafletMap.getZoom(),
                    props = it.properties;
                return visibleLayers[props[5]] && zoom >= props[3] && zoom <= props[4];
            })
            .setStyles([
                {
                    MinZoom: 1, MaxZoom: 21,
                    DisableBalloonOnClick: true,
                    DisableBalloonOnMouseMove: true,
                    RenderStyle: {
                        color: 0xFF0000,
                        weight: 0
                    },
                    HoverStyle: {
                        color: 0xFF0000,
                        weight: 0
                    }
                }
            ])
            .addData(data);
        nsGmx.leafletMap.addLayer(multiRasterLayer);
        // gmxLayers.addOverlay(multiRasterLayer, _gtxt('MultiRasterLayers.button'));
    }

    var publicInterface = {
        pluginName: 'MultiRasterLayers',
        afterViewer: function (params) {
            var layers = nsGmx.gmxMap.layers.reduce(function (p, layer) {
                var rawProp = layer.getGmxProperties();
                if (rawProp.type === 'Raster') {
                    p.push(layer);
                }
                return p;
            }, []);
            addMultiRasterLayer(layers);
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
