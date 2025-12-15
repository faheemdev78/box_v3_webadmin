'use client'

import Link from "next/link";
import { adminRoot } from "@/configs";
import { PageHeader } from "@/template";
import { Button } from "@/components";


function ComponentsHome() {
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
