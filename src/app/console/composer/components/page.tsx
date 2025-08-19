'use client'

import Link from "next/link";
import { adminRoot } from "@_/configs";
import { PageHeader } from "@_/template";
import { Button } from "@_/components";


function ComponentsHome(props) {
    return (<>
        <PageHeader title="Components">
            <Button color="orange" type="link"><Link href={`${adminRoot}/composer/components/create`}>Create new Component</Link></Button>
        </PageHeader>
    </>)
}

export default ComponentsHome;

// const mapStateToProps = (state) => {
//     return {
//         others: state.others
//     };
// }
// export default connect(mapStateToProps)(TestIndex);
