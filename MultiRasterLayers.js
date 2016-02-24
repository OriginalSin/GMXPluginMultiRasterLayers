(function () {
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
            if (flag) { layer.onRemove(nsGmx.leafletMap); }
        };

    var addMultiRasterLayer = function (layersIds, params) {
        var map = nsGmx.leafletMap;
        multiRasterLayer = L.gmx.createLayer({
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
            })
            .setFilter(function (it) {
                var zoom = map.getZoom(),
                    pArr = it.properties;
                return visibleLayers[pArr[5]] && zoom >= pArr[3] && zoom <= pArr[4];
            })
            .setStyles([
                {
                    MinZoom: 1, MaxZoom: 21,
                    DisableBalloonOnClick: true,
                    DisableBalloonOnMouseMove: true,
                    RenderStyle: {
                        weight: 0
                    },
                    HoverStyle: {
                        weight: 0
                    }
                }
            ])
            .addData(
                layersIds.reduce(function (p, layer) {
                    p.push(getItemFromLayer(layer));
                    setVisible(layer, layer._map);
                    return p;
                }, [])
            );
        if (!params.clickable || (params.clickable !== 'true' && params.clickable !== true)) { multiRasterLayer.options.clickable = false; }

        map
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
            })
            .addLayer(multiRasterLayer);
    }

    var publicInterface = {
        pluginName: 'MultiRasterLayers',
        afterViewer: function (params) {
            addMultiRasterLayer(
                nsGmx.gmxMap.layers.reduce(function (p, layer) {
                    if (layer.getGmxProperties().type === 'Raster') { p.push(layer); }
                    return p;
                }, [])
            , params);
        },
        unload: function() {
            var map = nsGmx.leafletMap;
            map.removeLayer(multiRasterLayer);
            for (var id in visibleLayers) {
                var layer = nsGmx.gmxMap.layersByID[id];
                if (map.hasLayer(layer)) { layer.onAdd(map); }
            }
        }
    }

    window.gmxCore && window.gmxCore.addModule('MultiRasterLayers', publicInterface);
})();
