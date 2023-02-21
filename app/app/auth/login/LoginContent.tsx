'use client'

import Link from 'next/link';
import styles from '../../styles/Auth.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ClipLoader } from 'react-spinners';

export default function LoginContent() {

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');

    const [ emailError, setEmailError ] = useState(false);
    const [ passwordError, setPasswordError ] = useState(false);
    const [ serverError, setServerError ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    const validateEmail = (forSubmit = false) => {

        if(String(email)
            .toLowerCase()
            .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            
            if (emailError) setEmailError(false);
            return true;
        }

        if (forSubmit) {
            setEmailError(true);
        }

        return false;
    };

    const validatePassword = (forSubmit = false) => {
        if(String(password)
            .match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)) {

            if (passwordError) setPasswordError(false);
            return true;
        }

        if (forSubmit) setPasswordError(true);
        return false;
    };

    const submitForm = async () => {
        const res = await signIn('login', {
            redirect: false,
            email,
            password
        });
        if (res?.error) {
            setIsSubmitting(false);
            setServerError(res.error);
        } else {
            if (searchParams.has('callbackURL')) {
                router.push(searchParams.get('callbackURL'));
            } else {
                router.push('/');
            }
        }
    };

    const submitClicked = (e) => {
        e.preventDefault();
        const fieldsValid = [validateEmail, validatePassword].reduce((prev, f) => {
            return f(true) && prev;
        }, true);
        setServerError('');

        if (fieldsValid) {
            setIsSubmitting(true);
            submitForm();
        }
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    {searchParams.has('redirect') && searchParams.get('redirect') ? (
                        <>
                            <h1 style={{fontSize: '1.7em'}}>You have to log in first!</h1>
                            <h3>Enter your credentials to continue:</h3>
                        </>
                    ) : (<>
                        <h1>WELCOME BACK</h1>
                        <h3>Enter your credentials to get started:</h3>
                    </>
                    )}
                    <form>
                        <div>
                            <input title="Email" type='email' placeholder='Email' value={email} onChange={e => setEmail(e.target.value)} />
                            <span style={{display: validateEmail() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: emailError ? 'block' : 'none'}} className={styles.errorMessage}>You must enter a valid email address!</div>
                        </div>
                        <div>
                            <input title="Password" type='password' placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} />
                            <span style={{display: validatePassword() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: passwordError ? 'block' : 'none'}} className={styles.errorMessage}>Your password must be at least 8 characters long and contain an uppercase and lowercase letter and a number!</div>
                        </div>
                        <div>
                            {isSubmitting ? 
                            <ClipLoader loading={true} color='#fe7496' /> : 
                            <button onClick={submitClicked}>Log in!</button>}
                            <div style={{marginTop: '20px', display: serverError ? 'block' : 'none'}} className={styles.errorMessage}>{serverError}</div>
                        </div>
                    </form>
                    <div className={styles.loginLink}>Don't have an account yet? <Link href={`/auth/signup?callbackURL=${encodeURIComponent(searchParams.get('callbackURL'))}`}>Sign Up</Link></div>
                </div>
            </div>
        </>  
    );
}