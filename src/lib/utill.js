// import { defaultDateFormat, defaultDateTimeFormat, defaultTZ } from '@/configs';
import moment from 'moment';
import { __error, __yellow } from './consoleHelper';
// import dayjs from 'dayjs';
import { isString } from './lodash_alt';
import { nanoid } from 'nanoid'
// import { message } from 'antd';

export * from './utill_string';
export * from './utill_color';
export * from './utill_apollo';
export * from './utill_sounds';
export * from './utill_date';

// moment.tz.setDefault("Canada/Mountain");


/*************************** GENERAL FUNCTIONS *******************
 *
*/
export const isServer = typeof window === "undefined";

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function mergeObjects(defaultObj, newObj) {
    const mergedObj = { ...defaultObj };

    for (const key in newObj) {
        if (newObj[key] !== undefined && newObj[key] !== null) {
            mergedObj[key] = newObj[key];
        }
    }

    return mergedObj;
}

export function calculateNewSize(existingW, existingH, value, valFor = 'width') { 
    var ratio = 0;  // Used for aspect ratio
    var width = existingW;    // Current image width
    var height = existingH;  // Current image height

    if (valFor == 'width'){
        ratio = existingW / existingH;
        width = value;
        height = (value / ratio)
    }
    else {
        ratio = existingH / existingW;

        height = value;
        width = (value / ratio)
    }

    return { width, height }

}

export function createUniqueId(args){
    let size = (args && args.size) || 10;
    let extra = (args && args.extra) || false;

    let str = `S.${nanoid(size)}.${timestamp()}`
    if (extra) str += `${extra}.`
    return str;
}


/*************************** IMAGE FUNCTIONS *******************
 *
*/
export async function getImageDimensions(src) {
    let dimensionsResult = await new Promise((resolve) => {
        let img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            resolve({ width, height })
        }
        img.src = src;
    });

    return dimensionsResult;
}

export async function getSrcFromFile(file) {
    // get image src
    let imgResutls = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            resolve(reader.result)
        };
    });

    if (!imgResutls) return;

    let dimensionsResult = await getImageDimensions(imgResutls)
    return { image: imgResutls, thumb: imgResutls, ...dimensionsResult };
};

//*
export const uploadFile = async () => ({ error: { message: 'Uploads go through the backend.' } })

export const uploadFiles = async () => ({ error: { message: 'Uploads go through the backend.' } })










export const formToFilter = (_fields) => {
    const translateFilterValue = (val) => {
        if (val instanceof moment) return utcToDate(val);

        if (!isNaN(val)) return Number(val)

        if (isString(val)) return String(val);
        if (val.keywords) return val;

        return false;
    }

    const fields = { ..._fields }
    let temp;
    let filter = {}

    // convert * to .
    for (let a in fields) {
        let key = a;
        if (a.indexOf("*") > -1) {
            key = a.replaceAll("*", ".");

            // Object.assign(fields, { [key]: fields[a] })
            Object.assign(fields, { [key]: translateFilterValue(fields[a]) })
            delete fields[a];
        }
    }

    let keys = Object.keys(fields);


    keys.forEach(element => {
        let val = fields[element];

        if (!val) { }
        // else if (val.keywords) filter[element] = val
        else if (translateFilterValue(val)) filter[element] = translateFilterValue(val);
        else {
            temp = {};
            if (val.gt) temp = Object.assign(temp, { "$gt": translateFilterValue(val.gt) });
            else if (val.gte) temp = Object.assign(temp, { "$gte": translateFilterValue(val.gte) });
            else if (val.lt) temp = Object.assign(temp, { "$lt": translateFilterValue(val.lt) });
            else if (val.lte) temp = Object.assign(temp, { "$lte": translateFilterValue(val.lte) });
            // else if (val.or){
            //   console.log("val.or: ", val.or)
            //   temp = Object.assign(temp, { "$or": val.or });
            // }
            else {
                console.log(__error("Invalid filter element"), val);
            }
            if (Object.entries(temp).length > 0) filter[element] = temp;
        }
    });

    return filter;
}



export function ensureArrayLength(arr, targetLength, input={}) {
    while (arr.length < targetLength) {
        arr.push(input); // Add an empty object until the array reaches the target length
    }
    return arr;
}





/*************************** GEO FUNCTIONS *******************
 *
*/
export function getPolygonCenter(polygon) {
    var coordinates = polygon;

    if (polygon.getPath) {
        let path = polygon.getPath(); // Get the MVCArray of the polygon's vertices
        coordinates = path.getArray();
    }

    if (coordinates.length === 0) {
        throw new Error("Polygon has no vertices.");
    }

    let latSum = 0;
    let lngSum = 0;

    if (polygon.getPath) {
        coordinates.forEach((latLng) => {
            latSum += latLng.lat();
            lngSum += latLng.lng();
        });
    } else {
        coordinates[0].forEach((latLng) => {
            latSum += latLng[0];
            lngSum += latLng[1];
        });
    }


    const center = {
        lat: latSum / coordinates.length,
        lng: lngSum / coordinates.length,
    };

    return center;
}

