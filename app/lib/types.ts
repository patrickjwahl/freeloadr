import { DefaultSession } from "next-auth";

export interface Person {
    id: number;
    email: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export interface Listing {
    id: number;
    title: string;
    description: string;
    owner: Person;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    sent_at: Date;
}

export interface UIMessage extends Message {
    isNew: boolean
}

export interface Conversation {
    id: number;
    listing: Listing;
    asker: Person;
    last_modified: Date;
    last_message_text: string;
}

export interface Session extends DefaultSession {
    access_token: string;
    user: Person;
}