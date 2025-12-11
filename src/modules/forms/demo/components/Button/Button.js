import React, { HTMLAttributes } from 'react';

import styles from './Button.module.scss';

export function Button({ children, ...props }) {
    return (
        <button className={`${styles.Button}`} {...props}>
            {children}
        </button>
    );
}