'use client'

import { Session } from "next-auth";
import Link from "next/link";
import { Conversation, Message } from "../../lib/types";
import styles from './Messages.module.scss';
import cn from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSelectedLayoutSegment } from "next/navigation";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { MessageContext } from "../MessageContext";
dayjs.extend(relativeTime);

export default function ConversationBar({ conversations, images, sessionData }: { conversations: Array<Conversation>, images: Array<string>, sessionData: Session }) {

    const currentId = useSelectedLayoutSegment() ? parseInt(useSelectedLayoutSegment()) : null;
    const newMessages = useContext(MessageContext);
    const [updatedConversations, setUpdatedConversations] = useState(conversations);
    const [ unreadConvoIds, setUnreadConvoIds ] = useState([]);


    useEffect(() => {

        const newMessagesByConversation = newMessages.reduce((prev, curr) => {
            if (!prev.hasOwnProperty(curr.conversation_id)) {
                return {...prev, [curr.conversation_id]: curr}
            }
        }, {});

        let newUnreadConvoIds = [];

        let newUpdatedConversations = updatedConversations.map(conversation => {
            if (newMessagesByConversation.hasOwnProperty(conversation.id)) {
                const newConvo = {...conversation};
                newConvo.last_message_text = newMessagesByConversation[conversation.id].content;
                newConvo.last_modified = newMessagesByConversation[conversation.id].sent_at;
                newUnreadConvoIds.push(conversation.id);
                return newConvo;
            }

            return conversation;
        });

        newUpdatedConversations = newUpdatedConversations.sort((a, b) => (a.last_modified < b.last_modified) ? 1 : -1);

        setUpdatedConversations(newUpdatedConversations);
        setUnreadConvoIds(newUnreadConvoIds);

    }, [newMessages]);

    return (
        <div className={cn(styles.conversationsContainer, {[styles.hideConversations]: currentId != null})}>
            <>
            {updatedConversations.map((conversation, index) => {

                const myListing = sessionData.user.id != conversation.asker.id;
                const displayName = !myListing ? conversation.listing.owner.name : conversation.asker.name;
                const isActive = conversation.id == currentId;

                const lastMessageText = conversation.last_message_text.length > 20 ? `${conversation.last_message_text.substring(0, 20)}...` : conversation.last_message_text;

                return (
                    <Link key={index} href={`/messages/${conversation.id}`}>
                        <div className={cn(styles.conversationContainer, {[styles.activeConversation]: isActive, [styles.unreadConversation]: unreadConvoIds.includes(conversation.id)})}>
                            <div className={styles.thumbnailContainer}>
                                <Image alt="Thumbnail image" src={images[index]} fill className={styles.thumbnail} />
                            </div>
                            <div className={styles.textContainer}>
                                <h2>{conversation.listing.title} &#x2022; {displayName}</h2>
                                <div>{lastMessageText} &#x2022; {dayjs(conversation.last_modified).fromNow()} </div>
                            </div>
                            <div className={cn(styles.ballContainer, {[styles.unreadConversation]: unreadConvoIds.includes(conversation.id)})} />
                        </div>
                    </Link>
                );
            })}
            </>
        </div>
    );
}