import { defaultDateFormat, defaultDateTimeFormat, defaultTZ } from '@_/configs';
import moment from 'moment';
import axios from 'axios';
import { __error, __yellow } from './consoleHelper';
import dayjs from 'dayjs';
import _ from 'lodash';
import { nanoid } from 'nanoid'
import { message } from 'antd';


// moment.tz.setDefault("Canada/Mountain");

/*************************** STRING FUNCTIONS *******************
 *
*/
export const jsonStringify = (jsonObj, a = 0, b = 0) => {
    if (!jsonObj) return jsonObj;
    let result = null;

    try {
        if (typeof jsonObj !== "string") result = JSON.stringify(jsonObj, a, b);
        else result = null;
    }
    catch (error) {
        // console.error("ERROR : jsonStringify()", error);
    }

    return result;
}

export const parseJson = (jsonString, returnBoolean = false) => {
    let jsonObject = undefined;

    if (!jsonString) return returnBoolean ? false : jsonObject;

    try {
        if (typeof jsonString !== "string" || !_.isString(jsonString) || jsonString == undefined || jsonString == null || jsonString == "") {
            // return false;
            if (returnBoolean) jsonObject = false;
        } else {
            jsonObject = JSON.parse(jsonString);
        }
    }
    catch (error) {
        if (process.env.NODE_ENV == 'development') {
            // console.log(__error("ERROR : parseJson()"), jsonString, "\n", error);
        }
        jsonObject = false;
    }

    return jsonObject;
}

export const parseNewLine = (txt, trigger = "\n") => (txt.split(trigger)?.map((o, i) => (<div key={i}>{trigger !== "\n" ? trigger : ""}{o}</div>)))

export function escapeText(str) {
    // Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
    // Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
    return str.replaceAll("\"", "&quot;").replaceAll(["'", "`"], "&apos;")
}

export const string_to_slug = (str, replaceWith) => {
    if (!str || str.length < 1) return "";

    //# Ver 1
    // return String(str).replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

    //# Ver 2
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    // var from = "åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var from = "åàáãäâèéëêìíïîòóöôùúüûñç·/,:;";
    var to = "aaaaaaeeeeiiiioooouuuunc------";

    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str
        .toString()
        .normalize('NFD')
        .replace(/[^a-z0-9 -_]/g, (replaceWith || '')) // remove invalid chars
        .replace(/\s+/g, (replaceWith || '-')) // replace whitespace by -
        .replace(/-+/g, (replaceWith || '-')) // replace dashes
        .replace(/&/g, '-y-') // Replace & with 'and'

        // .replace(/\-\-+/g, '-') // Replace multiple - with single -
        // .replace(/^-+/, "") // trim - from start of text
        // .replace(/-+$/, "") // trim - from end of text
        .trim() // Remove whitespace from both sides of a string

    return str;
}

export const simplify_file_name = str => {
    if (!str || str.length < 1) return "";

    //# Ver 1
    // return String(str).replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

    //# Ver 2
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "åàáãäâèéëêìíïîòóöôùúüûñç/'_,:;";
    var to = "aaaaaaeeeeiiiioooouuuunc------";

    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str
        .toString()
        .normalize('NFD')
        .replace(/[^a-z0-9 -.]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // replace whitespace by -
        .replace(/-+/g, '-') // replace dashes
        .replace(/&/g, '-y-') // Replace & with 'and'
        // .replace(/\-\-+/g, '-') // Replace multiple - with single -
        // .replace(/^-+/, "") // trim - from start of text
        // .replace(/-+$/, "") // trim - from end of text
        .trim() // Remove whitespace from both sides of a string

    return str;
}

export function str2Base64(str) {
    return Buffer.from(str)?.toString('base64')
}

export function base642Str(str) {
    return Buffer.from(str, 'base64')?.toString('ascii')
}

