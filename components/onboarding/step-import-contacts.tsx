'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, FileCheck, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { bulkCreateContacts } from "@/app/(protected)/contacts/actions"; // Reuse action
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface StepImportContactsProps {
    onNext: () => void;
    onSkip: () => void;
}

export function StepImportContacts({ onNext, onSkip }: StepImportContactsProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [fileStats, setFileStats] = useState<{ total: number } | null>(null);
    const [progress, setProgress] = useState(0);

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setProgress(10); // Start progress

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                setProgress(40); // Parse done
                const contacts = results.data;
                const total = contacts.length;

                // Simple normalization - try to find 'email' field
                // This is a simplified version of the full importer for onboarding friction reduction
                const validContacts = contacts.map((c: any) => {
                    // Try to find email key case-insensitive
                    const emailKey = Object.keys(c).find(k => k.toLowerCase().includes('email'));
                    const nameKey = Object.keys(c).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('first'));

                    if (!emailKey) return null;

                    return {
                        email: c[emailKey],
                        first_name: nameKey ? c[nameKey] : '',
                        last_name: '', // simplified
                        company: '',
                        phone: ''
                    }
                }).filter(Boolean);

                if (validContacts.length === 0) {
                    toast({ title: "No valid contacts found", description: "Could not find an 'email' column.", variant: "destructive" });
                    setIsUploading(false);
                    return;
                }

                setProgress(60); // Processing

                try {
                    await bulkCreateContacts(validContacts);
                    setProgress(100);
                    setFileStats({ total: validContacts.length });
                    toast({ title: "Import Successful", description: `Imported ${validContacts.length} contacts.` });
                } catch (error: any) {
                    toast({ title: "Import Failed", description: error.message, variant: "destructive" });
                } finally {
                    setIsUploading(false);
                }
            },
            error: (err) => {
                toast({ title: "Error parsing CSV", description: err.message, variant: "destructive" });
                setIsUploading(false);
            }
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
        disabled: isUploading || !!fileStats
    });

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">Import your contacts</h2>
                <p className="text-muted-foreground">
                    Upload a CSV to instantly populate your dashboard. <br />
                    <span className="text-xs opacity-70">Don't worry, you can do this later too.</span>
                </p>
            </div>

            {!fileStats ? (
                <div
                    {...getRootProps()}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer min-h-[300px]",
                        isDragActive ? "border-primary bg-primary/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30",
                        isUploading && "pointer-events-none opacity-50"
                    )}
                >
                    <input {...getInputProps()} />
                    {isUploading ? (
                        <div className="text-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            <div className="space-y-1">
                                <p className="font-medium">Importing contacts...</p>
                                <div className="h-2 w-48 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800 shadow-xl">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-lg">Click to upload CSV</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center">
                                or drag and drop your file here. <br />
                                (Must contain an "email" column)
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-green-500/5 rounded-2xl border border-green-500/20 min-h-[300px]">
                    <div className="h-20 w-20 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-green-500">Success!</h3>
                        <p className="text-muted-foreground">
                            Successfully imported {fileStats.total} contacts.
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1" onClick={onSkip}>
                    Skip for now
                </Button>
                <Button className="flex-1" onClick={onNext} disabled={isUploading}>
                    {fileStats ? "Continue" : "Continue"}
                </Button>
            </div>
        </div>
    );
}
