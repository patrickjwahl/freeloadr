import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ExternalImage from "./ExternalImage";
import styles from './ImageSlider.module.scss';
import cn from 'classnames';

interface Props {
    urls: string[],
    width: string,
    height: string,
    editing?: boolean,
    removeImage?(url: string): void,
    showThumbnails?: boolean
}

const ImageSlider = ({ urls, width, height, editing = false, removeImage, showThumbnails = true }: Props) => {

    const [ index, setIndex ] = useState(0);
    const [ offset, setOffset ] = useState(0);
    const [ userIsSwiping, setUserIsSwiping ] = useState(false);

    const initialMousePosition = useRef(0);
    const offsetRef = useRef(0);

    const swipeThreshold = (width == '100%') ? 20 : 100;

    const handleMouseDown = e => {
        e.preventDefault();

        if (e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }

        initialMousePosition.current = e.screenX;
        setUserIsSwiping(true);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('pointermove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('pointerup', handleMouseUp);
    };

    const handleMouseMove = useCallback(e => {
        offsetRef.current = e.screenX - initialMousePosition.current;
        setOffset(offsetRef.current);
    }, []);

    const handleMouseUp = e => {

        e.preventDefault();

        setUserIsSwiping(false);

        if (offsetRef.current < -swipeThreshold && index < urls.length - 1) {
            setIndex(index + 1);
        } else if (offsetRef.current > swipeThreshold && index > 0) {
            setIndex(index - 1);
        }

        offsetRef.current = 0;

        setOffset(0);

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('pointermove', handleMouseMove);
        window.removeEventListener('pointerup', handleMouseUp);
    };

    return (
        <div style={{width, marginBottom: '20px'}}>
            <div className={styles.container} style={{width, height}}>
                <div className={cn(styles.sliderContainer, {[styles.swiping]: userIsSwiping})} style={{width: `calc(${urls.length} * ${width})`, left: `calc((-1 * ${width} * ${index}) + ${offset}px)`}} onMouseDown={handleMouseDown} onPointerDown={handleMouseDown}>
                    {urls.map((url, index) => {
                        return <ExternalImage key={url} url={url} width={width} height={height} />
                    })}
                </div>
                <div className={styles.buttonContainer}>
                    {index > 0 ? 
                        <button className={styles.left} aria-label="Next image" onClick={(e) => {e.preventDefault(); setIndex(index - 1)}}>&#8249;</button>
                        : (null)
                    }
                    {index < urls.length - 1 ?
                        <button className={styles.right} aria-label="Previous image" onClick={(e) => {e.preventDefault(); setIndex(index + 1)}}>&#8250;</button>
                        : (null)
                    }
                </div>
            </div>
            { showThumbnails ? (
            <div className={styles.thumbnailsContainer}>
                {urls.map((url, i) => {
                    return (
                        <div onMouseOver={() => setIndex(i)} key={url} className={cn(styles.thumbnail, {[styles.active]: i == index})}>
                            <Image src={url} alt="thumbnail" fill style={{objectFit: 'cover'}} />
                            {editing ? <div onClick={() => removeImage(url)} className={cn(styles.deleteImageButton)}>&#10006;</div> : (null)}
                        </div>
                    );
                })}
            </div>
            ) : (null)}
        </div>
    );
};

export default ImageSlider;