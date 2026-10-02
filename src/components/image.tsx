import React from 'react'
import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cdnImageUrl } from '@/lib/cdnImageUrl';

type CustomImageProps = Omit<NextImageProps, 'src' | 'alt'> & { src: string; alt?: string };

export function Image({ src, alt, ...props }: CustomImageProps) {

    // Legacy: prefix every relative image with NEXT_PUBLIC_CDN_URL.
    const _src = cdnImageUrl(src);
    //String(src).startsWith('http') ? src : `${process.env.NEXT_PUBLIC_CDN_URL}/${src}`;


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
