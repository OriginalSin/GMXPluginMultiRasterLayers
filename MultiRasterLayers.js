(function () {
    var multiRasterLayer,
        visibleLayers = {},
        curId = 0,
        setVisible = function (layer, flag) {
            var rawProp = layer.getGmxProperties(),
                layerId = rawProp.name;

            if (flag) {
				curId++;
				var options = layer.options,
					zIndex = (options.zIndexOffset ? options.zIndexOffset : 0) + (options.zIndex ? options.zIndex : 0),
					gmxId = curId,
					pArr = [
						gmxId,
						gmxId,
						zIndex,
						rawProp.styles[0].MinZoom || 1,
						rawProp.styles[0].MaxZoom || 21,
						layerId,
						layer._gmx.geometry
					];
				multiRasterLayer.addData([pArr]);
				visibleLayers[layerId] = gmxId;
				layer.onRemove(nsGmx.leafletMap);
			} else {
				multiRasterLayer.removeData([visibleLayers[layerId]]);
				visibleLayers[layerId] = null;
			}
			multiRasterLayer.repaint();
        };

    var addMultiRasterLayer = function (layersIds, params) {
        var map = nsGmx.leafletMap;
        if (!layersIds) { layersIds = []; }
        if (!params) { params = {}; }
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
            ]);

		layersIds.forEach(function (layer) {
			setVisible(layer, layer._map);
		});

        if (!params.clickable || (params.clickable !== 'true' && params.clickable !== true)) { multiRasterLayer.options.clickable = false; }

        map
            .on('layeradd', function (ev) {
                var layer = ev.layer;
                if (layer instanceof L.gmx.RasterLayer) {
                    setVisible(layer, true);
                }
            })
            .on('layerremove', function (ev) {
                var layer = ev.layer;
                if (layer instanceof L.gmx.RasterLayer) {
                    setVisible(layer, false);
                }
            })
            .addLayer(multiRasterLayer);
    };

    var publicInterface = {
        pluginName: 'MultiRasterLayers',
        afterViewer: function (params) {
            addMultiRasterLayer(
                nsGmx.gmxMap.layers.reduce(function (p, layer) {
                    var props = layer.getGmxProperties();
                    if (props.type === 'Raster' && props.visible) { p.push(layer); }
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
    };

    window.gmxCore && window.gmxCore.addModule('MultiRasterLayers', publicInterface);
})();
