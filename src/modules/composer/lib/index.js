export * from './componentStyling'
export * from './componentSchedule'
import { getSrcFromFile } from '@_/lib/utill'


export function parseStylesOutput(styles={}) {
    if (!styles) return {}
    let style = {}

    if (styles?.padding?.top) Object.assign(style, { paddingTop: `${styles.padding.top}px` })
    if (styles?.padding?.right) Object.assign(style, { paddingRight: `${styles.padding.right}px` })
    if (styles?.padding?.bottom) Object.assign(style, { paddingBottom: `${styles.padding.bottom}px` })
    if (styles?.padding?.left) Object.assign(style, { paddingLeft: `${styles.padding.left}px` })
        
    if (styles?.margin?.top) Object.assign(style, { marginTop: `${styles.margin.top}px` })
    if (styles?.margin?.right) Object.assign(style, { marginRight: `${styles.margin.right}px` })
    if (styles?.margin?.bottom) Object.assign(style, { marginBottom: `${styles.margin.bottom}px` })
    if (styles?.margin?.left) Object.assign(style, { marginLeft: `${styles.margin.left}px` })

    if (styles.background) {
        if (styles.background.type == 'solid') Object.assign(style, { backgroundColor: styles.background.color1 })
        /*
        background: rgb(2,0,36);
        background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(9,9,121,1) 35%, rgba(0,212,255,1) 100%);
        */
        // Background Color
        if (styles.background.type == 'gradient') {
            let color1 = styles?.background?.color1 || '#FFFFFF';
            let color2 = styles?.background?.color2 || '#FFFFFF';
            let angle = styles?.background?.direction == 'horizontal' ? 90 : 180;

            Object.assign(style, {
                background: color1,
                background: `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`
            })
        }

        // Background Iamge
        if (styles?.background?.upload_image && styles?.background?.upload_image[0]?.src?.image){
            Object.assign(style, {
                backgroundImage: `url("${styles.background.upload_image[0].src.image}")`,
                backgroundRepeat: "no-repeat", 
                backgroundPosition: "left top", // left top
                backgroundSize: "contain", // width height, width% height%, cover, contain, initial
                backgroundOrigin: "padding-box", // padding-box, border-box, content-box, initial
            })
        }
        else if (styles?.background?.image?.url) {
            Object.assign(style, {
                backgroundImage: `url("${styles.background.image.url}")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "left top", // left top
                backgroundSize: "contain", // width height, width% height%, cover, contain, initial
                backgroundOrigin: "padding-box", // padding-box, border-box, content-box, initial
            })
        }

    }

    return style;
}

export function parseStylesInput(styles = {}) {
    if (!styles) return {}
    
    let input = {}
    let bgImage = (styles?.background?.upload_image && styles.background.upload_image[0]) && styles?.background?.upload_image[0];
    if (bgImage) bgImage = {
        name: bgImage?.name,
        url: bgImage?.src?.url,
        thumb: bgImage?.src?.thumb,
        width: bgImage?.src?.width,
        height: bgImage?.src?.height,
        size: bgImage?.size,
        type: bgImage?.type,
    }

    if (styles.background) Object.assign(input, {
        background: {
            type: styles?.background?.type,
            direction: styles?.background?.direction,
            color1: styles?.background?.color1,
            color2: styles?.background?.color2,
            image: bgImage,
        }
    })
    if (styles.margins) Object.assign(input, {
        margins: {
            top: styles?.margins?.top || 0,
            right: styles?.margins?.right || 0,
            bottom: styles?.margins?.bottom || 0,
            left: styles?.margins?.left || 0,
        }
    })
    if (styles.padding) Object.assign(input, {
        padding: {
            top: styles?.padding?.top || 0,
            right: styles?.padding?.right || 0,
            bottom: styles?.padding?.bottom || 0,
            left: styles?.padding?.left || 0,
        }
    })

    return input;
}

