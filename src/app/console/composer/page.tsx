'use client'

import { adminRoot } from "@_/configs";
import { PageBar, PageHeader } from "@_/template";

function ComposerHome(props) {

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
