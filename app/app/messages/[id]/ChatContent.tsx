'use client'

import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { Conversation, Message, UIMessage } from '../../../lib/types';
import { DeleteNewMessageContext, MessageContext } from '../../MessageContext';
import styles from '../Messages.module.scss';
import ChatBox from './ChatBox';
import MessagesContent from './MessagesContent';

export default function ChatContent({ conversation, messages, thumbnail, sessionData, apiDomain }: { 
    conversation: Conversation, messages: Array<Message>, thumbnail: string, sessionData: Session, apiDomain: string }) {

        const [ allMessages, setAllMessages ] = useState<Array<Message>>([...messages]);
        const [ numNewMessages, setNumNewMessages ] = useState(1);

        const clientSession = useSession();
        const session = clientSession.status === 'loading' ? sessionData : clientSession.data;

        const myListing = session.user.id != conversation.asker.id;
        const displayName = !myListing ? conversation.listing.owner.name : conversation.asker.name;

        const newMessages = useContext(MessageContext);
        const deleteNewMessages = useContext(DeleteNewMessageContext);

        const sendMessage = message => {
            const newMessage: Message = {
                content: message,
                sent_at: new Date(),
                sender_id: session.user.id,
                conversation_id: conversation.id,
                id: Math.floor(Math.random() * 1000000)
            }

            setNumNewMessages(numNewMessages + 1);
            setAllMessages([newMessage, ...allMessages]);

            const payload = {
                content: newMessage.content,
                sentAt: newMessage.sent_at,
                listingId: conversation.listing.id,
                askerId: conversation.asker.id
            }; 

            fetch(`${apiDomain}/message`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
        };

        useEffect(() => {
            let messagesToAdd = [];
            let idsToDelete = [];
            const allMessageIds = allMessages.map(message => message.id);
            newMessages.forEach(message => {
                if (message.conversation_id === conversation.id) {
                    if (!allMessageIds.includes(message.id) && message.id > 0) {
                        messagesToAdd.push(message);
                    }

                    idsToDelete.push(message.id);
                }
            });
            setAllMessages([...messagesToAdd, ...allMessages]);
            
            if (idsToDelete.length > 0) deleteNewMessages(idsToDelete);

        }, [newMessages]);

        return (
            <div className={styles.chatContainer}>
                <div className={styles.conversationInfo}>
                    <div className={styles.thumbnailContainer}>
                        <Image alt="Thumbnail image" src={thumbnail} fill className={styles.thumbnail} />
                    </div>
                    <div className={styles.conversationHeader}>
                        <h2>Chatting with {displayName}</h2>
                        <div>Regarding {myListing ? 'your' : 'their'} listing <Link href={`/listing/${conversation.listing.id}`}>{conversation.listing.title}</Link></div>
                    </div>
                </div>
                <MessagesContent messages={allMessages} sessionData={sessionData} />
                <ChatBox sendMessage={sendMessage} />
            </div>
        );
}