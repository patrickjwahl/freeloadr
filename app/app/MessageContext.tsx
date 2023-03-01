'use client'

import { Context, createContext, ReactNode, useEffect, useState } from 'react';
import { Message, Conversation } from '../lib/types';
import { io } from 'socket.io-client';
import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

const initialNewMessages = [];
export const MessageContext: Context<Array<Message>> = createContext(initialNewMessages);
export const DeleteNewMessageContext: Context<(ids: Array<number>) => void> = createContext(null);

export default function MessageContextProvider({ sessionData, apiDomain, children }: { sessionData: Session, apiDomain: string, children: ReactNode}) {

    const [ newMessages, setNewMessages ] = useState<Array<Message>>(initialNewMessages);
    const [ socket, setSocket ] = useState(null);

    const deleteNewMessage = (ids: Array<number>) => {
        const messagesWithDelete = newMessages.filter(message => !ids.includes(message.id));
        setNewMessages(messagesWithDelete);
    };

    const clientSession = useSession();
    const session = clientSession.status === 'loading' ? sessionData : clientSession.data;

    useEffect(() => {

        if (!session || clientSession.status === 'unauthenticated') return;

        const getUnreadMessages = async () => {
            const res = await fetch(`${apiDomain}/conversations/unread`, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            const data = await res.json();

            if (data.code == 'OK') {
                const newMessagesFromConversations: Array<Message> = data.conversations.map((conversation: Conversation) => {
                    return {
                        content: conversation.last_message_text,
                        sent_at: conversation.last_modified,
                        conversation_id: conversation.id,
                        sender_id: (conversation.asker.id == session.user.id) ? conversation.listing.owner.id : conversation.asker.id,
                        id: -1 * Math.floor(Math.random() * 10000000)
                    };
                });

                setNewMessages(newMessagesFromConversations);                
            }
        };

        getUnreadMessages();

        const _socket = io(apiDomain, {
            extraHeaders: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        _socket.on('message', msg => {
            const newMessage: Message = {
                content: msg.content,
                sender_id: msg.sender_id,
                sent_at: msg.sent_at,
                conversation_id: msg.conversation_id,
                id: msg.id
            };

            setNewMessages([newMessage, ...newMessages]);
        });

        _socket.on('connect_error', () => {
            console.log('oh no a socket error');
        })

        setSocket(socket);
    }, [session]);

    return (
        <MessageContext.Provider value={newMessages}>
            <DeleteNewMessageContext.Provider value={deleteNewMessage}>
                {children}
            </DeleteNewMessageContext.Provider>
        </MessageContext.Provider>
    )
}



