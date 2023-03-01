'use client'

import { useRouter } from 'next/navigation';
import { Listing, Person } from '../../lib/types';
import styles from './Profile.module.scss';
import pluralize from 'pluralize';
import ListingPreview from '../../components/ListingPreview';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ClipLoader } from 'react-spinners';

interface Props {
    owner: Person,

    listings: Listing[],

    /** Pre-signed image urls corresponding to each listing */
    images: string[][],

    apiDomain: string
}

export default function Profile({ owner, listings, images, apiDomain }: Props) {

    const [ editing, setEditing ] = useState(false);
    const [ name, setName ] = useState(owner.name);
    const [ address, setAddress ] = useState(owner.address);
    const [ lat, setLat ] = useState(owner.lat);
    const [ lng, setLng ] = useState(owner.lng);

    const [ nameError, setNameError ] = useState(false);
    const [ addressError, setAddressError ] = useState(false);
    const [ serverError, setServerError ] = useState('');
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const router = useRouter();
    const session = useSession();
    const autocompleteRef = useRef(null);
    const autocompleteInputRef = useRef(null);

    const autocompleteOptions = {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry']
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

    const startEditing = () => {
        setName(owner.name);
        setAddress(owner.address);
        setLat(owner.lat);
        setLng(owner.lng);

        setNameError(false);
        setAddressError(false);

        setEditing(true);
    };

    const changeAddress = () => {
        setAddress('');
    };

    useEffect(() => {
        const initMap = () => {};
        window.initMap = initMap;
    }, []);

    useEffect(() => {
        if (session.status !== 'authenticated') {
            setEditing(false);
        }
    }, [session.status]);

    useEffect(() => {

        if (!editing) return;

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
                    setAddressError(false);
                });
            } else {
                setTimeout(setGoogleRef, 200);
            }
        };

        setGoogleRef();

    }, [editing]);

    const submitForm = async () => {

        try {

            const res = await fetch(`${apiDomain}/user/edit`, {
                method: 'POST',
                body: JSON.stringify({ name, address, lat, lng }),
                headers: {
                    'Authorization': `Bearer ${session.data.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.code !== 'OK') {
                setIsSubmitting(false);
                setServerError("Something went wrong. Please try again");
            } else {
                location.reload();
            }

        } catch (e) {
            setIsSubmitting(false);
            setServerError("Something went wrong. Please try again.");
        }
    }

    const submitClicked = (e) => {
        e.preventDefault();
        const fieldsValid = [validateName, validateAddress].reduce((prev, f) => {
            return f(true) && prev;
        }, true);
        setServerError('');

        if (fieldsValid) {
            setIsSubmitting(true);
            submitForm();
        }
    };

    const editButtons = isSubmitting ? (<ClipLoader loading={true} color='#fe7496' />) : (
        <div className={styles.buttonContainer}>
            {editing ? (
                <>
                    <button onClick={submitClicked}>Submit changes</button>
                    <button className={styles.cancel} onClick={() => setEditing(false)}>Cancel</button>
                </>
            ) : (
                <button onClick={() => startEditing()}>Edit your profile</button>
            )}
        </div>
    );

    return (
        <>
            <Script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCyr4fFUrqc2SWZJAm5SwNN3ylLmqOJ8tY&libraries=places&callback=initMap" async></Script>
            <div className={styles.container}>
                <div className={styles.leftContainer}>
                    <div className={styles.profileBox}>
                        { session.status === 'authenticated' && session.data.user.id === owner.id ? editButtons : (null)}
                        { editing ? (
                            <div>
                                <input type='text' placeholder='Name' value={name} onChange={e => setName(e.target.value)} />
                                <div style={{display: nameError ? 'block' : 'none'}} className={styles.errorMessage}>Your display name must be between 2 and 25 characters long!</div>
                            </div>
                        ) : (
                            <h2>{owner.name}</h2>
                        )}
                        <h3>{pluralize('listing', listings.length, true)}</h3>
                        { editing ? (
                            <div>
                            <input ref={autocompleteInputRef} className={styles.smallerInput} type='text' placeholder={owner.address} size={50} onChange={changeAddress} />
                            <div style={{display: addressError ? 'block' : 'none'}} className={styles.errorMessage}>Make sure to select your address from the dropdown menu!</div>
                            </div>
                        ) : (
                            <div>{owner.address}</div>
                        )}
                    </div>
                </div>
                <div className={styles.rightContainer}>
                    <h1>Listings</h1>
                    {listings.length > 0 ? (
                    <div className={styles.gridContainer}>
                        {listings.map((listing, index) => {
                            return (
                                <div key={index}>
                                    <ListingPreview listing={listing} images={images[index]} />
                                </div>
                            );
                        })}
                    </div>
                    ) : (
                        <div style={{textAlign: 'center', fontSize: '1.3em', opacity: 0.8}}>No listings... yet 😜</div>
                    )}
                </div>
            </div>
        </>
    );
};