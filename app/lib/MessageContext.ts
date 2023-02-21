import { createContext } from 'react';

const initialNewMessages = [];

const MessageContext = createContext(initialNewMessages);

export default MessageContext;