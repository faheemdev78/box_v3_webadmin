// src/store/Provider.tsx
'use client';

import { Provider } from 'react-redux';
import { store, persistor } from './index';
import { PersistGate } from 'redux-persist/integration/react';
import { initSettings } from './slices/systemSlice';


// export default function ReduxProvider({ children }: { children: React.ReactNode }) {
//     return <Provider store={store}>{children}</Provider>;
// }

interface SettingsState {
    firstRun: boolean | null;
    timezone: string | null;
    currency: string | 'Rs';
    // [key: string]: any;  // <-- allows any other dynamic property
    [key: string]: unknown;
}

function ReduxProvider({ children, settings }: { children: React.ReactNode, settings: SettingsState }) {
    store.dispatch(initSettings(settings));

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
}

export default ReduxProvider
