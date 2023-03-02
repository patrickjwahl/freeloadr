'use client'

import styles from './HomePage.module.scss';
import logo from '../public/img/flower.png';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {

    const router = useRouter();
    const [ search, setSearch ] = useState('');
    const [ address, setAddress ] = useState('');
    const [ lat, setLat ] = useState('');
    const [ lng, setLng ] = useState('');

    const autocompleteRef = useRef(null);
    const autocompleteInputRef = useRef(null);

    const buttonClicked = () => {
        router.push(`auth/signup?callbackURL=${encodeURIComponent(window.location.href)}`);
    };

    const autocompleteOptions = {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry']
    };

    const possibleParams = {search, address, lat, lng};
    const linkParams = Object.keys(possibleParams).reduce((prev, curr) => {
        if (possibleParams[curr]) return [...prev, `${curr}=${possibleParams[curr]}`];
        return prev;
    }, []);

    const searchLink = `/search?${linkParams.join('&')}`;

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

    const submitSearch = e => {

        e.preventDefault();

        router.push(searchLink);
    };

    return (
        <>
            <Script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCyr4fFUrqc2SWZJAm5SwNN3ylLmqOJ8tY&libraries=places&callback=initMap" async></Script>
            <div className={styles.container}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroImage} >
                        <Image src={logo} alt='hello' />
                        <div>
                            <h1>Welcome to Freeloadr!</h1>
                            <h4>Share with your neighbors and resist the demonic cult of consumerism!</h4>
                        </div>
                    </div>
                </div>
                <form onSubmit={submitSearch}>
                    <div className={styles.formContainer}>
                        <div>I'm looking for</div>
                        <input name="search" id="search" placeholder='anything' type='text' value={search} onChange={e => setSearch(e.target.value)} />
                        <div>near</div>
                        <div className={styles.addressInput}>
                            <input ref={autocompleteInputRef} type='text' name="address" id="address" placeholder='Jacksonville Beach, FL' size={47} />
                        </div>
                        <input type='submit' value='Search' />
                    </div>
                    <div className={styles.link}>
                        <Link href={`/auth/signup?callbackURL=${encodeURIComponent('/create')}`}>I'd like to share something of my own!</Link>
                    </div>
                </form>
            </div>
        </>
    );

}