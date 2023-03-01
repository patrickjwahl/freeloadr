'use client'

import { ChangeEventHandler, useRef, useState } from 'react';
import styles from '../Messages.module.scss';

export default function ChatBox({ sendMessage }: { sendMessage: (message: string) => void }) {
    const [ text, setText ] = useState('');

    const growWrap = useRef(null);

    const textChanged: ChangeEventHandler<HTMLTextAreaElement> = e => {
        setText(e.target.value);
        e.target.parentNode.dataset.replicatedValue = e.target.value;
    };

    const handleSendClicked = () => {
        sendMessage(text);
        growWrap.current.dataset.replicatedValue = '';
        setText('');
    };

    const handleKeyUp = e => {
        if (e.which == 13) {
            handleSendClicked();
        }
    };

    return (
        <div className={styles.chatBoxContainer}>
            <div ref={growWrap} className={styles.growWrap}>
                <textarea onKeyUp={handleKeyUp} rows={1} id='text' value={text} onChange={textChanged} placeholder='Write a message...' />
            </div>
            <div onClick={handleSendClicked} className={styles.buttonWrap}>
                <span className='material-symbols-outlined'>send</span>
            </div>
        </div>
    );
}