
export default function FirstAutomationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="scroll-m-20 text-3xl font-bold tracking-tight">Your First Automation</h1>
                <p className="text-lg text-muted-foreground">
                    Learn how to build a simple &quot;Welcome Email&quot; workflow for new contacts.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Create a New Automation</h2>
                <p>
                    Navigate to the <strong>Automations</strong> tab and click &quot;New Automation&quot;. Give it a name like &quot;Welcome Series&quot;.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Choose a Trigger</h2>
                <p>
                    Click on the trigger node and select <strong>Contact Added</strong>. This means the automation will start whenever a new person is added to your contacts list.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. Add an Email Step</h2>
                <p>
                    Click the (+) button to add a step. Choose <strong>Send Email</strong>.
                    Select your Sender Identity and an Email Template.
                </p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">4. Activate</h2>
                <p>
                    Toggle the status from &quot;Draft&quot; to &quot;Active&quot; in the top right corner. Your automation is now live!
                </p>
            </div>
        </div>
    )
}
