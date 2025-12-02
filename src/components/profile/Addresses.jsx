import React from "react";
import { Plus, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADDRESSES = [
    { id: 1, type: "Home", name: "Jane Doe", address: "123, Palm Grove Heights, Sector 45", city: "Gurgaon", state: "Haryana", zip: "122003", phone: "+91 98765 43210", default: true },
    { id: 2, type: "Work", name: "Jane Doe", address: "Cevonne HQ, 5th Floor, Cyber City", city: "Gurgaon", state: "Haryana", zip: "122002", phone: "+91 98765 43210", default: false },
];

export default function Addresses() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-[var(--primary)]">Saved Addresses</h1>
                <Button className="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-700)]">
                    <Plus className="mr-2 h-4 w-4" /> Add New
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {ADDRESSES.map((addr) => (
                    <div key={addr.id} className="relative p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] transition-colors group">
                        {addr.default && (
                            <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-[var(--secondary-100)] text-[10px] font-bold uppercase tracking-wider text-[var(--secondary-400)]">
                                Default
                            </span>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="h-5 w-5 text-[var(--muted-foreground)]" />
                            <span className="font-semibold text-[var(--primary)]">{addr.type}</span>
                        </div>
                        <div className="space-y-1 text-sm text-[var(--muted-foreground)]">
                            <p className="font-medium text-[var(--primary)]">{addr.name}</p>
                            <p>{addr.address}</p>
                            <p>{addr.city}, {addr.state} - {addr.zip}</p>
                            <p className="pt-2">{addr.phone}</p>
                        </div>
                        <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="outline" size="sm" className="rounded-full border-[var(--border)] text-[var(--primary)]">
                                <Pencil className="mr-2 h-3 w-3" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-full text-[var(--destructive)] hover:bg-rose-50">
                                <Trash2 className="mr-2 h-3 w-3" /> Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
