import { adminRoot } from "@_/configs";
import { redirect } from "next/navigation";

export default async function OrdersHome() {
    redirect(`${adminRoot}/orders/list`);
}