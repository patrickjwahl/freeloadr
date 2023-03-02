'use client'
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import styles from './Search.module.scss';

export default function SearchForm() {

    const params = useSearchParams();

    const [ search, setSearch ] = useState(params.has('search') ? params.get('search') : '');
    const [ radius, setRadius ] = useState(params.has('radius') ? parseInt(params.get('radius')) : 25);
    const [ address, setAddress ] = useState(params.has('address') ? params.get('address') : '');
    const [ lat, setLat ] = useState(params.has('lat') ? params.get('lng') : '');
    const [ lng, setLng ] = useState(params.has('lat') ? params.get('lng') : '');

    const autocompleteRef = useRef(null);
    const autocompleteInputRef = useRef(null);
    const router = useRouter();

    const autocompleteOptions = {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry']
    };

    const possibleParams = {search, radius, address, lat, lng};
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
            <div className={styles.formContainer}>
                <h2>Search Freeloadr</h2>
                <form onSubmit={submitSearch}>
                    <div>I'm looking for...</div>
                    <input type="text" id="search" name="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="anything" />
                    <label htmlFor="search" hidden>Search for:</label>
                    <div className={styles.selectContainer}>
                        <span>Within </span>
                        <div className={styles.select}>
                            <select id="radius" name="radius" value={radius} onChange={e => setRadius(parseInt(e.target.value))}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className={styles.focus}></span>
                        </div>
                        <span> miles of</span>
                    </div>
                    <input type="text" ref={autocompleteInputRef} id="address" name="address" placeholder="my address" defaultValue={address} />
                    <label htmlFor='address' hidden>Near this address:</label>
                    <input type='submit' value='Search!'/>
                </form>
            </div>
        </>
    )
}