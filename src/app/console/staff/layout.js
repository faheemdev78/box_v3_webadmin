'use client'

function Layout({ children }) {
    return (<>
        {/* <div className='page-bar'>
            <PageBar menuArray={[
                { title: "Users", href: `${adminRoot}/users` },
                { title: "Permissions", href: `${adminRoot}/users/permissions` },
                { title: "Types", href: `${adminRoot}/users/user_types` },
            ]} />
        </div> */}

        {children}
    </>)
}

export default Layout
