import { defaultTZ } from '@/configs';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
    firstRun: boolean | null;
    timezone: string | null;
    currency: string | 'Rs';
    [key: string]: unknown;
}
interface SystemState {
    settings: SettingsState,
    fmc_token: string | null,
    [key: string]: unknown
}
const initialState: SystemState = {
    settings: {
        firstRun: false,
        timezone: defaultTZ,
        currency: 'Rs',
    },
    fmc_token: null,
};


export const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        // updateSystemState: (state, action: PayloadAction<SystemState>) => {
        //     state = {
        //         settings: {
        //             ...state.settings,
        //             firstRun: action.payload?.settings?.firstRun || state.settings.firstRun,
        //             timezone: action.payload?.settings?.timezone || state.settings.timezone,
        //         },
        //         fmc_token: action.payload?.fmc_token || state.fmc_token,
        //     }
        // },
        // setSettings: (state, action: PayloadAction<SettingsState>) => {
        //     state.settings = {
        //         ...state.settings,
        //         firstRun: action.payload.firstRun,
        //         timezone: action.payload.timezone,
        //     };
        // },
        initSettings: (state, action: PayloadAction<SettingsState>) => {
            // console.log("INIT SETTINGS", action.payload);
            state.settings = action.payload;
        },
        // clearSettings: (state) => {
        //     // Object.assign(state, initialState);
        //     state.settings = { ...initialState }
        // },
    },
});

export const { initSettings } = systemSlice.actions;
export default systemSlice.reducer;

export const getSystemState = ({ system }: { system: SystemState }): SystemState => system;
export const getSettings = ({ system }: {system: SystemState}): SettingsState => system.settings;
export const getFmcToken = ({ system }: {system: SystemState}): string | null => system.fmc_token;
