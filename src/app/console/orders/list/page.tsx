import OrdersListClient from "./OrdersListClient";

type PageProps = {
    params?: Promise<Record<string, string>>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
    searchFilterConfig?: unknown;
};

async function ProductsListPage(props: PageProps) {
    const searchParams = props.searchParams ? await props.searchParams : undefined;

    return (
        <OrdersListClient
            searchParams={searchParams}
            searchFilterConfig={props.searchFilterConfig}
        />
    );
}

export default ProductsListPage;
