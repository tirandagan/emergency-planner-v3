import { useState, useEffect } from "react";
import { createMasterItem, updateMasterItem } from "../actions";
import { InputGroup, TextInput, TextArea } from "./ProductFormElements";
import TagSelector from "./TagSelector";
import { TIMEFRAMES, DEMOGRAPHICS, LOCATIONS, SCENARIOS } from "../constants";

interface MasterItem {
    id: string;
    name: string;
    categoryId: string;
    description: string | null;
    timeframes: string[] | null;
    demographics?: string[] | null;
    locations?: string[] | null;
    scenarios?: string[] | null;
}

export default function MasterItemModal({
    isOpen,
    onClose,
    onCreated,
    onUpdated,
    selectedCategoryId,
    selectedCategoryName,
    itemToEdit = null
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (item: any) => void;
    onUpdated?: (item: any) => void;
    selectedCategoryId: string | null;
    selectedCategoryName: string;
    itemToEdit?: MasterItem | null;
}) {
    const [timeframes, setTimeframes] = useState<string[]>([]);
    const [demographics, setDemographics] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [scenarios, setScenarios] = useState<string[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Sync state when itemToEdit changes or modal opens
    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setName(itemToEdit.name || "");
                setDescription(itemToEdit.description || "");
                setTimeframes(itemToEdit.timeframes || []);
                setDemographics(itemToEdit.demographics || []);
                setLocations(itemToEdit.locations || []);
                setScenarios(itemToEdit.scenarios || []);
            } else {
                setName("");
                setDescription("");
                setTimeframes([]);
                setDemographics([]);
                setLocations([]);
                setScenarios([]);
            }
        }
    }, [isOpen, itemToEdit]);

    if (!isOpen) return null;

    const isEditing = !!itemToEdit;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-3xl shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-foreground mb-1">
                    {isEditing ? 'Edit Master Item' : 'Create New Master Item'}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                    {isEditing ? (
                        <>Editing in: <span className="text-primary font-mono">{selectedCategoryName}</span></>
                    ) : (
                        <>Adding to: <span className="text-primary font-mono">{selectedCategoryName}</span></>
                    )}
                </p>

                <form action={async (formData) => {
                    try {
                        if (isEditing) {
                            formData.append('id', itemToEdit.id);
                            const updatedItem = await updateMasterItem(formData);
                            if (updatedItem && onUpdated) {
                                onUpdated(updatedItem);
                            }
                        } else {
                            const categoryId = formData.get('category_id') as string;
                            if (!categoryId) throw new Error("No category selected");
                            
                            const newItem = await createMasterItem(formData);
                            if (newItem && onCreated) {
                                onCreated(newItem);
                            }
                        }
                        
                        onClose();
                        // Reset state handled by effect
                    } catch (e) {
                        console.error(e);
                        alert(`Failed to ${isEditing ? 'update' : 'create'} master item`);
                    }
                }} className="space-y-6">
                    <input type="hidden" name="category_id" value={selectedCategoryId || (itemToEdit?.categoryId || '')} />
                    
                    {/* Hidden Inputs for Tags */}
                    {timeframes.map(t => <input key={t} type="hidden" name="timeframes" value={t} />)}
                    {demographics.map(t => <input key={t} type="hidden" name="demographics" value={t} />)}
                    {locations.map(t => <input key={t} type="hidden" name="locations" value={t} />)}
                    {scenarios.map(t => <input key={t} type="hidden" name="scenarios" value={t} />)}

                    <div className="space-y-4">
                        <InputGroup label="Master Item Name" required>
                            <TextInput 
                                name="name" 
                                placeholder="e.g. Ultralight Backpack" 
                                required 
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </InputGroup>
                        <InputGroup label="Description">
                            <TextArea 
                                name="description" 
                                placeholder="General description of this type of item..." 
                                style={{ minHeight: '80px' }} 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-border">
                         <h3 className="text-sm font-bold text-foreground">Default Tags</h3>
                         <p className="text-xs text-muted-foreground -mt-3 mb-4">
                             {isEditing
                                ? "Updating tags will change defaults for new products, but existing products won't be auto-updated unless you bulk edit them."
                                : "Products created under this Master Item will inherit these tags."
                             }
                         </p>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TagSelector 
                                label="Timeframe"
                                options={TIMEFRAMES}
                                selected={timeframes}
                                onChange={(val) => setTimeframes(val || [])}
                                field="timeframes"
                            />
                            <TagSelector 
                                label="Location"
                                options={LOCATIONS}
                                selected={locations}
                                onChange={(val) => setLocations(val || [])}
                                field="locations"
                            />
                            <TagSelector 
                                label="Demographics"
                                options={DEMOGRAPHICS}
                                selected={demographics}
                                onChange={(val) => setDemographics(val || [])}
                                field="demographics"
                            />
                             <TagSelector 
                                label="Scenario"
                                options={SCENARIOS}
                                selected={scenarios}
                                onChange={(val) => setScenarios(val || [])}
                                field="scenarios"
                            />
                         </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-6 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                        <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20">
                            {isEditing ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
