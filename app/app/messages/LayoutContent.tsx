'use client'

import { useLayoutEffect, useState } from "react";
import ConversationBar from "./ConversationBar"
import styles from './Messages.module.scss';

export default function LayoutContent({ conversations, images, sessionData, children }) {

    return (
        <div className={styles.layoutContainer}>
            <ConversationBar conversations={conversations} images={images} sessionData={sessionData} />
            {children}
        </div>
    );
}