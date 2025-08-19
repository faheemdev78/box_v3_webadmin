import { defaultDateFormat, defaultDateTimeFormat, defaultTZ } from '@_/configs';
import moment from 'moment';
import axios from 'axios';
import { __error, __yellow } from './consoleHelper';
import dayjs from 'dayjs';
import _ from 'lodash';
import { nanoid } from 'nanoid'
import { message } from 'antd';

export * from './utill_string';
export * from './utill_color';
export * from './utill_apollo';

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
export const uploadFile = async ({ file, data, thumbSize, headers, withCredentials, onUploadComplete, onError }) => {
    // data{ upload_type: '', pathPrefix }

    if (!file){
        alert("Missing upload file")
        return false;
    }
    if (!data){
        alert("Missing upload data")
        return false;
    }

    if (!data.upload_type){
        alert("Missing upload_type")
        return false;
    }

    function onUploadProgress({ total, loaded }) {
        let percent = Math.round(loaded / total * 100).toFixed(2);
        // console.log("onUploadProgress()", { total, loaded, percent })
    }
    
    let formData = {
        ...data,
        file
    }

    await axios.post(process.env.NEXT_PUBLIC_API_URL+`/upload_files`, formData, { 
            withCredentials, 
            headers: {
                'Content-Type': 'multipart/form-data'
            }, 
            onUploadProgress
        })
        .then(({ data: response }) => onUploadComplete(response, file))
        .catch(onError || console.log);

    return {
        abort() {
            console.log('upload progress is aborted.');
        },
    };
}

export const uploadFiles = async ({ files, data, thumbSize, headers, withCredentials, onUploadComplete, onError }) => {
    if (!files){
        alert("Missing upload files")
        return false;
    }
    if (!data || !data._id){
        alert("Missing upload ID")
        return false;
    }
    if (!data.uploadType){
        alert("Missing upload type")
        return false;
    }

    function onUploadProgress({ total, loaded }) {
        let percent = Math.round(loaded / total * 100).toFixed(2);
        return percent;
        // console.log("onUploadProgress()", { total, loaded, percent })
    }


    const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        files.forEach((file) => {
            if (file.originFileObj instanceof File) {
                formData.append('files', file.originFileObj); // Append each file
            } else {
                console.error('Invalid file format:', file);
            }
        });

    let resutls = await axios.post(process.env.NEXT_PUBLIC_API_URL+`/upload_files`, formData, { 
            withCredentials, 
            headers: { 'Content-Type': 'multipart/form-data' }, 
            onUploadProgress
        })
        .then(({ data: response }) => (response))
        .catch(err => {
            console.log(__error("Upload Error: "), err)
            return { error:{message:"Faild to upload files"}}
        });

    if (!resutls || resutls.error){
        if (onError) onError((resutls && resutls?.error?.message) || "Invalid upload response!")
        return { error: { message: (resutls && resutls?.error?.message) || "Invalid upload response!" }}
    }

    if (onUploadComplete) onUploadComplete(resutls)
    return resutls;

    // return {
    //     abort() {
    //         console.log('upload progress is aborted.');
    //     },
    // };
}
// */








/*************************** DATE FUNCTIONS *******************
 *
*/
export function timestamp() { return moment().valueOf(); }

export const getUtcOffset = (_date) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return subject.utcOffset();
}
export const setUtcOffset = (_date, keepLocalTime = false, offset=5) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return subject.utcOffset(offset*60, keepLocalTime); // setting utc in minutes (hrs*60 minutes)
}

export const dateToLocal = (_date) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return moment.tz(subject.format('YYYY-MM-DDTHH:mm:ss'), "YYYY-MM-DDTHH:mm:ss", true, defaultTZ)
}

export const dateToUtc = (_t, new_options) => {
    let offset1 = _t.utcOffset();
    let offset2 = moment().utcOffset();

    if (!new_options || !new_options.tz) {
        console.log(__error("Missing target timezone, setting back to default: "), defaultTZ);
        // alert("Missing target timezone");
        message.error("Missing target timezone")
        return false;
    }

    let options = {
        tz:defaultTZ, returnAs:"string",
        ...new_options
    }

    // Replace timezone to CA
    var updatedTimezone = moment.tz(_t.format("DD-MM-YYYY HH:mm"), "DD-MM-YYYY HH:mm", options.tz); // change timezone
    // convert to UTC
    let _utc = updatedTimezone.utc(false); // false = convert time

    if (offset1 !== offset2) {
        console.log("timezone differnt")
    }

    return options.returnAs == "string" ? _utc.format() : _utc;
}

export const utcToDate = (utc_string, format) => {
    return format ? moment(utc_string, format) : moment(utc_string);
}

export const utcToDateField = (val) => dayjs(utcToDate(val).format("YYYY-MM-DD HH:mm"));

export const dayjs_to_moment = (mDate, timezone = defaultTZ) => {
    let d = dateToUtc(mDate, { tz: timezone })
    d = utcToDate(d)
    return d;
}

export const timeFromNow = (date, maxHrs=24) => {
    let thediff = moment().diff(date, "hours");

    if (thediff < maxHrs) return date.fromNow();

    return date.format(defaultDateTimeFormat);
}

export const countDateDifference = (start, end) => {
    // console.log(__yellow('countDateDifference()'), { start, end })
    if (start.isAfter(end)){
        return { error:{message:"Start date is after end date"}}
    }

    const duration = moment.duration(end.diff(start));
    // console.log("duration.asHours(): ", duration.asHours())

    // Extract hours, minutes, and seconds from the duration
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    return {
        hrs: hours,
        min: minutes,
        sec: seconds
    };
}

export function timeStr2Date(t) {
    let dString = utcToDate()
    let newDate = String(t).padStart(4, '0')
    newDate = dString.clone().set({ hours: newDate.slice(0, 2), minutes: newDate.slice(2) })
    newDate = dayjs(newDate.format())

    return newDate;
}



export const formToFilter = (_fields) => {
    const translateFilterValue = (val) => {
        if (val instanceof moment) return utcToDate(val);

        if (!isNaN(val)) return Number(val)

        if (_.isString(val)) return String(val);
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

