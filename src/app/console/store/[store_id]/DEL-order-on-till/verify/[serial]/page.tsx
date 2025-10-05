import TillVerification from "@_/modules/orders/tillVerification";

export default async function TillVerificationPage({ params }) {
    const { serial } = await params;

    return <TillVerification serial={serial} />
}