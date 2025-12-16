import { getProducts, getMasterItems, getCategories, getSuppliers } from "./actions";
import ProductsClient from "./page.client";

// Force rebuild
export default async function ProductsPage() {
    const [products, masterItems, categories, suppliers] = await Promise.all([
        getProducts(),
        getMasterItems(),
        getCategories(),
        getSuppliers()
    ]);

    return <ProductsClient 
        products={products || []} 
        masterItems={masterItems || []} 
        categories={categories || []} 
        suppliers={suppliers || []}
    />;
}
