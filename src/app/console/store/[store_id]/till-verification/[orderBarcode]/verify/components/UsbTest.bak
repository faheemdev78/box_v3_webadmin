// components/UsbTest.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { connectEpson, getAuthorizedEpson, printReceipt } from "@/lib/epson-usb";
import { Space } from 'antd';


function ReceiptPage() {
    const [status, setStatus] = useState("Ready");
    const [info, setInfo] = useState<{ vid: string; pid: string; name: string } | null>(null);

    // On load, check if a device was already authorized
    useEffect(() => {
        (async () => {
            const d = await getAuthorizedEpson();
            if (d) {
                setInfo({
                    vid: "0x" + d.vendorId.toString(16).padStart(4, "0"),
                    pid: "0x" + d.productId.toString(16).padStart(4, "0"),
                    name: d.productName || "Epson TM",
                });
                setStatus("Already authorized");
            } else {
                setStatus("No authorized printer");
            }
        })();
    }, []);

    const handleConnect = async () => {
        try {
            const d = await connectEpson();
            setInfo({
                vid: "0x" + d.vendorId.toString(16).padStart(4, "0"),
                pid: "0x" + d.productId.toString(16).padStart(4, "0"),
                name: d.productName || "Epson TM",
            });
            setStatus("Connected ✅");
        } catch (e: any) {
            setStatus(`Error: ${e.message}`);
        }
    };

    const handlePrint = async () => {
        try {
            await printReceipt([
                "Item 1 ............  10.00",
                "Item 2 ............   5.50",
                "Tax ................. 1.24",
                "------------------------------",
                "TOTAL .............  16.74",
                "",
                "Thank you for your purchase!",
            ]);
            setStatus("Receipt sent ✅");
        } catch (e: any) {
            setStatus(`Print error: ${e.message}`);
        }
    };

    return (<div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h3>Epson TM-m30II (M129H) — Web USB</h3>
        <p>Status: <b>{status}</b></p>
        {info && (<p>
            {info.name} ({info.vid}:{info.pid})
        </p>)}
        <Button size='small' onClick={handleConnect}>🔌 Connect Printer</Button>{" "}
        <Button size='small' onClick={handlePrint} disabled={!info}>🖨️ Print Test Receipt</Button>
    </div>);
}


export default function UsbTest() {
    const [info, setInfo] = useState<string>('');
    const [device, setDevice] = useState<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !('usb' in navigator)) {
            setInfo('Web USB not supported in this browser');
        }
    }, []);

    const testSupport = () => {
        console.log("testSupport()")
        if (typeof navigator === 'undefined') {
            setInfo('SSR - navigator not available');
            return;
        }

        const supported = 'usb' in navigator;
        setInfo(`Web USB supported: ${supported}`);
    };

    const listDevices = async () => {
        console.log("listDevices()")

        try {
            const devices = await navigator.usb.getDevices();
            console.log({ devices })

            if (devices && devices.length){
                console.table(
                    devices.map((x:any) => ({ vendor: '0x' + x.vendorId.toString(16), product: '0x' + x.productId.toString(16), name: x.productName }))
                )
            }

            const list = devices
                .map(
                    (d:any) =>
                        `${d.manufacturerName || 'Unknown'} - ${d.productName || 'Device'
                        } (0x${d.vendorId.toString(16)}:0x${d.productId.toString(16)})`
                )
                .join('\n');
            setInfo(
                `Found ${devices.length} device(s):\n${list || 'None (click "Connect Printer" to grant access)'}`
            );
        } catch (e: any) {
            console.error(e);
            setInfo(`Error: ${e.message}`);
        }
    };

    // const testPrint = async () => {
    //     const ESC = 0x1b;
    //     const GS = 0x1d;
    //     const data = new TextEncoder().encode(
    //         [
    //             String.fromCharCode(ESC) + '@',                 // initialize
    //             'MY STORE\n',
    //             'Receipt #001\n',
    //             '------------------------\n',
    //             'Item 1        $10.00\n',
    //             '------------------------\n',
    //             'TOTAL         $10.00\n',
    //             '\n\n',
    //             String.fromCharCode(GS) + 'V\x41\x10',          // cut paper
    //         ].join('')
    //     );

    //     await device.transferOut(endpointNumber, data);

    // }


    // const listDevices = async () => {
    //     try {
    //         if (!('usb' in navigator)) {
    //             setInfo('Web USB not supported in this browser');
    //             return;
    //         }

    //         const devices = await navigator.usb.getDevices();
    //         const list = devices.map(
    //             (d) => `${d.manufacturerName || 'Unknown'} - ${d.productName || 'Device'} (${d.vendorId}:${d.productId})`
    //         ).join('\n');
    //         setInfo(`Found ${devices.length} device(s):\n${list || 'None (need to request access first)'}`);
    //     } catch (e: any) {
    //         console.error(e);
    //         setInfo(`Error: ${e.message}`);
    //     }
    // };

    const requestDevice = async () => {
        try {
            if (!('usb' in navigator)) {
                setInfo('Web USB not supported in this browser');
                return;
            }

            // Filter helps the user find the right device
            // Common thermal printer vendor IDs:
            // 0x04b8 = Epson, 0x0519 = Star Micronics,
            // 0x04f9 = Brother, 0x1d90 = Citizen, 0x1504 = Bixolon
            const selected = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x04b8 },  // Epson (example)
                    // { vendorId: 0x0519 }, // Star (example)
                    // 👇 Or use classCode for printers (0x07)
                    // { classCode: 0x07 },
                ],
            });

            setDevice(selected);
            setInfo(
                `Authorized: ${selected.manufacturerName || 'Unknown'} - ` +
                `${selected.productName || 'Device'} ` +
                `(${selected.vendorId.toString(16)}:${selected.productId.toString(16)})`
            );

            // Open and select configuration (typical for printers)
            await selected.open();
            if (selected.configuration === null) {
                await selected.selectConfiguration(1);
            }
            const iface = selected.configuration?.interfaces[0];
            if (iface) {
                await selected.claimInterface(iface.interfaceNumber);
            }
        } catch (e: any) {
            // User cancelled the picker, or no matching device found
            if (e.name === 'NotFoundError') {
                setInfo('No device selected');
            } else {
                console.error(e);
                setInfo(`Error: ${e.message}`);
            }
        }
    };

    return (<div style={{ padding: 20 }}>
        <h3>Web USB Test</h3>
        <Space style={{ width:"100%" }}>
            <Button size='small' onClick={testSupport}>Check Support</Button>
            <Button size='small' onClick={requestDevice}>🔌 Connect Printer</Button>{' '}
            <Button size='small' onClick={listDevices} style={{ marginLeft: 10 }}>List Devices</Button>
            <Button size='small' onClick={() => {
                navigator.usb.getDevices().then((d: any) => d.forEach((x: any) => x.forget?.()));
            }}>Forget all Devices</Button>
        </Space>
        <pre style={{ background: '#f5f5f5', whiteSpace: 'pre-wrap', padding: 10, marginTop: 10 }}>{info}</pre>
        <ReceiptPage />
    </div>);
}
