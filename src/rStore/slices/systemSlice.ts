// src/store/slices/counterSlice.ts
import { defaultTZ } from '@_/configs';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  firstRun: Boolean | null;
  timezone: String | null;
}
interface SystemState {
    settings: SettingsState,
    fmc_token: String | null
}
const initialState: SystemState = {
    settings: {
        firstRun: false,
        timezone: defaultTZ,
    },
    fmc_token: null,
};


export const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        updateSystemState: (state, action: PayloadAction<SystemState>) => {
            state = {
                settings: {
                    ...state.settings,
                    firstRun: action.payload?.settings?.firstRun || state.settings.firstRun,
                    timezone: action.payload?.settings?.timezone || state.settings.timezone,
                },
                fmc_token: action.payload?.fmc_token || state.fmc_token,
            }
        },
        setSettings: (state, action: PayloadAction<SettingsState>) => {
            state.settings = {
                ...state.settings,
                firstRun: action.payload.firstRun,
                timezone: action.payload.timezone,
            };
        },
        // clearSettings: (state) => {
        //     // Object.assign(state, initialState);
        //     state.settings = { ...initialState }
        // },
    },
});

export const { setSettings } = systemSlice.actions;
export default systemSlice.reducer;

export const getSystemState = (state: any): SystemState => state.system;
export const getSettings = (state: SystemState): SettingsState => state.settings;
export const getFmcToken = (state: SystemState): String | null => state.fmc_token;
