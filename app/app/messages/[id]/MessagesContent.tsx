'use client'

import { Message, UIMessage } from "../../../lib/types";
import styles from '../Messages.module.scss';
import dayjs from "dayjs";
import cn from 'classnames';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { useSession } from "next-auth/react";
import React, { useEffect, useRef, useState } from "react";
import { Session } from "next-auth";
dayjs.extend(LocalizedFormat);

export default function MessagesContent({ messages, sessionData }: { messages: Array<Message>, sessionData: Session }) {

    const clientSession = useSession();
    const session = clientSession.status === 'loading' ? sessionData : clientSession.data;

    const sectionList: {[date: string]: Array<Message>} = {};
    const containerRef = useRef<HTMLDivElement>(null);

    messages.forEach(message => {
        const date = dayjs(message.sent_at).format('LL');
        if (sectionList.hasOwnProperty(date)) {
            sectionList[date].push(message);
        } else {
            sectionList[date] = [message];
        }
    });

    useEffect(() => {

        const handleScroll = () => {
            window.scrollTo(0, 0);
        };

        document.body.addEventListener('touchmove', handleScroll);
        document.body.addEventListener('resize', handleScroll);

        return () => {
            document.body.removeEventListener('touchmove', handleScroll);
            document.body.removeEventListener('resize', handleScroll);
        }
    }, []);

    useEffect(() => {
        containerRef.current.scrollTop = -1;
        setTimeout(() => {
            containerRef.current.scrollTop = 0;
        }, 1);
    }, [messages]);

    return (
        <div ref={containerRef} className={styles.messagesContainer}>
                {Object.keys(sectionList).map(date => {
                    return (
                        <React.Fragment key={date}>
                        {sectionList[date].map(message => {
                            return (
                                <div key={message.id} className={cn(styles.messageRow, {[styles.myMessage]: message.sender_id == session.user?.id})}>
                                    <div className={cn(styles.message)}>
                                        {message.content}
                                        <div>{dayjs(message.sent_at).format('LT')}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className={styles.sectionDate}>{date}</div>
                        </React.Fragment>
                    );
                })}
        </div>
    );
}