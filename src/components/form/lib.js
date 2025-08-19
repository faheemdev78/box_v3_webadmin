'use client'

import { __error } from "@_/lib/consoleHelper";
import moment from "moment";

export const moveToErrorPosition = (errors) => {
    // if (!props.moveOnError) return;
    let keys = Object.keys(errors);

    // var section = document.querySelector(`input[name='${keys[0]}']`);
    var section = document.querySelector(`*[name='${keys[0]}']`);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


function is_url(string) {
    var res = string.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};

// moment().isSameOrAfter
// moment().isSameOrBefore
export const rules = {
    required: value => (((value || value === 0) && (value != null && value != "null")) ? undefined : 'Required'),

    isNumber: value => (isNaN(value) ? 'Must be a number' : undefined),

    minValue: min => value => (isNaN(value) || value >= min ? undefined : `Should be greater than ${min}`),
    maxValue: max => value => isNaN(value) || value <= max ? undefined : `Should be less than ${max}`,

    minChar: min => value => value.length < min ? `Should be atleast ${min} charactors` : undefined,
    maxChar: max => value => value.length > max ? `Should be maximum ${max} charactors` : undefined,

    isEqual: (val, msg) => value => val != value ? (msg || `Invalid!`) : undefined,
    
    // func: (_function, msg) => value => _function() ? (msg || `Invalid!`) : undefined,
    bol: (val, msg) => value => !(val===true) ? (msg || `Invalid!`) : undefined,
    func: (val, msg) => value => !(val===true) ? (msg || `Invalid!`) : undefined,
    // func: (_function, msg) => _function() ? (msg || `Invalid!`) : undefined,
    // func: (func, msg) => val==false ? (msg || `Invalid!`) : undefined,

    nospace: value => String(value).match(/\s/g) ? "Space characters are not allowed" : undefined,

    is_url: value => !is_url(value) ? "Invalid url" : undefined,

    isEmail: value => String(value).match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,5})+$/g) ? undefined : "Invalid email address",

    fieldName: (value) => {
        // console.log("fieldName: ", value);
        return undefined;
    },
}

/***
 * composeValidators(rules.required, rules.isNumber, rules.minValue(18))
 */
// export const composeValidators = (...validators) => value => validators?.reduce((error, validator) => error || validator(value), undefined)
// export const composeValidatorsArray = (validators) => value => validators?.reduce((error, validator) => error || validator(value), undefined)
export const composeValidators = (...validators) => value => {
    // console.log("validators: ", validators)

    let result;
    try {
        result = validators?.reduce((error, validator) => error || validator(value), undefined)
    } catch (error) {
        console.log(__error("Validation Error 1: "), error)        
    }
    return result;
}
export const composeValidatorsArray = (validators) => value => {
    // console.log("validators: ", validators)
    
    let result;
    try {
        result = validators?.reduce((error, validator) => error || validator(value), undefined)
    } catch (error) {
        console.log(__error("Validation Error 2: "), error)        
    }
    return result;
}
