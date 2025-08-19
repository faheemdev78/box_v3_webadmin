/* USAGE
    .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.user }))
*/

import { __error } from "./consoleHelper";

export function checkApolloRequestErrors({ results, allowEmpty = false, parseReturn }){
    if (!results && allowEmpty) return results;
    if (!results) return { error: { message:"Invalid or empty results!" } }

    if (results.error){
        if (results?.error?.cause?.result?.errors){
            return { error: { message: results.error.cause.result.errors.map(r => (r.message)) } }
        }

        return results;
    }

    // if (!results || results.error) return { error: { message: (results && results?.error?.message) || "Invalid or empty results!" } }
    if (results.errors) {
        // console.log(__error("results.errors: "), results.errors)
        return { error: { message: results.errors?.map(o => (o.message)) }}
    }

    return parseReturn ? parseReturn(results) : results;
}



export function catchApolloError(err) {
    // console.log("catchApolloError: ", Object.keys(err))
    // err.forEach(element => {
    //     console.log("element: ", element)
    // });

    // if(process.env.NODE_ENV=='development') 
    // console.log(__error("Error: "), err)
    console.log(__error("catchApolloError: "))
    console.error(err)
    alert("Communication Error: Unable to fetch user session! please check your internet connection.")
    return false;
}


