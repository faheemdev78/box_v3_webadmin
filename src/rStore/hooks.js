// This file serves as a central hub for re-exporting pre-typed Redux hooks.
import { useDispatch, useSelector, useStore } from "react-redux";

/**** Use throughout your app instead of plain `useDispatch` and `useSelector`
 ************* Usage *************
 * 
 * 1: useAppDispatch
const dispatch = useAppDispatch();
dispatch(updateAuth(session))
 * 
 * 2: useAppSelector
const auth = useAppSelector(getAuth);
OR
const count = useAppSelector((state) => state.counter.value);
 * 
 * 3: useAppStore
const store = useAppStore();
store.getState()
 * 
 */
export const useAppDispatch = useDispatch.withTypes()
export const useAppSelector = useSelector.withTypes()
export const useAppStore = useStore.withTypes()



// // hooks.ts
// import { useDispatch, useSelector, useStore } from 'react-redux';
// import type { TypedUseSelectorHook } from 'react-redux';
// import type { RootState, AppDispatch } from './store';

// export const useAppDispatch: () => AppDispatch = useDispatch;
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppStore = () => useStore<RootState>();
