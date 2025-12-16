import { getSuppliers } from "./actions";
import SuppliersClient from "./page.client";

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();
    return <SuppliersClient initialSuppliers={suppliers || []} />;
}



















