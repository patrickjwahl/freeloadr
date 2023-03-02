'use client'

import { useEffect, useState } from 'react';
import styles from '../styles/Auth.module.scss';
import { ClipLoader } from 'react-spinners';
import Image from 'next/image';
import cn from 'classnames';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Session } from '../../lib/types';

interface Props {
    sessionData: Session,
    apiDomain: string
}

export default function CreateContent({ sessionData, apiDomain }: Props) {

    const router = useRouter();
    const session = useSession();

    const [ title, setTitle ] = useState('');
    const [ description, setDescription ] = useState('');
    const [ images, setImages ] = useState({});
    const [ imageFullSize, setImageFullSize ] = useState({});

    const [ titleError, setTitleError ] = useState(false);
    const [ descriptionError, setDescriptionError ] = useState(false);

    const [ isSubmitting, setIsSubmitting ] = useState(false);
    const [ serverError, setServerError ] = useState('');

    const addingImagesAllowed = Object.keys(images).filter(image => images[image] != null).length < 6;

    const addImage = e => {

        if (!e.target.files[0]) return;

        if (addingImagesAllowed) {
            const file = e.target.files[0];

            setImages({...images, [file.name]: file});

            setTimeout(() => {
                setImageFullSize({...imageFullSize, [file.name]: true});
            }, 20);
        }
    };

    const removeImage = (image) => {
        setImageFullSize({...imageFullSize, [image]: false});
        setTimeout(() => {
            let newImages = {...images};
            newImages[image] = null;
            setImages(newImages);
        }, 200);
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
        formData.append('title', title);
        formData.append('description', description);
        Object.keys(images).forEach(key => {
            if (images[key] != null) {
                formData.append(`file-${key}`, images[key]);
            }
        });

        try {

            const res = await fetch(`${apiDomain}/listing`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${sessionData.access_token}`
                }
            });

            const data = await res.json();

            if (data.code !== 'OK') {
                setIsSubmitting(false);
                setServerError("Something went wrong. Please try again");
            } else {
                router.push(`listing/${data.listing_id}`);
            }

        } catch (e) {
            console.log('bad error');
            console.log(e);
            setIsSubmitting(false);
            setServerError("Something went wrong. Please try again.");
        }
    };

    const validateTitle = (forSubmit = false) => {
        if(title.length > 1 && title.length < 51) {
            if (titleError) setTitleError(false);
            return true;
        }

        if (forSubmit) setTitleError(true);
        return false;
    };

    const validateDescription = (forSubmit = false) => {
        if (description.length > 0 && description.length < 5001) {
            if (descriptionError) setDescriptionError(false);
            return true;
        }

        if (forSubmit) setDescriptionError(true);
        return false;
    };

    useEffect(() => {
        if (session.status === 'unauthenticated') router.push(`/auth/login?callbackURL=${encodeURIComponent(window.location.href)}`)
    }, [session.status]);

    return (
        <>
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <h1 style={{marginBottom: '50px'}}>WHAT DO YOU WANT TO SHARE?</h1>
                    <form>
                        <div>
                            <input title="Title" type='text' placeholder='Title' value={title} onChange={e => setTitle(e.target.value)} />
                            <span style={{display: validateTitle() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: titleError ? 'block' : 'none'}} className={styles.errorMessage}>Your title must be between 2 and 50 characters long!</div>
                        </div>
                        <div className={styles.textAreaContainer}>
                            <textarea title="Description" placeholder='Description' value={description} onChange={e => setDescription(e.target.value)} />
                            <span style={{display: validateDescription() ? 'inline' : 'none'}} className={styles.checkMark}></span>
                            <div style={{display: descriptionError ? 'block' : 'none'}} className={styles.errorMessage}>Your description must be between 2 and 5000 characters long!</div>
                        </div>
                        <div className={styles.imageUploadContainer}>
                            <label className={cn(styles.fileUploadButton, {[styles.fileUploadButtonDisabled]: !addingImagesAllowed})}>
                                <input disabled={!addingImagesAllowed} type='file' accept='image/png, image/jpeg' onChange={e => addImage(e)} />
                                Add an image...
                            </label>
                            <div className={styles.imagesGrid}>
                                {Object.keys(images).map(image => {
                                    if (!images[image]) return (null);
                                    const url = window.URL.createObjectURL(images[image]);

                                    return (
                                            <div className={cn(styles.imageContainer, {[styles.imageContainerVisible]: imageFullSize[image]})}>
                                                <div>
                                                    <Image fill style={{objectFit: 'cover'}} className={styles.previewImage} src={url} alt='Selected image' />
                                                </div>
                                                <div onClick={() => removeImage(image)} className={cn(styles.deleteImageButton)}>&#10006;</div>
                                            </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            {isSubmitting ? 
                            <ClipLoader loading={true} color='#fe7496' /> : 
                            <button onClick={submitClicked}>Create your listing!</button>}
                            <div style={{marginTop: '20px', display: serverError ? 'block' : 'none'}} className={styles.errorMessage}>{serverError}</div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};