import { defaultDateFormat, defaultDateTimeFormat, defaultTZ } from '@/configs';
import moment from 'moment';
import { __error, __yellow } from './consoleHelper';
import dayjs from 'dayjs';


/*************************** DATE FUNCTIONS *******************
 *
*/
export function timestamp() { return moment().valueOf(); }

export const getUtcOffset = (_date:any) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return subject.utcOffset();
}
export const setUtcOffset = (_date:any, keepLocalTime = false, offset=5) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return subject.utcOffset(offset*60, keepLocalTime); // setting utc in minutes (hrs*60 minutes)
}

export const dateToLocal = (_date:any) => {
    let subject = moment.isMoment(_date) ? _date : moment(_date);
    return moment.tz(subject.format('YYYY-MM-DDTHH:mm:ss'), "YYYY-MM-DDTHH:mm:ss", true, defaultTZ)
}

export const dateToUtc = (_t:any, new_options?:any) => {
    let offset1 = _t.utcOffset();
    let offset2 = moment().utcOffset();

    if (!new_options || !new_options.tz) {
        console.log(__error("Missing target timezone, setting back to default: "), defaultTZ);
        // alert("Missing target timezone");
        console.error('Missing target timezone')
        // message.error("Missing target timezone")
        return false;
    }

    let options = {
        tz:defaultTZ, returnAs:"string",
        ...new_options
    }

    // Replace timezone to CA
    let updatedTimezone = moment.tz(_t.format("DD-MM-YYYY HH:mm"), "DD-MM-YYYY HH:mm", options.tz); // change timezone
    // convert to UTC
    let _utc = updatedTimezone.utc(false); // false = convert time

    if (offset1 !== offset2) {
        console.log("timezone differnt")
    }

    return options.returnAs == "string" ? _utc.format() : _utc;
}

export const utcToDate = (utc_string?:string, format?:string) => {
    return format ? moment(utc_string, format) : moment(utc_string);
}

export const utcToDateField = (val:string) => dayjs(utcToDate(val).format("YYYY-MM-DD HH:mm"));

export const dayjs_to_moment = (mDate:any, timezone = defaultTZ) => {
    let d = dateToUtc(mDate, { tz: timezone })
    d = utcToDate(d)
    return d;
}

export const timeFromNow = (date:any, maxHrs=24) => {
    let thediff = moment().diff(date, "hours");

    if (thediff < maxHrs) return date.fromNow();

    return date.format(defaultDateTimeFormat);
}

export const countDateDifference = (start:any, end:any) => {
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

export function timeStr2Date(t:string) {
    let dString = utcToDate()
    let newDate = String(t).padStart(4, '0')
    newDate = dString.clone().set({ hours: newDate.slice(0, 2), minutes: newDate.slice(2) })
    newDate = dayjs(newDate.format())

    return newDate;
}

