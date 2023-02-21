'use client'

import { ClipLoader } from "react-spinners";

export default function Loading() {
    return (
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '40px'}}>
            <ClipLoader loading={true} color='#fe7496' />
        </div>
    );
}