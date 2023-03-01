import styles from './Messages.module.scss';

export default function Page() {
    return (
        <div className={styles.messagesPlaceholder}>
            <h2>Select a conversation to see its messages!</h2>
        </div>
    )
}