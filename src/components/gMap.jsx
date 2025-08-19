'use client'

import React, { Component, useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types';
import { Alert, message, Space } from 'antd'
import { __error, __yellow } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Loader } from './loader';
import { GoogleMap, useJsApiLoader, Libraries, DrawingManager, PolygonF, Polygon, InfoWindow } from '@react-google-maps/api'
import _ from 'lodash'
import { Button } from './button';

// import GEO_ZONES from '@_/graphql/geo_zone/geoZones.graphql';


const libraries = ['drawing']; // ['places', 'drawing', 'geometry'];
const defaultMapContainerStyle = { width: '100%', height: '80vh', borderRadius: '15px 0px 0px 15px' };
const defaultMapCenter = { lat: 31.52443022759592, lng: 74.35772741448616 }; // Lahore
const defaultMapZoom = 18;
const defaultMapOptions = { zoomControl: true, tilt: 0, gestureHandling: 'auto', mapTypeId: 'roadmap' };
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
    const { NEXT_PUBLIC_GOOGLEMAP_API_KEY } = process.env;

    // Load the Google Maps JavaScript API asynchronously
    const { isLoaded: scriptLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: NEXT_PUBLIC_GOOGLEMAP_API_KEY,
        libraries: libraries,
    });

    if (loadError) return <Alert message="Encountered error while loading google maps" type='error' showIcon />
    if (!scriptLoaded) return <Loader loading={true}>Map Script is loading ...</Loader>

    // Return the children prop wrapped by this MapProvider component
    return children;
}

