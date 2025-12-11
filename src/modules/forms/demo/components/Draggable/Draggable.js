import React, { forwardRef } from 'react';

import { Handle } from '../Item/components/Handle';

import {
    draggable,
    draggableHorizontal,
    draggableVertical,
} from './draggable-svg';
import styles from './Draggable.module.scss';

export const Axis = {
    All:"All",
    Vertical:"Vertical",
    Horizontal:"Horizontal",
}

export const Draggable = forwardRef (
    function Draggable(
        {
            axis,
            dragOverlay,
            dragging,
            handle,
            label,
            listeners,
            transform,
            style,
            buttonStyle,
            ...props
        },
        ref
    ) {
        return (
            <div className={`${styles.Draggable} ${dragOverlay ? styles.dragOverlay : ''} ${dragging ? styles.dragging : ''} ${handle ? styles.handle : ''}`}
                style={
                    {
                        ...style,
                        '--translate-x': `${transform?.x ?? 0}px`,
                        '--translate-y': `${transform?.y ?? 0}px`,
                    }
                }
            >
                <button
                    {...props}
                    aria-label="Draggable"
                    data-cypress="draggable-item"
                    {...(handle ? {} : listeners)}
                    tabIndex={handle ? -1 : undefined}
                    ref={ref}
                    style={buttonStyle}
                >
                    {axis === Axis.Vertical
                        ? draggableVertical
                        : axis === Axis.Horizontal
                            ? draggableHorizontal
                            : draggable}
                    {handle ? <Handle {...(handle ? listeners : {})} /> : null}
                </button>
                {label ? <label>{label}</label> : null}
            </div>
        );
    }
);