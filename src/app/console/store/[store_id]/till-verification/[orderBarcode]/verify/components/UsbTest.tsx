// components/UsbTest.tsx
'use client';
import { Button } from '@/components';
import { useState } from 'react';

export default function UsbTest() {
    const [info, setInfo] = useState<string>('');

    const testSupport = () => {
        if (typeof navigator === 'undefined') {
            setInfo('SSR - navigator not available');
            return;
        }

        const supported = 'usb' in navigator;
        setInfo(`Web USB supported: ${supported}`);
    };

    const listDevices = async () => {
        try {
            if (!('usb' in navigator)) {
                setInfo('Web USB not supported in this browser');
                return;
            }

            const devices = await navigator.usb.getDevices();
            const list = devices.map(
                (d) => `${d.manufacturerName || 'Unknown'} - ${d.productName || 'Device'} (${d.vendorId}:${d.productId})`
            ).join('\n');
            setInfo(`Found ${devices.length} device(s):\n${list || 'None (need to request access first)'}`);
        } catch (e: any) {
            setInfo(`Error: ${e.message}`);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h3>Web USB Test</h3>
            <Button onClick={testSupport}>Check Support</Button>
            <Button onClick={listDevices} style={{ marginLeft: 10 }}>List Devices</Button>
            <pre style={{ background: '#f5f5f5', padding: 10, marginTop: 10 }}>{info}</pre>
        </div>
    );
}
