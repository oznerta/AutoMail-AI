export type AutomationQueueItem = {
    id: string;
    automation_id: string;
    contact_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    execute_at: string;
    payload: any;
    error_message?: string;
    created_at: string;
    updated_at: string;
};
