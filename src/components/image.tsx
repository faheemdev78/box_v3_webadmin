import React from 'react'
import NextImage from 'next/image';

export function Image({ src, alt, ...props }) {

    let _src = src; 
    if (!String(src).startsWith('/') && !String(src).startsWith('http')) _src = `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${src}`;
    //String(src).startsWith('http') ? src : `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${src}`;


    return (<>
        <NextImage 
            {...props}
            src={_src} 
            alt={alt || ""}
            unoptimized
            unselectable='on'
        />
    </>)
}
