import React from 'react'
import NextImage, { ImageProps as NextImageProps } from 'next/image';

type CustomImageProps = Omit<NextImageProps, 'src' | 'alt'> & { src: string; alt?: string };

export function Image({ src, alt, ...props }: CustomImageProps) {

    let _src: string = src; 
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
