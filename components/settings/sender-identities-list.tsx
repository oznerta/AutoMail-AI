'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addSenderIdentity, deleteSenderIdentity } from "@/app/(protected)/settings/actions";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SenderIdentitiesList({ senders, onUpdate }: { senders: any[], onUpdate?: () => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [senderToDelete, setSenderToDelete] = useState<string | null>(null);
    const { toast } = useToast();

    const handleAdd = async () => {
        if (!newName || !newEmail) return;
        setLoading(true);
        try {
            const res = await addSenderIdentity(newName, newEmail);
            if (res.error) {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Success", description: "Sender added successfully.", variant: "success" });
                setOpen(false);
                setNewName("");
                setNewEmail("");
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to add sender.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!senderToDelete) return;
        try {
            await deleteSenderIdentity(senderToDelete);
            toast({ title: "Deleted", description: "Sender removed." });
            setSenderToDelete(null);
            if (onUpdate) onUpdate();
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Sender Identities
                        </CardTitle>
                        <CardDescription>
                            Manage the "From" addresses used in your automations.
                        </CardDescription>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Sender
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Sender Identity</DialogTitle>
                                <DialogDescription>
                                    Add an email address to send from. You must verify the domain in your Resend dashboard first.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Sender Name</Label>
                                    <Input placeholder="e.g. Matt from AutoMail" value={newName} onChange={e => setNewName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Sender Email</Label>
                                    <Input placeholder="matt@myverifieddomain.com" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleAdd} disabled={loading}>
                                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Verify & Add
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {senders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                    No senders configured. Add one to start sending emails.
                                </TableCell>
                            </TableRow>
                        ) : (
                            senders.map((sender) => (
                                <TableRow key={sender.id}>
                                    <TableCell className="font-medium">{sender.name}</TableCell>
                                    <TableCell>{sender.email}</TableCell>
                                    <TableCell>
                                        {sender.verified ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setSenderToDelete(sender.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                <AlertDialog open={!!senderToDelete} onOpenChange={(open) => !open && setSenderToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Sender?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove this sender identity. You will not be able to send emails from this address until you add it again.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                                Remove Sender
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
