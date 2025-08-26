/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmailSend = {
    to_emails: Array<string>;
    subject: string;
    from_email?: (string | null);
    reply_to?: (string | null);
    html_content: string;
    text_content?: (string | null);
};

