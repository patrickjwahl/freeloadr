import Link from 'next/link';
import { Listing } from '../lib/types';
import ImageSlider from './ImageSlider';
import styles from './ListingPreview.module.scss';

interface Props {
    listing: Listing,

    /** Image URLs */
    images: string[],

    showAddress?: boolean
}

const ListingPreview = ({ listing, images, showAddress = false }) => {
    return (
        <Link href={`/listing/${listing.id}`}>
        <div className={styles.container}>
            <h3>{listing.title}</h3>
            <ImageSlider urls={images} width='100%' height='200px' showThumbnails={false} />
            <div className={styles.bodyContent}>
                <div>{listing.description}</div>
                {showAddress ? <div className={styles.address}>
                    {listing.owner.address}
                </div> : (null)}
            </div>
        </div>
        </Link>
    );
};

export default ListingPreview;