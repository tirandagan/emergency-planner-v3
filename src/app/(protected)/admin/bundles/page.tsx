import { getBundles, getMasterItems, getProducts } from "./actions";
import { getSuppliers } from "../suppliers/actions";
import { getCategoryTree } from "@/app/actions/categories";
import BundlesClient from "./page.client";

export default async function BundlesPage() {
    const [bundles, categories, masterItems, products, suppliers] = await Promise.all([
        getBundles(),
        getCategoryTree(),
        getMasterItems(),
        getProducts(),
        getSuppliers()
    ]);

    return <BundlesClient
        bundles={bundles || []}
        categories={categories || []}
        masterItems={masterItems || []}
        products={products || []}
        suppliers={suppliers || []}
    />;
}
