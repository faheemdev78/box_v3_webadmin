'use client'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@_/rStore';
import { increment, decrement } from '@_/rStore/slices/counterSlice'
import { setSession, clearSession } from '@_/rStore/slices/sessionSlice';
import { cleanStore } from '@_/rStore';
import { getSessionToken } from '@_/lib/auth';

import { Space } from 'antd';


export default function ReduxTest() {
    const count = useSelector((state: RootState) => state.counter.value);
    const session = useSelector((state: RootState) => state.session);
    const dispatch = useDispatch();
    const token = getSessionToken();

    const login = () => dispatch(setSession({ user: { _id: '123' }, token: 'abc123' }));
    const logout = () => {
        dispatch(clearSession());
    }


    return (<div>
        <h1>Redux Test</h1>

        <h2>Counter: {count}</h2>
        <Space>
            <button onClick={() => dispatch(increment())}>Increment</button>
            <button onClick={() => dispatch(decrement())}>Decrement</button>
        </Space>

        <hr />
        <h2>Redux Session</h2>
        <Space>
            <button onClick={login}>Log-in</button>
            <button onClick={logout}>Log-out</button>
            <button onClick={() => cleanStore()}>Clear Store</button>
        </Space>
        <pre>{JSON.stringify(session, 0, 2)}</pre>

        <hr />
        <h2>Cookies</h2>
        <div>{token}</div>

    </div>)
}
