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
    conversationId: number;
    senderId: number;
    content: string;
    sentAt: Date;
}