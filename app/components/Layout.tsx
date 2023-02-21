import { useState } from "react";
import MessageContext from "../lib/MessageContext";
import Navbar from "./Navbar";

const Layout = ({ children }) => {

    const [ newMessages, setNewMessages ] = useState([]);

    const [ sidecarOpen, setSidecarOpen ] = useState(false);
    const toggleSidecarOpen = () => {
        setSidecarOpen(!sidecarOpen);
    };

    return (
        <MessageContext.Provider value={newMessages}>
            <Navbar sidecarOpen={sidecarOpen} toggleSidecarOpen={toggleSidecarOpen} />
            <main onMouseDown={() => {if (sidecarOpen) setSidecarOpen(false)}} onPointerDown={() => {if (sidecarOpen) setSidecarOpen(false)}}>{children}</main>
        </MessageContext.Provider>
    );
};

export default Layout;