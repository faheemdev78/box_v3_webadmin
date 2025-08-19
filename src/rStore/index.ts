// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
// import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';
import { persistReducer, persistStore, createMigrate } from 'redux-persist';
import { combineReducers } from 'redux';
import { PersistConfig } from 'redux-persist/es/types';
import { encryptTransform } from 'redux-persist-transform-encrypt';

import counterReducer from './slices/counterSlice';
import sessionReducer from './slices/sessionSlice';
import systemReducer from './slices/systemSlice';
import { __yellow } from '@_/lib/consoleHelper';
import { sleep } from '@_/lib';

// You can define migrations when your persisted schema changes:
const migrations = {
    0: (state: any) => {
        return { ...state };
    },
    1: (state: any) => {
        // Modify state structure if needed
        return {
            ...state,
            counter: { value: state.counter.value ?? 0 },
        };
    },
  };

const persistConfig = {
    key: 'root',
    storage: storageSession, // Use session storage
    blacklist: [], // Array
    whitelist: ['session', 'system'], // Array
    version: 1,
    // throttle: 0, // number
    debug: process.env.NODE_ENV==='development', // boolean
    // serialize: true, // boolean
    // timeout: 0, // number
    transforms: [
        encryptTransform({
            secretKey: process.env.NEXT_PUBLIC_REDUX_SECRET || 'F@h33m78',
            onError: function (error) {
                console.error('Encryption error:', error);
            },
        }),
    ],
    migrate: createMigrate(migrations, { debug: true }),
    writeFailHandler: (err: Error) => {
        console.error('Redux Write failed', err);
    }
  };

const rootReducer = combineReducers({
    counter: counterReducer,
    session: sessionReducer,
    system: systemReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);



export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // needed for redux-persist
        })//.concat(thunk), // add thunk middleware
    // reducer: {
    //     counter: counterReducer,
    // },
});

export const persistor = persistStore(store);

export const cleanStore = () => {
    if (process.env.NODE_ENV == 'development') console.log(__yellow("cleanStore()"))

    persistor.purge(); // persistor.flush(); // or purge() if needed
    // sleep(100).then(r => {
    //     window.location.reload();
    // })
}

// Inferred types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
