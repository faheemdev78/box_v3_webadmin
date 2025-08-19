'use client'
import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Alert, Col, Row } from "antd";
import { __error, __success, __yellow } from "@_/lib/consoleHelper";



const defaultAnnouncements = {
    onDragStart(id) {
        console.log(`Picked up draggable item ${id}.`);
    },
    onDragOver(id, overId) {
        if (overId) {
            console.log(
                `Draggable item ${id} was moved over droppable area ${overId}.`
            );
            return;
        }

        console.log(`Draggable item ${id} is no longer over a droppable area.`);
    },
    onDragEnd(id, overId) {
        if (overId) {
            console.log(
                `Draggable item ${id} was dropped over droppable area ${overId}`
            );
            return;
        }

        console.log(`Draggable item ${id} was dropped.`);
    },
    onDragCancel(id) {
        console.log(`Dragging was cancelled. Draggable item ${id} was dropped.`);
    }
};

function Container({ id, items, itemParser, isActive, containerProps }) {
    const { setNodeRef } = useDroppable({ id });

    let _style = { ...containerProps.style }
    if (isActive) Object.assign(_style, { border: "1px solid rgba(0, 255, 0, 1)" })

    // console.log("containerProps: ", containerProps)

    return (
        <SortableContext id={id} disabled={false} items={items && items.map(item => item._id)} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} style={_style} className={containerProps.className}>
                {items && items.map((item) => (
                    <SortableItem key={item._id} id={item._id} data={item}>
                        {itemParser(item)}
                    </SortableItem>
                ))}
            </div>
        </SortableContext>
    );
}

function SortableItem({ id, data, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        // width: "100%",
        // height: 50,
        // display: "flex",
        // alignItems: "center",
        // justifyContent: "center",
        // border: "1px solid black",
        // margin: "10px 0",
        // background: "white"
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
            {/* <Item id={id} data={data} /> */}
        </div>
    );
}





export function DndContainers({ containers, onUpdate, itemParser, gutter, containerProps }) {
    const [items, setItems] = useState({});
    const [activeItem, setActiveItem] = useState(null);
    const [activeContainer, setActiveContainer] = useState(null);
    const [overContainer, setOverContainer] = useState(null);
    const [updateCounter, setUpdateCounter] = useState(1);

    const validateParams = () => ((!containers || !onUpdate || !itemParser) ? false : true);

    useEffect(() => {
        if (updateCounter < 2 || !validateParams()) return;
        onUpdate(items)
    }, [updateCounter])

    useEffect(() => {
        if (!validateParams()) return;
        setItems(containers)
    }, [containers])


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    function findContainer(id) {
        if (id in items) return id;
        return Object.keys(items).find((key) => items[key].find(o => o._id == id));
        // return Object.keys(items).find((key) => items[key].includes(id));
    }

    function handleDragStart(event) {
        // console.log(__yellow("handleDragStart()"))

        const { active } = event;
        const { id } = active;
        let _activeItem = items[active.data.current.sortable.containerId]?.find(o => o._id == id)

        // setActiveId(id);
        setActiveItem(_activeItem);
    }

    function handleDragOver(event) {
        // console.log(__yellow("handleDragOver()"))

        const { active, over, activatorEvent } = event;
        const { id } = active;
        const { id: overId } = over;

        // Find the containers
        const activeContainer = findContainer(id);
        const overContainer = findContainer(overId);
        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setActiveContainer(activeContainer)
        setOverContainer(overContainer)

        
        let _containerProps = getContainerProps(overContainer);
        // check limit
        if (_containerProps.limit > 0 && (items[overContainer]?.length || 0) >= _containerProps.limit) {
            console.log(__error(""), `(${overContainer}) A: Limit exceded: `, `${_containerProps.limit} / ${items[overContainer]?.length}`)
            return;
        } else {
            console.log(__success(""), `(${overContainer}) A: Limit Available: `, `${_containerProps.limit} / ${items[overContainer]?.length}`)
        }





        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            // Find the indexes for the items
            const activeIndex = activeItems.findIndex(o => o._id == id); // .indexOf(id);
            const overIndex = overItems.findIndex(o => o._id == overId); //.indexOf(overId);

            let newIndex;
            if (overId in prev) {
                // We're at the root droppable of a container
                newIndex = overItems.length + 1;
            } else {
                const isBelowLastItem =
                    over &&
                    overIndex === overItems.length - 1 &&
                    activatorEvent.offsetY > over.rect.offsetTop + over.rect.height;

                const modifier = isBelowLastItem ? 1 : 0;

                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item._id !== active.id)
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    items[activeContainer][activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length)
                ]
            };
        });
        setUpdateCounter(updateCounter+1)
    }

    function handleDragEnd(event) {
        // console.log(__yellow("handleDragEnd()"))
        
        const { active, over } = event;
        const { id } = active;
        const { id: overId } = over;

        const activeContainer = findContainer(id);
        const overContainer = findContainer(overId);


        let _containerProps = getContainerProps(overContainer);
        // check limit
        if (_containerProps.limit > 0 && (items[overContainer]?.length || 0) >= _containerProps.limit) {
            // console.log(__error(""), `(${overContainer}) A: Limit exceded: `, `${_containerProps.limit} / ${items[overContainer]?.length}`)
            setActiveItem(null)
            setActiveContainer(null)
            setOverContainer(null)
            return;
        } else {
            // console.log(__success(""), `(${overContainer}) A: Limit Available: `, `${_containerProps.limit} / ${items[overContainer]?.length}`)
        }





        const activeIndex = items[activeContainer].findIndex(o => o._id == active.id); //indexOf(active.id);
        const overIndex = items[overContainer].findIndex(o => o._id == overId); //indexOf(overId);

        if (activeIndex !== overIndex) {
            setItems((items) => ({
                ...items,
                [overContainer]: arrayMove(items[overContainer], activeIndex, overIndex)
            }));
            setUpdateCounter(updateCounter + 1)
        }

        // setActiveId(null);
        setActiveItem(null)
        setActiveContainer(null)
        setOverContainer(null)
    }

    if (!validateParams()) return <Alert message="Incomplte parameters provided" type="error" showIcon />

    const span = !items ? 24 : 24 / Object.keys(items).length;
    const getContainerProps = (name) => (containerProps[name] || {});

    return (<div>
        <DndContext
            announcements={defaultAnnouncements}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <Row gutter={gutter} style={{ width:"100%" }}>
                {items && Object.keys(items).map(name => (<Col span={span} key={name}>
                    {getContainerProps(name)?.title}
                    <Container key={name} id={name} 
                        containerProps={getContainerProps(name) || {}}
                        items={items[name]} 
                        itemParser={itemParser} 
                        isActive={overContainer === name}
                    />
                </Col>))}
            </Row>
            {/* {items && Object.keys(items).map(name => (<Container id={name} items={items[name]} key={name} />))} */}
            {/* <DragOverlay style={{ opacity: 0.5 }}>{activeItem ? <Item id={activeItem._id} data={activeItem} /> : null}</DragOverlay> */}
            <DragOverlay style={{ opacity: 0.5 }}>{activeItem ? itemParser(activeItem) : null}</DragOverlay>
        </DndContext>
    </div>);

}

DndContainers.propTypes = {
    containers: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    itemParser: PropTypes.func.isRequired,
    // containerStyle: PropTypes.object,
    containerProps: PropTypes.object,
    gutter: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),
}
