'use client'

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <h2>{error.message}</h2>
        </div>
    )
}