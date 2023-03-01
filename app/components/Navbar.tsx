'use client'

import styles from './Navbar.module.scss';
import logoImg from '../public/img/freeloadr-logo.png';
import Image from 'next/image';
import cn from 'classnames';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import { MessageContext } from '../app/MessageContext';

const Navbar = () => {

    const session = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [ sidecarOpen, _setSidecarOpen ] = useState<boolean>(false);
    const sidecarOpenRef = useRef<boolean>(sidecarOpen);
    const setSidecarOpen = (val) => {
        sidecarOpenRef.current = val;
        _setSidecarOpen(val);
    }

    const newMessages = useContext(MessageContext);

    const toggleAndSignOut = () => {
        setSidecarOpen(false);
        signOut();
    };

    const goToPageWithCallback = (page) => {
        if (searchParams.get('callbackURL')) {
            router.push(`${page}?callbackURL=${encodeURIComponent(searchParams.get('callbackURL'))}`);
        } else {
            router.push(`${page}?callbackURL=${encodeURIComponent(window.location.href)}`);
        }
    };

    const handleClick = e => {

        if (sidecarOpenRef.current && !e.composedPath().some(element => element.id === 'sidecar' || element.id === 'profile-button')) {
            setSidecarOpen(false);
        }
    };

    useEffect(() => {
        document.documentElement.addEventListener('mousedown', handleClick);
        document.documentElement.addEventListener('pointerdown', handleClick);

        return () => {
            document.documentElement.removeEventListener('mousedown', handleClick);
            document.documentElement.removeEventListener('pointerdown', handleClick)
        }
    }, []);

    return (
        <>
            <div onClick={() => {if (sidecarOpen) setSidecarOpen(false)}} className={styles.container}>
                <div className={styles.logoContainer}>
                    <Link href='/'>
                        <Image src={logoImg} alt="logo" />
                    </Link>
                </div>
                <div className={styles.buttonsContainer}>
                    {session.status === 'authenticated' ? (
                        <>
                            <Link href='/search'><span className='material-symbols-outlined'>search</span></Link>
                            <Link href='/create'><span className='material-symbols-outlined'>add_box</span></Link>
                            <Link href='/messages'><span className={cn("material-symbols-outlined", {[styles.withMessage]: newMessages.length > 0})}>forum</span></Link>
                            <span id='profile-button' onClick={() => setSidecarOpen(!sidecarOpen)} className="material-symbols-outlined">account_circle</span>
                        </>
                    ) : (
                        <>
                            <a><div onClick={() => goToPageWithCallback('/auth/signup')}>Sign Up</div></a>
                            <a><div onClick={() => goToPageWithCallback('/auth/login')}>Log In</div></a>
                        </>
                    )}
                </div>
            </div>
            <div className={styles.padding}></div>
            <div id='sidecar' className={cn(styles.sidecarContainer, {[styles.visible]: sidecarOpen})}>
                <div className={cn(styles.sidecar, {[styles.visible]: sidecarOpen})}>
                    <h3>{session.data?.user?.name}</h3>
                    <Link href='/profile'><div onClick={() => setSidecarOpen(!sidecarOpen)}><span className="material-symbols-outlined">person</span> Profile</div></Link>
                    <div onClick={() => setSidecarOpen(!sidecarOpen)}><span className="material-symbols-outlined">settings</span> Settings</div>
                    <div onClick={toggleAndSignOut}><span className="material-symbols-outlined">waving_hand</span> Log Out</div>
                </div>
            </div>
        </>
    );
};

export default Navbar;