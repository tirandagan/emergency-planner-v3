import { useState } from "react";
import { Plus } from "lucide-react";
import { createSupplier } from "../../suppliers/actions";
import { InputGroup, TextInput, SelectInput } from "./ProductFormElements";

export default function SupplierModal({ 
    isOpen, 
    onClose, 
    onCreated 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onCreated: (supplier: any) => void; 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-foreground mb-4">Create New Supplier</h2>
                <form action={async (formData) => {
                    try {
                        const newSupplier = await createSupplier(formData);
                        if (newSupplier) {
                            onCreated(newSupplier);
                        }
                        onClose();
                    } catch (e) {
                        console.error(e);
                        alert("Failed to create supplier");
                    }
                }} className="space-y-4">
                    <InputGroup label="Name" required>
                        <TextInput name="name" required />
                    </InputGroup>
                    <InputGroup label="Website URL">
                        <TextInput name="website_url" type="url" />
                    </InputGroup>
                     <InputGroup label="Fulfillment Type">
                        <SelectInput name="fulfillment_type">
                            <option value="affiliate">Affiliate Partner</option>
                            <option value="dropship">Drop-Ship Vendor</option>
                        </SelectInput>
                    </InputGroup>
                    <InputGroup label="Contact Email">
                        <TextInput name="email" type="email" />
                    </InputGroup>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors">
                            Create Supplier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



















