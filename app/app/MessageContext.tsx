'use client'

import { Context, createContext, ReactNode, useState } from 'react';
import { Message } from '../lib/types';

const initialNewMessages = [];
const Context: Context<Array<Message>> = createContext(initialNewMessages);

export default function MessageContext({ children }: { children: ReactNode}) {

    const [ newMessages, setNewMessages ] = useState<Array<Message>>(initialNewMessages);

    return <Context.Provider value={newMessages}>{children}</Context.Provider>
}



