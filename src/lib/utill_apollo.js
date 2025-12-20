import { __error } from "./consoleHelper";

/* USAGE
    .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.user }))
*/
export function checkApolloRequestErrors({ results, allowEmpty = false, parseReturn }){
    // console.log("checkApolloRequestErrors()", { results })
    
    if (!results && allowEmpty) return results;
    if (!results) return { error: { message:"Invalid or empty results!" } }

    if (results.error){
        if (results?.error?.cause?.result?.errors) return { error: { message: results.error.cause.result.errors.map(r => (r.message)) } }
        return results;
    }

    return parseReturn ? parseReturn(results) : results;
}



export function catchApolloError(err) {
    if (err.name == 'AbortError') return;

    console.log(__error("catchApolloError: "))
    console.error(err)

    return { error: { message: err.message || "Communication error" }}
}


