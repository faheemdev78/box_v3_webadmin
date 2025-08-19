import { UserRightsArray } from '@_/configs';
import { __error, __warning, __yellow, __success, __green } from './consoleHelper';

const isDevelopment = false; //process.env.NODE_ENV == "development";

export const security = {
    verifyModule: (requiredPermissions, userPermissions) => {
        if (userPermissions === "*") return true;

        if (!userPermissions){
            console.trace(__error("verifyModule() missing userPermissions String"), { requiredPermissions, userPermissions })
            return false;
        }

        let permissionsStr = `,${userPermissions}`;
        if (permissionsStr.includes(`,${requiredPermissions}.`)) return true;
    
        if (isDevelopment) console.trace(__warning("verifyModule() FAIL"), { requiredPermissions, permissions: permissionsStr })
        return false;
    },
    
    verifyRole: (requiredPermissions, userPermissions) => {
        if (userPermissions === "*") return true;
        
        if (!userPermissions) {
            console.trace(__error("verifyRole() missing permissions String"), { requiredPermissions, userPermissions })
            return false;
        }

        let thisPerm = UserRightsArray.find(o => (o.rules.find(oo => oo.key == requiredPermissions)))
        if (!thisPerm) return false;

        let req_perms = requiredPermissions.indexOf(",") > -1 ? requiredPermissions.split(",") : [requiredPermissions];
        let permissionsStr = `,${userPermissions},`;
        if (isDevelopment) console.log({ permissions: permissionsStr })
    
        // let found = req_perms.includes(o => permissionsStr.includes(`,${o}`));
        let found = req_perms.find(o => (permissionsStr.includes(`,${o}`)));
        if (isDevelopment && !found) {
            console.trace(__warning("verifyRole() FAIL"), { requiredPermissions, permissions: permissionsStr })
        }

        return !!(found);
    },

}

export default security;


export function filterPermissions(arr, session) {
    let permissions = (session && session?.user?.permissions) || "";

    return arr.filter(o => {
        if (o.modulePermessions && !security.verifyModule(o.modulePermessions, permissions)) return false;
        if (o.rolePermessions && !security.verifyRole(o.rolePermessions, permissions)) return false;
        return true;
    }).map(o=>{
        return {
            ...o,
            children: o.children && filterPermissions(o.children, session)
        };
    })
}