'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, FileCheck, AlertCircle } from 'lucide-react';
import { bulkCreateContacts } from './actions';

type ImportStep = 'upload' | 'map' | 'processing' | 'result';

const SYSTEM_FIELDS = [
    { label: 'Do not import', value: '' },
    { label: 'Email Address', value: 'email' },
    { label: 'First Name', value: 'first_name' },
    { label: 'Last Name', value: 'last_name' },
    { label: 'Company Name', value: 'company' },
    { label: 'Phone Number', value: 'phone' },
];

export function ImportContactsDialog() {
    const [step, setStep] = useState<ImportStep>('upload');
    const [open, setOpen] = useState(false);
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
    const [stats, setStats] = useState<{ total: number; success: number; failed: number }>({ total: 0, success: 0, failed: 0 });
    const { toast } = useToast();

    // Reset on open
    const handleOpenChange = (val: boolean) => {
        setOpen(val);
        if (val) {
            setStep('upload');
            setCsvData([]);
            setFieldMapping({});
        }
    };

    // 1. Dropzone Logic
    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const headers = results.meta.fields || [];
                    setCsvHeaders(headers);
                    setCsvData(results.data);

                    // Auto-guess mapping
                    const initialMap: Record<string, string> = {};
                    headers.forEach(h => {
                        const lower = h.toLowerCase();
                        if (lower.includes('email')) initialMap[h] = 'email';
                        else if (lower.includes('first') && lower.includes('name')) initialMap[h] = 'first_name';
                        else if (lower.includes('last') && lower.includes('name')) initialMap[h] = 'last_name';
                        else if (lower.includes('company')) initialMap[h] = 'company';
                        else if (lower.includes('phone')) initialMap[h] = 'phone';
                        else initialMap[h] = '';
                    });
                    setFieldMapping(initialMap);
                    setStep('map');
                },
                error: (error) => {
                    toast({ title: "Parse Error", description: error.message, variant: "destructive" });
                }
            });
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1
    });

    // 2. Import Logic
    const handleImport = async () => {
        setStep('processing');

        // Transform Data
        const normalizedContacts = csvData.map(row => {
            const mapped: any = {};
            Object.entries(fieldMapping).forEach(([header, sysField]) => {
                if (sysField) {
                    mapped[sysField] = row[header];
                }
            });
            return mapped;
        });

        try {
            const res = await bulkCreateContacts(normalizedContacts);
            setStats(res);
            setStep('result');
            toast({ title: "Import Complete", description: `Processed ${res.total} contacts.` });
        } catch (error: any) {
            toast({ title: "Import Failed", description: error.message, variant: "destructive" });
            setStep('map'); // Go back
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import CSV</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        {step === 'upload' && "Upload a CSV file to bulk add contacts."}
                        {step === 'map' && "Map your CSV columns to AutoMail fields."}
                        {step === 'processing' && "Importing contacts..."}
                        {step === 'result' && "Import Summary"}
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'}
                        `}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground">Drag & drop a CSV here, or click to select</p>
                    </div>
                )}

                {step === 'map' && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4 font-semibold text-sm mb-2">
                            <div>CSV Header</div>
                            <div>System Field</div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                            {csvHeaders.map(header => (
                                <div key={header} className="grid grid-cols-2 gap-4 items-center">
                                    <div className="text-sm truncate" title={header}>{header}</div>
                                    <Select
                                        value={fieldMapping[header] || ''}
                                        onValueChange={(val) => setFieldMapping(prev => ({ ...prev, [header]: val }))}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Skip" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SYSTEM_FIELDS.map(f => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-10 text-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">This may take a moment...</p>
                    </div>
                )}

                {step === 'result' && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-muted p-3 rounded-lg">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            <div className="bg-green-500/10 text-green-600 p-3 rounded-lg">
                                <div className="text-2xl font-bold">{stats.success}</div>
                                <div className="text-xs">Success</div>
                            </div>
                            <div className="bg-red-500/10 text-red-600 p-3 rounded-lg">
                                <div className="text-2xl font-bold">{stats.failed}</div>
                                <div className="text-xs">Failed</div>
                            </div>
                        </div>
                        {stats.failed > 0 && (
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs flex gap-2 items-start">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    {stats.failed} rows were skipped due to invalid data (usually missing email).
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {step === 'map' && (
                        <Button onClick={handleImport}>Start Import</Button>
                    )}
                    {step === 'result' && (
                        <Button onClick={() => setOpen(false)}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
