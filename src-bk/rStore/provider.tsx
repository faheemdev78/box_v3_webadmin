// src/store/Provider.tsx
'use client';

import { Provider } from 'react-redux';
import { store, persistor } from './index';
import { PersistGate } from 'redux-persist/integration/react';


// export default function ReduxProvider({ children }: { children: React.ReactNode }) {
//     return <Provider store={store}>{children}</Provider>;
// }

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                {children}
            </PersistGate>
        </Provider>
    );
  }

