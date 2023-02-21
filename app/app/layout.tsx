import './styles/globals.scss'
import AuthContext from "./AuthContext";
import { ReactNode, useState } from "react";
import MessageContext from "./MessageContext";
import Navbar from "../components/Navbar";
import { Dosis } from '@next/font/google';
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

const font = Dosis({subsets: ['latin']});

export const metadata = {
    title: 'Freeloadr | Share and borrow from your neighbors!',
    themeColor: '#fcc439'
};

export default async function RootLayout({ children }: { children: ReactNode }) {

    return (
        <html lang='en' className={font.className}>
            <head>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css"
                    integrity="sha256-kLaT2GOSpHechhsozzB+flnD+zUyjE2LlfWPgU04xyI="
                    crossOrigin=""/>
                <link rel="stylesheet" href="https://fonts.sandbox.google.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"
                    integrity="sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM="
                    crossOrigin=""></script>
            </head>
            <body>
                <AuthContext>
                    <MessageContext>
                        <Navbar />
                        <main>{children}</main>
                    </MessageContext>
                </AuthContext>
            </body>
        </html>
    );
}