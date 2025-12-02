import React from "react";
import { Button } from "@/components/ui/button";

export default function Settings() {
    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-[var(--primary)]">Account Settings</h1>

            <div className="space-y-6 max-w-xl">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--primary)]">Personal Information</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">First Name</label>
                            <input type="text" defaultValue="Jane" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">Last Name</label>
                            <input type="text" defaultValue="Doe" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">Email Address</label>
                            <input type="email" defaultValue="jane@example.com" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">Phone Number</label>
                            <input type="tel" defaultValue="+91 98765 43210" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                    </div>
                    <Button className="rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-700)]">
                        Save Changes
                    </Button>
                </div>

                <div className="pt-6 border-t border-[var(--border)] space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--primary)]">Change Password</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">Current Password</label>
                            <input type="password" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--muted-foreground)]">New Password</label>
                            <input type="password" className="w-full rounded-lg border border-[var(--border)] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]" />
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-full border-[var(--border)] text-[var(--primary)] hover:bg-[var(--accent)]">
                        Update Password
                    </Button>
                </div>
            </div>
        </div>
    );
}
