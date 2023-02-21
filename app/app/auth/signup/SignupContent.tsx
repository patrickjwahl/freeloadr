'use client'

import Link from 'next/link';
import styles from '../../styles/Auth.module.scss';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { signIn } from 'next-auth/react';
import { ClipLoader } from 'react-spinners';

export default function SignUpContent() {

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ name, setName ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ lat, setLat ] = useState('');
    const [ lng, setLng ] = useState('');

    const [ emailError, setEmailError ] = useState(false);
    const [ passwordError, setPasswordError ] = useState(false);
    const [ nameError, setNameError ] = useState(false);
    const [ addressError, setAddressError ] = useState(false);
    const [ serverError, setServerError ] = useState('');

    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const router = useRouter();
    const autocompleteRef = useRef();
    const autocompleteInputRef = useRef();

    const searchParams = useSearchParams();

    const autocompleteOptions = {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry']
    };

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

    const validateName = (forSubmit = false) => {
        if(name.length > 1 && name.length < 26) {
            if (nameError) setNameError(false);
            return true;
        }

        if (forSubmit) setNameError(true);
        return false;
    };

    const validateAddress = (forSubmit = false) => {
        if (!(!address || !lat || !lng)) {
            if (addressError) setAddressError(false);
            return true;
        }

        if (forSubmit) setAddressError(true);
        return false;
    };

    const changeAddress = () => {
        setAddress('');
    };

    const submitForm = async () => {
        const res = await signIn('signup', {
            redirect: false,
            email,
            password,
            name,
            address,
            lat,
            lng
        });
        if (res?.error) {
            setIsSubmitting(false);
            setServerError(res.error);
        } else {
            router.push(searchParams.get('callbackURL'));
        }
    };

    const submitClicked = (e) => {
        e.preventDefault();
        const fieldsValid = [validateEmail, validatePassword, validateName, validateAddress].reduce((prev, f) => {
            return f(true) && prev;
        }, true);
        setServerError('');

        if (fieldsValid) {
            setIsSubmitting(true);
            submitForm();
        }
    };

    useEffect(() => {
        const initMap = () => {};
        window.initMap = initMap;
    }, []);

    useEffect(() => {

        const setGoogleRef = () => {

            if (window.google) {
                autocompleteRef.current = new window.google.maps.places.Autocomplete(
                    autocompleteInputRef.current, autocompleteOptions
                );
                autocompleteRef.current.addListener("place_changed", async function () {
                    const place = await autocompleteRef.current.getPlace();

                    setAddress(place.formatted_address);
                    setLat(place.geometry.location.lat());
                    setLng(place.geometry.location.lng());
                });
            } else {
                setTimeout(setGoogleRef, 200);
            }
        };

        setGoogleRef();

    }, []);

    return (
        <>
            <Script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCyr4fFUrqc2SWZJAm5SwNN3ylLmqOJ8tY&libraries=places&callback=initMap" async></Script>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <h1>GET READY TO SPREAD THE LOVE</h1>
                    <h3>Enter your details below:</h3>
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
                            <input title="Full Name" type='text' placeholder='Name' value={name} onChange={e => setName(e.target.value)} />
                            <span style={{display: validateName() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: nameError ? 'block' : 'none'}} className={styles.errorMessage}>Your display name must be between 2 and 25 characters long!</div>
                        </div>
                        <div>
                            <input title="Search for your address" type='text' placeholder='Address' ref={autocompleteInputRef} onChange={e => changeAddress()} />
                            <span style={{display: validateAddress() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: addressError ? 'block' : 'none'}} className={styles.errorMessage}>Make sure to select your address from the dropdown menu!</div>
                        </div>
                        <div>
                            {isSubmitting ? 
                            <ClipLoader loading={true} color='#fe7496' /> : 
                            <button onClick={submitClicked}>Create your account!</button>}
                            <div style={{marginTop: '20px', display: serverError ? 'block' : 'none'}} className={styles.errorMessage}>{serverError}</div>
                        </div>
                    </form>
                    <div className={styles.loginLink}>Already have an account? <Link href={`/auth/login?callbackURL=${encodeURIComponent(searchParams.get('callbackURL'))}`}>Log In</Link></div>
                </div>
            </div>
        </>  
    );
};