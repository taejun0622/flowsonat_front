/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmailTemplate = {
    to_emails: Array<string>;
    subject: string;
    from_email?: (string | null);
    reply_to?: (string | null);
    template_name: string;
    context: Record<string, any>;
};

