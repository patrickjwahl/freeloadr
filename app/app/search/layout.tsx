import { ReactNode } from 'react';
import styles from './Search.module.scss';
import SearchForm from './SearchForm';

export default function SearchLayout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.layoutContainer}>
            <SearchForm />
            {children}
        </div>
    );
}