'use client'

import { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import ListingPreview from '../../components/ListingPreview';
import { Listing } from '../../lib/types';
import styles from './Search.module.scss';

export default function SearchContent({ results, images, sessionData }: { results: Array<Listing>, images: string[][], sessionData: Session }) {

    const params = useSearchParams();

    let header = 'Listings ';

    if (params.has('search')) {
        header += `for "${params.get('search')}" `
    }

    if (params.has('address')) {
        header += `near ${params.get('address')}`
    } else if (Boolean(sessionData)) {
        header += 'near you';
    }

    return (
        <div className={styles.resultsContainer}>
            <h2>{header}</h2>
            {results.length > 0 ? (
            <div className={styles.gridContainer}>
                {results.map((listing, index) => {
                    return (
                        <div key={index}>
                            <ListingPreview listing={listing} images={images[index]} showAddress={true} />
                        </div>
                    );
                })}
            </div>
            ) : (
                <div style={{textAlign: 'center', fontSize: '1.3em', opacity: 0.8}}>No results!</div>
            )}
        </div>
    );
}