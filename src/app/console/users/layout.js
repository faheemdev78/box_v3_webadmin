'use client'
import { adminRoot } from "@_/configs"
import { PageBar } from "@_/template"

export default function Layout({ children }) {
    return (<>
        <div className='page-bar'>
            <PageBar menuArray={[
                { title: "Users", href: `${adminRoot}/users` },
                { title: "Permissions", href: `${adminRoot}/users/permissions` },
                { title: "Types", href: `${adminRoot}/users/user_types` },
            ]} />
        </div>

        {children}
    </>)
}
