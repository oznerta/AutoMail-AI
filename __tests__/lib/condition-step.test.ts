/**
 * @jest-environment node
 */

describe('Conditional Workflow Step Logic', () => {
    function evaluateCondition(
        conditionConfig: {
            field: string;
            operator: string;
            value: string;
            then_action: any;
            else_action: any;
        },
        contact: {
            email?: string;
            tags?: string[];
            status?: string;
            company?: string;
        }
    ) {
        const field = conditionConfig.field || 'tag';
        const operator = conditionConfig.operator || 'has_tag';
        const targetValue = String(conditionConfig.value || '').trim();

        let matches = false;

        if (field === 'tag' || operator === 'has_tag') {
            const contactTags: string[] = Array.isArray(contact.tags) ? contact.tags : [];
            matches = contactTags.some((t: string) => t.toLowerCase() === targetValue.toLowerCase());
        } else if (field === 'status') {
            const contactStatus = String(contact.status || '');
            matches = operator === 'not_equals' ? contactStatus !== targetValue : contactStatus === targetValue;
        } else if (field === 'company') {
            const company = String(contact.company || '').toLowerCase();
            const val = targetValue.toLowerCase();
            matches = operator === 'contains' ? company.includes(val) : company === val;
        } else if (field === 'email') {
            const email = String(contact.email || '').toLowerCase();
            const val = targetValue.toLowerCase();
            matches = operator === 'contains' ? email.includes(val) : email === val;
        }

        return matches ? conditionConfig.then_action : conditionConfig.else_action;
    }

    it('should route to then_action when contact has matching tag', () => {
        const config = {
            field: 'tag',
            operator: 'has_tag',
            value: 'vip',
            then_action: { type: 'send_email', template_id: 'template_vip' },
            else_action: { type: 'add_tag', tag: 'regular' }
        };

        const contact = {
            email: 'sarah@example.com',
            tags: ['Lead', 'VIP', 'Newsletter']
        };

        const action = evaluateCondition(config, contact);
        expect(action).toEqual({ type: 'send_email', template_id: 'template_vip' });
    });

    it('should route to else_action when contact lacks matching tag', () => {
        const config = {
            field: 'tag',
            operator: 'has_tag',
            value: 'customer',
            then_action: { type: 'send_email', template_id: 'template_customer' },
            else_action: { type: 'add_tag', tag: 'non_customer' }
        };

        const contact = {
            email: 'john@example.com',
            tags: ['lead']
        };

        const action = evaluateCondition(config, contact);
        expect(action).toEqual({ type: 'add_tag', tag: 'non_customer' });
    });

    it('should evaluate status equality correctly', () => {
        const config = {
            field: 'status',
            operator: 'equals',
            value: 'active',
            then_action: { type: 'send_email', template_id: 'promo_email' },
            else_action: { type: 'none' }
        };

        expect(evaluateCondition(config, { status: 'active' })).toEqual({ type: 'send_email', template_id: 'promo_email' });
        expect(evaluateCondition(config, { status: 'unsubscribed' })).toEqual({ type: 'none' });
    });

    it('should evaluate company contains correctly', () => {
        const config = {
            field: 'company',
            operator: 'contains',
            value: 'tech',
            then_action: { type: 'add_tag', tag: 'tech_sector' },
            else_action: { type: 'add_tag', tag: 'general_sector' }
        };

        expect(evaluateCondition(config, { company: 'FinTech Global' })).toEqual({ type: 'add_tag', tag: 'tech_sector' });
        expect(evaluateCondition(config, { company: 'Retail Direct' })).toEqual({ type: 'add_tag', tag: 'general_sector' });
    });
});
