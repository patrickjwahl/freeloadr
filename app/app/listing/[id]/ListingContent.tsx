'use client'

import { Listing } from "../../../lib/types";
import styles from './Listing.module.scss';
import ImageSlider from '../../../components/ImageSlider';
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";

interface Props {
    listing: Listing,
    images: string[],
    apiDomain: string
}

export default function ListingContent({ listing, images, apiDomain }: Props) {

    const [ map, setMap ] = useState(null);
    const [ viewportWidth, setViewportWidth ] = useState(1400);
    const [ isMyPost, setIsMyPost ] = useState(false);

    const [ editing, setEditing ] = useState(false);
    const [ editTitle, setEditTitle ] = useState(listing?.title);
    const [ editDescription, setEditDescription ] = useState(listing?.description);
    const [ addedImages, setAddedImages ] = useState({});
    const [ removedImages, setRemovedImages ] = useState([]);
    const [ editImages, setEditImages ] = useState(images);
    const [ addingImagesAllowed, setAddingImagesAllowed ] = useState(images && images.length < 6);
    const [ titleError, setTitleError ] = useState(false);
    const [ descriptionError, setDescriptionError ] = useState(false);
    const [ serverError, setServerError ] = useState('');
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const [ isWriting, setIsWriting ] = useState(false);
    const [ message, setMessage ] = useState('');
    const [ messageError, setMessageError ] = useState(false);
    const [ isSubmittingMessage, setIsSubmittingMessage ] = useState(false);

    // const editImages = images.filter(url => !removedImages.includes(url)).concat(Object.keys(addedImages).map(image => window.URL.createObjectURL(addedImages[image])));
    // const addingImagesAllowed = editImages.length < 6;

    useEffect(() => {
        const newEditImages = images.filter(url => !removedImages.includes(url)).concat(Object.keys(addedImages).filter(key => addedImages[key] != null));
        setEditImages(newEditImages);
        setAddingImagesAllowed(newEditImages.length < 6);
    }, [removedImages, addedImages]);

    const session = useSession();
    const router = useRouter();

    const mapRef = useRef(null);

    const startWriting = () => {
        if (session.status !== 'authenticated') {
            router.push(`/auth/login?callbackURL=/listing/${listing.id}&redirect=true`);
        } else {
            setIsWriting(true);
        }
    };

    const startEditing = () => {
        setEditing(true);
        setEditDescription(listing.description);
        setEditTitle(listing.title);
        setAddedImages({});
        setRemovedImages([]);
        setTitleError(false);
        setDescriptionError(false);
    };

    const cancelEditing = () => {
        setEditing(false);
    };

    const addImage = e => {

        if (!e.target.files[0]) return;

        if (addingImagesAllowed) {
            const file = e.target.files[0];

            setAddedImages({...addedImages, [window.URL.createObjectURL(file)]: file});
        }
    };

    const removeImage = url => {
        if (Object.hasOwn(addedImages, url)) {
            const newAddedImages = {...addedImages};
            newAddedImages[url] = null;
            setAddedImages(newAddedImages);
        } else {
            const removed = [...removedImages];
            removed.push(url);
            setRemovedImages(removed);
        }
    };

    const getWindowDimensions = () => {
        const { innerWidth: width, innerHeight: height } = window;
        return {
          width,
          height
        };
    };

    const validateTitle = (forSubmit = false) => {
        if (editTitle.length > 1 && editTitle.length < 51) {
            if (titleError) setTitleError(false);
            return true;
        }

        if (forSubmit) setTitleError(true);
        return false;
    };

    const validateDescription = (forSubmit = false) => {
        if (editDescription.length > 0 && editDescription.length < 5001) {
            if (descriptionError) setDescriptionError(false);
            return true;
        }

        if (forSubmit) setDescriptionError(true);
        return false;
    };

    const validateMessage = (forSubmit = false) => {
        if (message.length > 0 && message.length < 5001) {
            if (messageError) setMessageError(false);
            return true;
        }

        if (forSubmit) setMessageError(true);
        return false;
    };

    const sendMessageClicked = (e) => {
        e.preventDefault();
        const fieldsValid = [validateMessage].reduce((prev, f) => {
            return f(true) && prev;
        }, true);

        if (fieldsValid) {
            setIsSubmittingMessage(true);
            submitMessage();
        }
    };

    const submitMessage = () => {
        
    }; 

    const submitClicked = (e) => {
        e.preventDefault();
        const fieldsValid = [validateTitle, validateDescription].reduce((prev, f) => {
            return f(true) && prev;
        }, true);
        setServerError('');

        if (fieldsValid) {
            setIsSubmitting(true);
            submitForm();
        }
    };

    const submitForm = async () => {
        let formData = new FormData();
        formData.append('title', editTitle);
        formData.append('description', editDescription);
        Object.keys(addedImages).forEach(key => {
            if (addedImages[key] != null) {
                formData.append(`file-${key}`, addedImages[key]);
            }
        });

        let params = [];
        removedImages.forEach(url => params.push(`delete=${encodeURIComponent(url)}`));

        try {

            const res = await fetch(`${apiDomain}/listing/${listing.id}?${params.join('&')}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${session.data.access_token}`
                }
            });

            const data = await res.json();

            if (data.code !== 'OK') {
                setIsSubmitting(false);
                setServerError("Something went wrong. Please try again");
            } else {
                router.refresh();
            }

        } catch (e) {
            setIsSubmitting(false);
            setServerError("Something went wrong. Please try again.");
        }
    };

    useEffect(() => {
        setIsMyPost(session.status === 'authenticated' && session.data?.user?.id == listing.owner.id);
    }, [session.data, session.status]);

    useEffect(() => {
        function handleResize() {
            setViewportWidth(getWindowDimensions().width);
        }

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);

      }, []);

    useEffect(() => {
        let lMap = L.map('map').setView([listing?.owner.lat, listing?.owner.lng], 15);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(lMap);
        L.marker([listing?.owner.lat, listing?.owner.lng]).addTo(lMap);
        setMap(lMap);

        return () => lMap.remove();
    }, [mapRef.current]);

    let sliderWidth, sliderHeight, mapWidth;
    if (viewportWidth < 700) {
        sliderWidth = '100%';
        sliderHeight = '300px';
        mapWidth = '100%';
    } else if (viewportWidth < 1100) {
        sliderWidth = '100%';
        sliderHeight = '500px';
        mapWidth = '100%';
    } else if (viewportWidth < 1200) {
        sliderWidth = '600px';
        sliderHeight = '400px';
        mapWidth = '400px'
    } else {
        sliderWidth = '700px';
        sliderHeight = '500px';
        mapWidth = '400px';
    }

    const editButtons = isSubmitting ? (
        <ClipLoader loading={true} color='#fe7496' />
    ) : (
        <>
            {editing ? (
                <>
                    <div className={styles.editButtons}>
                        <button onClick={submitClicked}>Submit changes</button>
                        <button className={styles.cancel} onClick={cancelEditing}>Cancel</button>
                    </div>
                    <div className={styles.errorMessage}>{serverError}</div>
                </>
            ) : (<button onClick={startEditing}>Edit this listing</button>)
            }
        </>
    );

    const title = (
        <div className={styles.titleContainer}>
            {editing ? (<div>
                    <input type="text" value={editTitle} placeholder='Title' onChange={e => setEditTitle(e.target.value)} />
                    <div style={{display: titleError ? 'block' : 'none'}} className={styles.errorMessage}>Your title must be between 2 and 50 characters long!</div>
                </div>
            ) : (<h1>{listing?.title}</h1>)}
            {isMyPost && viewportWidth > 700 ? editButtons : (null)}
        </div>
    );

    return (
        <>
            <div className={styles.container}>
                <div className={styles.contentContainer}>
                    <div className={styles.leftContainer}>
                        {isMyPost && viewportWidth < 700 ? <div className={styles.editButtonsContainer}>{editButtons}</div> : (null)}
                        {viewportWidth > 700 ? title : (null)}
                        <ImageSlider urls={editing ? editImages : images} width={sliderWidth} height={sliderHeight} editing={editing} removeImage={removeImage} />
                        {editing && addingImagesAllowed ? (
                            <label style={{marginBottom: '20px'}} className={styles.cancel}>
                                <input style={{display: 'none'}} type='file' accept='image/png, image/jpeg' onChange={e => addImage(e)} />
                                Add an image...
                            </label>
                        ) : (null)}
                        {viewportWidth < 700 ? title : (null)}
                    </div>
                    <div className={styles.rightContainer}>
                        {editing ? (
                            <div style={{width: '100%', fontSize: '1.2rem'}}>
                                <textarea placeholder='Description...' value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                <div style={{display: descriptionError ? 'block' : 'none'}} className={styles.errorMessage}>Your description must be between 2 and 5000 characters long!</div>
                            </div>
                        ) : (null)}
                        <div style={{width: '100%', height: editing ? '0px' : 'auto', overflow: 'hidden', fontSize: '1.2rem'}}>{listing.description}</div>
                        {isMyPost ? (null) : isWriting ? (
                                <div className={styles.messageBox}>
                                    <textarea className={styles.newMessage} placeholder='Write your message here!' value={message} onChange={e => setMessage(e.target.value)} />
                                    {isSubmittingMessage ? (<ClipLoader loading={true} color='#fe7496' />) : (
                                    <>
                                        <button className={styles.messageButton} onClick={sendMessageClicked}>SEND YOUR MESSAGE<span className="material-symbols-outlined">send</span></button>
                                        <div style={{display: messageError ? 'block' : 'none'}} className={styles.errorMessage}>Your message must be between 2 and 5000 characters long!</div>
                                    </>)}
                                </div>
                            ) : (
                                <button className={styles.messageButton} onClick={() => startWriting()}>REQUEST TO BORROW<span className="material-symbols-outlined">message</span></button>
                            )}
                        <div className={styles.ownerInfo}>
                            <div style={{fontWeight: 'bold'}}>Listed by:</div>
                            <div>{listing.owner.name}</div>
                            <div>{listing.owner.address}</div>
                            <div id='map' ref={mapRef} style={{height: '400px', width: mapWidth, marginTop: '10px', borderRadius: '10px'}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};