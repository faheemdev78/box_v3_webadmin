// src/store/slices/counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionStoreState {
    _id: string;
    title: string;
}
interface UserState {
    _id: string | null;
    name: string | null;
    email: string | null;
    acc_type: string | null;
    permissions: string | null;
    store?: SessionStoreState | null;
}
interface SessionState {
    user: UserState;
    token: string | null;
}
const initialState: SessionState = {
    user:{
        _id: null,
        name: null,
        email: null,
        acc_type: null,
        permissions: null,
        store: null,
    },
    token: null,
};


export const sessionSlice = createSlice({
    name: 'session',
    initialState,
    reducers: {
        setSession: (state, action: PayloadAction<SessionState>) => {
            // Object.assign(state, action.payload);
            state.user = {
                _id: action.payload.user._id,
                name: action.payload.user.name,
                email: action.payload.user.email,
                acc_type: action.payload.user.acc_type,
                permissions: action.payload.user.permissions,
                store: !action?.payload?.user?.store?._id ? null : { 
                    _id: action.payload.user.store._id, 
                    title: action.payload.user.store.title
                },
            };
            state.token = action.payload.token;
        },
        clearSession: (state) => {
            Object.assign(state, initialState);
            // state._id = null;
            // state.token = null;
        },
    },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;

export const getSession = (state: any): SessionState => state.session;
export const getSessionToken = (state: any): SessionState => state?.session?.token;
