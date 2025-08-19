import React, { PropsWithChildren } from 'react';
import styles from './ConfirmModal.module.scss';

export const ConfirmModal = ({
    onConfirm,
    onDeny,
    children,
}) => (
    <div className={styles.ConfirmModal}>
        <h1>{children}</h1>
        <div>
            <button onClick={onConfirm}>Yes</button>
            <button onClick={onDeny}>No</button>
        </div>
    </div>
);