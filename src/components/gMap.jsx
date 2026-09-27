'use client'

import React, { Component, useEffect, useRef, useState, useCallback } from 'react'
import { Alert, message, Space } from 'antd'
import { __error, __yellow } from '@/lib/consoleHelper';
// import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Loader } from './loader';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api'
import _ from 'lodash'
import { Button } from './button';

// import GEO_ZONES from '_/graphql/geo_zone/geoZones.graphql';

// DrawingManager was removed from the Maps JavaScript API in version 3.65.
const libraries = ['maps'];
const defaultMapContainerStyle = { width: '100%', height: '100%', borderRadius: '15px 0px 0px 15px' };
const defaultMapCenter = { lat: 31.52443022759592, lng: 74.35772741448616 }; // Lahore
const defaultMapZoom = 18;
// const defaultMapOptions = { zoomControl: true, tilt: 0, gestureHandling: 'auto', mapTypeId: 'roadmap' };
/*
mapTypeId: roadmap, satellite, hybrid, terrain
*/

const editable_polygonOptions = {
    fillColor: 'green', fillOpacity: 0.3,
    strokeColor: 'green', strokeOpacity: 0.8, strokeWeight: 2,
    clickable: true,
    draggable: true,
    editable: true,
    geodesic: false,
    zIndex: 1,
};
function isNearLatLng(map, a, b, pixelRadius = 14) {
    if (!map || !a || !b) return false;
    const zoom = map.getZoom() || 12;
    const lat1 = a.lat();
    const dLat = (b.lat() - lat1) * 111320;
    const dLng = (b.lng() - a.lng()) * 111320 * Math.cos((lat1 * Math.PI) / 180);
    const meters = Math.hypot(dLat, dLng);
    const metersPerPixel = (156543.03392 * Math.cos((lat1 * Math.PI) / 180)) / Math.pow(2, zoom);
    return meters <= metersPerPixel * pixelRadius;
}

const static_polygonOptions = {
    fillColor: 'blue', fillOpacity: 0.3,
    strokeColor: 'blue', strokeOpacity: 0.8, strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 0,
};

function MapProvider({ children }) {
    // Next inlines only the literal `process.env.NEXT_PUBLIC_*` access.
    // Destructuring `process.env` stays undefined in the client bundle.
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLEMAP_API_KEY;
    console.log({ googleMapsApiKey })

    // Load the Google Maps JavaScript API asynchronously
    const { isLoaded: scriptLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey,
        libraries: libraries,
    });

    if (loadError) return <Alert title="Error" description="Encountered error while loading google maps" type='error' showIcon />
    if (!scriptLoaded) return <Loader loading={true}>Map Script is loading ...</Loader>

    // Return the children prop wrapped by this MapProvider component
    return children;
}

export function MapComponent({ children, style, defaultCenter, onCenterChange, onLoad, onUnmount, ...props }){
    const [center, setCenter] = useState(defaultCenter || defaultMapCenter);

    const map = useRef(null);
    const maps = useRef(null);
    
    const _onLoad = (_map) => {
        if (!maps.current) {
            maps.current = window.google.maps;
            map.current = _map;
        }
        // _map.setCenter(mapCenter);
        if (onLoad) onLoad(_map)
    }

    const _onUnmount = (_map) => {
        map.current = null;
        // maps.current = null;
    }

    function _onCenterChange() {
        // console.log(__yellow("_onCenterChange()"))

        if (!map.current?.center?.lat) return;
        // const newCenter = map.current.getCenter();
        // newCenter.lat()

        let _center = {
            lat: map.current.center.lat(),
            lng: map.current.center.lng(),
        }

        setCenter(_center)
        if (onCenterChange) onCenterChange(_center)
    }


    return (<>
        <GoogleMap
            mapContainerStyle={{ ...defaultMapContainerStyle, ...style }}
            center={center}
            zoom={props.zoom || 18}
            onLoad={_onLoad}
            onUnmount={_onUnmount}
            // onCenterChanged={_onCenterChange}
            onDragEnd={() => {
                _onCenterChange()
                // if (mapRef.current) {
                //     const newCenter = mapRef.current.getCenter();
                //     if (newCenter) {
                //         setCenter({
                //             lat: newCenter.lat(),
                //             lng: newCenter.lng(),
                //         });
                //     }
                // }
            }}
            options={{ zoomControl: true, tilt: 0, gestureHandling: 'auto', mapTypeId: 'roadmap' }}
            // onDragEnd={console.log} onDrag={console.log} onBoundsChanged={console.log} onMouseUp={(v) => console.log("ON mouse Up: ", v)} onMouseMove={(v) => console.log("ON mouse Move: ", v)} onClick={console.log}
        >
            {children}

            <style>{`
                .gm-ui-hover-effect {
                    display: none !important; /* Hide the close button */
                }
            `}</style>
        </GoogleMap>
    </>)
}

