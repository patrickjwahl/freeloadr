import Link from 'next/link';
import { Listing } from '../lib/types';
import ImageSlider from './ImageSlider';
import styles from './ListingPreview.module.scss';

interface Props {
    listing: Listing,

    /** Image URLs */
    images: string[]
}

const ListingPreview = ({ listing, images }) => {
    return (
        <Link href={`/listing/${listing.id}`}>
        <div className={styles.container}>
            <h3>{listing.title}</h3>
            <ImageSlider urls={images} width='100%' height='200px' showThumbnails={false} />
            <div>{listing.description}</div>
        </div>
        </Link>
    );
};

export default ListingPreview;