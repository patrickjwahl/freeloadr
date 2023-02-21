'use client'

import styles from './HomePage.module.scss';
import logo from '../public/img/freeloadr-logo.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {

    const router = useRouter();

    const buttonClicked = () => {
        router.push(`auth/signup?callbackURL=${encodeURIComponent(window.location.href)}`);
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroImage} >
                        <Image src={logo} alt='hello' />
                    </div>
                    <h4>Share your wealth with the world</h4>
                    <h6>Enter your ZIP code to get started</h6>
                    <div className={styles.formContainer}>
                        <button onClick={() => buttonClicked()} id='go'>LET'S GO!</button>
                        <input id='zip' type='tel' placeholder='90210' size={5} maxLength={5} />
                    </div>
                </div>
            </div>
        </>
    );

}