/**
 * Email Processing Utilities
 * 
 * Shared logic for email content processing, variable substitution, and sanitization.
 */

export interface EmailVariables {
    [key: string]: string | undefined;
}

export interface VariableFallbacks {
    [key: string]: string;
}

export const DEFAULT_FALLBACKS: VariableFallbacks = {
    first_name: 'Friend',
    last_name: 'Subscriber',
    email: 'subscriber@example.com',
    company: 'Your Company',
    plan_tier: 'Pro',
};

/**
 * Replaces variables in email content (e.g., {{first_name}}) with provided values or fallbacks.
 * 
 * @param content - The raw HTML/Text content with {{variables}}
 * @param variables - Map of variable names to values (e.g., { first_name: 'Matt' })
 * @param fallbacks - Optional map of custom fallbacks (defaults provided)
 * @returns Processed content with variables replaced
 */
export function processEmailContent(
    content: string,
    variables: EmailVariables,
    fallbacks: VariableFallbacks = {}
): string {
    if (!content) return '';

    // Merge custom fallbacks with defaults
    const activeFallbacks = { ...DEFAULT_FALLBACKS, ...fallbacks };

    // Normalize variables (ensure no null/undefined values leak into regex)
    const safeVariables: EmailVariables = {};
    Object.keys(variables).forEach(key => {
        safeVariables[key] = variables[key] ?? undefined;
    });

    // Replace standard pattern {{ key }}
    let processed = content.replace(/{{([\w_.]+)}}/g, (match, key) => {
        // Handle "contact.first_name" -> "first_name" mapping if needed
        const lookupKey = key.startsWith('contact.') ? key.replace('contact.', '') : key;

        const variableValue = safeVariables[lookupKey] || safeVariables[key];
        const fallbackValue = activeFallbacks[lookupKey] || activeFallbacks[key];

        // 1. Use variable if it exists and is not empty string
        if (variableValue !== undefined && variableValue !== null && variableValue.trim() !== '') {
            return variableValue;
        }

        // 2. Use fallback if it exists
        if (fallbackValue !== undefined) {
            return fallbackValue;
        }

        // 3. Return generic variable name text if no replacement found
        return '';
    });

    return processed;
}

/**
 * Extract distinct variables used in a template
 */
export function extractVariables(content: string): string[] {
    const matches = content.match(/{{([\w_]+)}}/g);
    if (!matches) return [];

    // Clean brackets and deduplicate
    return Array.from(new Set(matches.map(m => m.replace('{{', '').replace('}}', ''))));
}