const MapComponent = ({ style, center, onCenterChange, onPolygonUpdate, enableDrawing = false, editableShape, staticShapes, staticZones, children, ...props }) => {
    const [tooltipContent, setTooltipContent] = useState(""); // Content of the tooltip
    const [tooltipPosition, setTooltipPosition] = useState(null); // Position of the tooltip

    const drawingManagerRef = useRef(null);
    const map = useRef(null);
    const maps = useRef(null);
    const polygonReff = useRef(null);
    const polygonsRef = useRef([]);

    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, vertexIndex: null });
    const [mapCenter, setMapCenter] = useState(center || defaultMapCenter)
    const [newShape, setNewShape] = useState()
    const newShapeRef = useRef(newShape); // Create a ref for newShape

    const onLoad = useCallback(function callback(_map) {
        // This is just an example of getting and using the map instance!!! don't just blindly copy!
        // const bounds = new window.google.maps.LatLngBounds(center);
        // map.fitBounds(bounds);

        if (!maps.current){
            maps.current = window.google.maps;
            map.current = _map;

            if (enableDrawing) initilizeDrawing()
            draw_editableShape()
            onMapLoad()
        }

    }, [])

    const onUnmount = React.useCallback(function callback(_map) {
        map.current = null;
        // setMap(null)
    }, [])


    useEffect(() => {
        // Sync the ref with the state whenever newShape changes
        newShapeRef.current = newShape;
    }, [newShape]);

    useEffect(() => {
        centerMap(center)
    }, [center])

    function onPolygonupdated(polygon) {
        // console.log(__yellow("onPolygonupdated()"))

        if (polygon) polygonReff.current = polygon;
        
        if (polygon===false){
            if (onPolygonUpdate) onPolygonUpdate(null);    
            return;
        }

        if (!polygonReff.current) return;

        const paths = polygonReff.current.getPath().getArray()
            .map((latLng) => [latLng.lng(), latLng.lat()]); // Correct structure
        // const closedPaths = [...paths, paths[0]]; // Ensure the ring closes
        // console.log("paths: ", paths)
        if (onPolygonUpdate) onPolygonUpdate(paths);
    }

    const initilizeDrawing = () =>{
        const drawingManager = new maps.current.drawing.DrawingManager({
            drawingMode: maps.current.drawing.OverlayType.POLYGON,
            drawingControl: true,
            drawingControlOptions: {
                position: maps.current.ControlPosition.TOP_CENTER,
                drawingModes: [maps.current.drawing.OverlayType.POLYGON],
            },
            polygonOptions: editable_polygonOptions,
        });
        drawingManager.setMap(map.current);
        drawingManagerRef.current = drawingManager;

        // maps.current.event.addListener(drawingManager, 'polygoncomplete', (event) => {
        //     handlePolygonComplete(event)
        // });
        maps.current.event.addListener(drawingManager, 'polygoncomplete', (event) => {
            handlePolygonComplete(event)
        });
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

    function addShape(polygon){
        setNewShape(polygon);
        addDragListeners(polygon)

        // const paths = polygon.getPath().getArray()
        //     .map((latLng) => [latLng.lng(), latLng.lat()]); // Correct structure

        // const closedPaths = [...paths, paths[0]]; // Ensure the ring closes
        // if (onPolygonUpdate) onPolygonUpdate(closedPaths);

        polygon.setMap(map.current);
        onPolygonupdated(polygon)
    }

    const handleDeleteVertex = () => {
        const polygon = polygonRef.current;
        const path = polygon.getPath();
        if (contextMenu.vertexIndex !== null) {
            path.removeAt(contextMenu.vertexIndex);
        }
        setContextMenu({ visible: false, x: 0, y: 0, vertexIndex: null });
    };


    function resetShape(){
        console.log(__yellow("resetShape()"))

        newShape.setMap(null)
        enableDrawingControl()
        setNewShape(null)

        onPolygonupdated(false)
    }

    function centerChanged(){
        if (!map.current?.center?.lat || !onCenterChange) return;

        let _center = {
            lat: map.current.center.lat(),
            lng: map.current.center.lng()
        } 

        onCenterChange(_center)
    }

    function draw_editableShape(){
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

    function centerMap(_center){
        if (!map?.current?.panTo) return;

        map.current.panTo(_center); //({ lat: 40.7128, lng: -74.006 });
    }

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

    function panToCoordinates(coordinates){
        if (!map.current) return;

        const bounds = new window.google.maps.LatLngBounds();

        // Convert coordinates and extend bounds
        coordinates[0].forEach(([lng, lat]) => {
            bounds.extend(new window.google.maps.LatLng(lat, lng));
        });

        // Fit map to bounds
        map.current.fitBounds(bounds);
    }

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
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setOptions({
                drawingControl: true, // Enable drawing control
                drawingControlOptions: {
                    position: maps.current.ControlPosition.TOP_CENTER,
                    drawingModes: [maps.current.drawing.OverlayType.POLYGON],
                },
            });
        }
    };
    const disableDrawingControl = () => {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setOptions({
                drawingControl: false,
            });
        }
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

    function onMapLoad(){
        if (props.onMapLoad) props.onMapLoad({ panToPolygon, panToCoordinates })
    }

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

    let onCenterChanged = _.debounce(function () {
        centerChanged()
    }, 500, { leading: false, trailing: true });
    
    /*
    panTo
    setMapCallback
    */

    return (<>
        <GoogleMap
            mapContainerStyle={{ ...defaultMapContainerStyle, ...style }}
            center={mapCenter}
            // center={{ lat: 37.772, lng: -122.214 }} // Initial center
            zoom={defaultMapZoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            // onDragEnd={console.log}
            // onDrag={console.log}
            // onBoundsChanged={console.log}
            // onMouseUp={(v) => console.log("ON mouse Up: ", v)}
            // onMouseMove={(v) => console.log("ON mouse Move: ", v)}
            onCenterChanged={onCenterChanged}
            // onClick={console.log}
            options={{ ...defaultMapOptions }}
        >
            {children}

            {staticZones && staticZones.map((zone, i) => {
                return (<Polygon key={i}
                    onMouseOver={(e)=>handleMouseOver(e, zone)}
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
            })}
            

            {enableDrawing && 
                <div style={{ position:"absolute", top:15, left: 200 }}><Space>
                    {newShape && <Button onClick={resetShape} color="blue">Reset Shape</Button>}
                </Space></div>
            }

            {/* {(map && showDrawing) && <>
                <DrawingManager
                    // drawingMode
                    options={{ 
                        drawingControl:true,
                        drawingControlOptions: {
                            position: maps.ControlPosition.TOP_CENTER,
                            drawingModes: [
                                maps.drawing.OverlayType.POLYGON
                            ]
                        }
                    }}
                    // onPolygonUpdate
                />
            </>} */}

            {tooltipPosition && (
                <InfoWindow position={tooltipPosition}
                    options={{
                        pixelOffset: new window.google.maps.Size(0, -30), // Offset tooltip position
                    }}
                >
                    <div style={{ padding: "5px" }}>
                        <strong>{tooltipContent}</strong>
                    </div>
                </InfoWindow>
            )}


            <style>{`
                .gm-ui-hover-effect {
                display: none !important; /* Hide the close button */
                }
            `}</style>

        </GoogleMap>
    </>)
};
const TheMap = React.memo(MapComponent)

export const GMap = (props) => {
    return (<>
        <MapProvider>
            <TheMap style={{ height: '100%' }} {...props} />
        </MapProvider>
    </>)
}
GMap.propTypes = {
    onCenterChange: PropTypes.func,
    center: PropTypes.objectOf({
        lat: PropTypes.number,
        lng: PropTypes.number,
    }),
    style: PropTypes.object,
    onPolygonUpdate: PropTypes.func,
    editableShape: PropTypes.object,
    staticShapes: PropTypes.object,
    enableDrawing: PropTypes.bool,
    staticZones: PropTypes.array,
    onMapLoad: PropTypes.func,

    // markers: PropTypes.array,
    // shapes: PropTypes.array,
    // showDeliveryZones: PropTypes.bool,
    // onZoneLoad: PropTypes.func,
    // onZoneMatch: PropTypes.func,
}
