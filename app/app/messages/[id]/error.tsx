'use client'

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%'}}>
            <h2>{error.message}</h2>
        </div>
    )
}