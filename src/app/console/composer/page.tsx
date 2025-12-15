'use client'

import { adminRoot } from "@/configs";
import { PageBar, PageHeader } from "@/template";

function ComposerHome() {

    return (<>
        <div className='page-bar'>
            <PageBar menuArray={[
                { title: 'Components', href: `${adminRoot}/composer/components` },
                { title: 'Pages', href: `${adminRoot}/composer/pages` },
            ]} />
        </div>

        <PageHeader title="Composer"></PageHeader>
        
    </>)
}

export default ComposerHome;