const TheMap = React.memo(({ style, center, onPolygonUpdate, enableDrawing = false, editableShape, staticShapes, staticZones, children, ...props }) => {
    const [tooltipContent, setTooltipContent] = useState(""); // Content of the tooltip
    const [tooltipPosition, setTooltipPosition] = useState(null); // Position of the tooltip

    const map = useRef(null);
    const maps = useRef(null);
    const polygonReff = useRef(null);
    const polygonsRef = useRef([]);
    const draftRef = useRef({ listener: null, polyline: null, markers: [], path: [] });
    const [draftCount, setDraftCount] = useState(0);
    const onPolygonUpdateRef = useRef(onPolygonUpdate);
    const enableDrawingRef = useRef(enableDrawing);
    const startDrawingRef = useRef(null);
    onPolygonUpdateRef.current = onPolygonUpdate;
    enableDrawingRef.current = enableDrawing;

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, vertexIndex: null });
    // const [mapCenter, setMapCenter] = useState(center || defaultMapCenter)
    const [newShape, setNewShape] = useState()
    const newShapeRef = useRef(newShape); // Create a ref for newShape


    const panToPolygon = (polygon) => {
        // console.log(__yellow("panToPolygon()"))
        if (!map.current) return;

        if (map.current) {
            let polygonPath = polygon;
            if (polygon.getPath) polygonPath = polygon.getPath()

            const bounds = new window.google.maps.LatLngBounds();
            // let polygonPath = polygonReff.current.getPath()
            polygonPath.forEach((coord) => {
                bounds.extend(coord)
            });
            map.current.fitBounds(bounds); // Fit the polygon within the map's bounds
        }
    };

    function panToCoordinates(coordinates) {
        if (!map.current) return;

        const bounds = new window.google.maps.LatLngBounds();

        // Convert coordinates and extend bounds
        coordinates[0].forEach(([lng, lat]) => {
            bounds.extend(new window.google.maps.LatLng(lat, lng));
        });

        // Fit map to bounds
        map.current.fitBounds(bounds);
    }


    function draw_editableShape() {
        // console.log(__yellow("draw_editableShape()"))

        if (!editableShape) return;

        const coordinates = editableShape.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
        // set_editableShape(coordinates)

        let polygon = new maps.current.Polygon({
            ...editable_polygonOptions,
            paths: coordinates
        })
        setNewShape(polygon)
        polygon.setMap(map.current);

        const path = polygon.getPath();

        path.addListener("set_at", () => onPolygonupdated(polygon));
        path.addListener("insert_at", () => onPolygonupdated(polygon));
        path.addListener("remove_at", () => onPolygonupdated(polygon));

        onPolygonupdated(polygon)
        panToPolygon(polygonReff.current)
    }

    function onMapLoad() {
        if (props.onMapLoad) props.onMapLoad({ panToPolygon, panToCoordinates })
    }

    const addDragListeners = polygon => {
        maps.current.event.addListener(polygon, "dragstart", () => {
            // this.activePolygon = this.getShapeRef(polygon);
        });
        maps.current.event.addListener(polygon, "dragend", () => {
            // this.updatePolygon(polygon);
        });



        // console.log("addDragListeners() > newShape: ", newShapeRef)

        // const draggingPolygon = this.getShapeRef(polygon);

        // this.maps.event.addListener(polygon, "dragstart", () => {
        //     this.activePolygon = this.getShapeRef(polygon);
        // });
        // this.maps.event.addListener(polygon, "dragend", () => {
        //     this.updatePolygon(polygon);
        // });
    };

    function onPolygonupdated(polygon) {
        // console.log(__yellow("onPolygonupdated()"))

        if (polygon) polygonReff.current = polygon;

        if (polygon === false) {
            if (onPolygonUpdateRef.current) onPolygonUpdateRef.current(null);
            return;
        }

        if (!polygonReff.current) return;

        const paths = polygonReff.current.getPath().getArray()
            .map((latLng) => [latLng.lng(), latLng.lat()]); // Correct structure
        // const closedPaths = [...paths, paths[0]]; // Ensure the ring closes
        // console.log("paths: ", paths)
        if (onPolygonUpdateRef.current) onPolygonUpdateRef.current(paths);
    }

    function addShape(polygon) {
        newShapeRef.current = polygon;
        setNewShape(polygon);
        addDragListeners(polygon)

        // const paths = polygon.getPath().getArray()
        //     .map((latLng) => [latLng.lng(), latLng.lat()]); // Correct structure

        // const closedPaths = [...paths, paths[0]]; // Ensure the ring closes
        // if (onPolygonUpdate) onPolygonUpdate(closedPaths);

        polygon.setMap(map.current);

        const path = polygon.getPath();
        path.addListener("set_at", () => onPolygonupdated(polygon));
        path.addListener("insert_at", () => onPolygonupdated(polygon));
        path.addListener("remove_at", () => onPolygonupdated(polygon));
        maps.current.event.addListener(polygon, "dragend", () => onPolygonupdated(polygon));

        onPolygonupdated(polygon)
    }

    const handlePolygonComplete = (polygon) => {
        if (newShapeRef.current) {
            message.error("You can add only 1 shape")
            polygon.setMap(null)
            return;
        }

        polygon.setMap(null)
        addShape(polygon)

        // const paths = polygon.getPath().getArray()
        //     .map((latLng) => [latLng.lng(), latLng.lat()]); // Correct structure

        // const closedPaths = [...paths, paths[0]]; // Ensure the ring closes
        // setNewShape(polygon);
        // addDragListeners(polygon)
        // if (onPolygonUpdate) onPolygonUpdate(closedPaths);
    };

    function clearDraft() {
        const draft = draftRef.current;
        if (draft.listener && maps.current?.event) {
            maps.current.event.removeListener(draft.listener);
        }
        draft.listener = null;
        if (draft.polyline) {
            draft.polyline.setMap(null);
            draft.polyline = null;
        }
        draft.markers.forEach((marker) => marker.setMap(null));
        draft.markers = [];
        draft.path = [];
        if (map.current) {
            map.current.setOptions({ draggableCursor: null, disableDoubleClickZoom: false });
        }
        setDraftCount(0);
    }

    function finishDraft() {
        const path = draftRef.current.path.slice();
        if (path.length < 3) {
            message.warning("Add at least 3 points to close the zone");
            return;
        }

        clearDraft();
        const polygon = new maps.current.Polygon({
            ...editable_polygonOptions,
            paths: path,
        });
        handlePolygonComplete(polygon);
    }

    function undoDraftPoint() {
        const draft = draftRef.current;
        if (!draft.path.length) return;

        draft.path.pop();
        const marker = draft.markers.pop();
        if (marker) marker.setMap(null);
        if (draft.polyline) draft.polyline.setPath(draft.path);
        setDraftCount(draft.path.length);
    }

    function startDrawing() {
        if (!map.current || !maps.current || newShapeRef.current) return;

        clearDraft();
        map.current.setOptions({ draggableCursor: 'crosshair', disableDoubleClickZoom: true });

        const polyline = new maps.current.Polyline({
            map: map.current,
            path: [],
            strokeColor: 'green',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            clickable: false,
            zIndex: 2,
        });
        draftRef.current.polyline = polyline;

        draftRef.current.listener = map.current.addListener('click', (event) => {
            if (newShapeRef.current) return;
            const latLng = event.latLng;
            if (!latLng) return;

            const draft = draftRef.current;
            if (draft.path.length >= 3 && isNearLatLng(map.current, draft.path[0], latLng)) {
                finishDraft();
                return;
            }

            draft.path.push(latLng);
            polyline.setPath(draft.path);

            const isFirst = draft.path.length === 1;
            const pointStyle = {
                strokeColor: 'green',
                strokeWeight: 2,
                fillColor: isFirst ? '#ffffff' : 'green',
                fillOpacity: 1,
                clickable: false,
                zIndex: 3,
                map: map.current,
            };
            draft.markers.push(maps.current.Marker && maps.current.SymbolPath
                ? new maps.current.Marker({
                    ...pointStyle,
                    position: latLng,
                    icon: {
                        path: maps.current.SymbolPath.CIRCLE,
                        scale: isFirst ? 7 : 4,
                        fillColor: pointStyle.fillColor,
                        fillOpacity: 1,
                        strokeColor: 'green',
                        strokeWeight: 2,
                    },
                })
                : new maps.current.Circle({
                    ...pointStyle,
                    center: latLng,
                    radius: ((156543.03392 * Math.cos((latLng.lat() * Math.PI) / 180)) / Math.pow(2, map.current.getZoom() || 12)) * (isFirst ? 8 : 5),
                }));
            setDraftCount(draft.path.length);
        });
    }
    startDrawingRef.current = startDrawing;


    const onLoad = useCallback(function callback(_map) {
        // This is just an example of getting and using the map instance!!! don't just blindly copy!
        // const bounds = new window.google.maps.LatLngBounds(center);
        // map.fitBounds(bounds);

        if (!maps.current){
            maps.current = window.google.maps;
            map.current = _map;
            // _map.setCenter(mapCenter);

            if (enableDrawingRef.current) startDrawingRef.current?.()
            draw_editableShape()
            onMapLoad()
        }

    }, [])

    const onUnmount = React.useCallback(function callback(_map) {
        map.current = null;
        // setMap(null)
    }, [])

    function centerMap(_center) {
        if (!map?.current?.panTo) return;

        map.current.panTo(_center); //({ lat: 40.7128, lng: -74.006 });
    }

    const getShapeRef = polygon => {
        // const shapes = this.state.shapes || [];
        // const currPoints = polygon
        //     .getPath()
        //     .getArray()
        //     .map(p => ({ lat: p.lat(), lng: p.lng() }));
        // let currshape = shapes.find(s => JSON.stringify(s.points) === JSON.stringify(currPoints));

        // return currshape;
    };

    const updatePolygon = polygon => {
        // if (!this.activePolygon) return;

        // const shapes = this.state.shapes || [];
        // this.activePolygon.points = polygon.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
    };

    const handleDeleteVertex = () => {
        const polygon = polygonRef.current;
        const path = polygon.getPath();
        if (contextMenu.vertexIndex !== null) {
            path.removeAt(contextMenu.vertexIndex);
        }
        setContextMenu({ visible: false, x: 0, y: 0, vertexIndex: null });
    };

    function resetShape(){
        if (newShapeRef.current) newShapeRef.current.setMap(null);
        newShapeRef.current = null;
        setNewShape(null);
        onPolygonupdated(false);
        enableDrawingControl();
    }

    // function centerChanged(_map){
    //     if (!map.current?.center?.lat) return;

    //     // const newCenter = _map.getCenter();
    //     // newCenter.lat();

    //     let _center = {
    //         lat: map.current.center.lat(),
    //         lng: map.current.center.lng(),
    //     } 
        
    //     setMapCenter(_center)
    //     if (onCenterChange) onCenterChange(_center)
    // }

    // const panToAllPolygons = (polygons) => {
    //     // polygons

    //     if (map.current) {
    //         const bounds = new window.google.maps.LatLngBounds();

    //         polygons.forEach((polygon) => {
    //             let polygonPath = polygon.getPath()
    //             polygonPath.forEach((coord) => bounds.extend(coord));
    //         });

    //         map.current.fitBounds(bounds); // Fit the polygon within the map's bounds
    //     }
    // };

    const enableDrawingControl = () => {
        startDrawing();
    };

    // function draw_staticShapes(){
    //     if (!staticShapes || staticShapes.length < 1) return;

    //     const coordinates = staticShapes.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
    //     set_staticShapesArray(coordinates)

    //     // if (!editableShape)
    // }

    const handleMouseOver = (event, zone) => {
        setTooltipPosition({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        setTooltipContent(zone.title);
    };
    const handleMouseOut = () => {
        setTooltipPosition(null); // Hide tooltip
    };

    const fitBoundsToPolygons = () => {
        if (map.current) {
            const bounds = new window.google.maps.LatLngBounds();

            // Extend bounds to include all polygons
            polygonsRef.current.forEach((polygon) => {
                const path = polygon.getPath();
                path.forEach((latLng) => bounds.extend(latLng));
            });

            // Fit the map to the calculated bounds
            mapRef.current.fitBounds(bounds);
        }
    };

    // let onCenterChanged = _.debounce(function (_map) {
    //     centerChanged(_map)
    // }, 500, { leading: false, trailing: true });

    function renderStaticZones(){
        if (!staticZones || staticZones.length<1) return null;

        return staticZones.map((zone, i) => {
            return (<Polygon key={i}
                onMouseOver={(e) => handleMouseOver(e, zone)}
                onMouseOut={handleMouseOut}
                path={zone.polygon.coordinates[0].map(([lng, lat]) => ({ lat, lng }))}
                options={{
                    fillColor: 'blue', fillOpacity: 0.2,
                    strokeColor: 'blue', strokeOpacity: 0.5, strokeWeight: 2,
                    // clickable: false,
                    draggable: false,
                    editable: false,
                    geodesic: false,
                    zIndex: 0,
                }}
            />)
        })
    }

    useEffect(() => {
        // Sync the ref with the state whenever newShape changes.
        // resetShape clears the ref itself before this effect runs.
        if (newShape) newShapeRef.current = newShape;
    }, [newShape]);

    useEffect(() => {
        return () => {
            const draft = draftRef.current;
            if (draft.listener && window.google?.maps?.event) {
                window.google.maps.event.removeListener(draft.listener);
            }
        };
    }, []);

    useEffect(() => {
        centerMap(center)
    }, [center])

    console.log({ center })

    /*
    panTo
    setMapCallback
    */

    return (<>
        <MapComponent 
            style={style} 
            defaultCenter={center || defaultMapCenter} 
            onLoad={onLoad} 
            {...props}
            // onCenterChange={centerChanged}
            // onUnmount={onUnmount}
        >
            {children}

            {renderStaticZones()}

            {enableDrawing && <div
                style={{ position: "absolute", top: 15, left: 200, zIndex: 2 }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
            >
                <Space>
                    {!newShape && <>
                        <Button onClick={undoDraftPoint} disabled={draftCount < 1}>Undo point</Button>
                        <Button onClick={finishDraft} color="blue" disabled={draftCount < 3}>Finish zone</Button>
                    </>}
                    {newShape && <Button onClick={resetShape} color="blue">Reset Shape</Button>}
                </Space>
                {!newShape && <div style={{ marginTop: 6, background: "rgba(255,255,255,0.92)", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
                    Click the map to add points ({draftCount}). Click the first point, or Finish zone, to close it.
                </div>}
            </div>}

            {tooltipPosition && (<InfoWindow position={tooltipPosition}
                options={{
                    pixelOffset: new window.google.maps.Size(0, -30), // Offset tooltip position
                }}
            >
                <div style={{ padding: "5px" }}><strong>{tooltipContent}</strong></div>
            </InfoWindow>)}


        </MapComponent>
    </>)
});
TheMap.displayName = 'TheMap';

export const GMap = (props) => {
    return (<>
        <MapProvider>
            <TheMap style={{ height: '100%' }} {...props} />
        </MapProvider>
    </>)
}
// GMap.propTypes = {
//     onCenterChange: PropTypes.func,
//     center: PropTypes.objectOf({
//         lat: PropTypes.number,
//         lng: PropTypes.number,
//     }),
//     style: PropTypes.object,
//     onPolygonUpdate: PropTypes.func,
//     editableShape: PropTypes.object,
//     staticShapes: PropTypes.object,
//     enableDrawing: PropTypes.bool,
//     staticZones: PropTypes.array,
//     onMapLoad: PropTypes.func,
// }
