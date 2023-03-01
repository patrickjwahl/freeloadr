import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { getAPIDomain } from '../../util/domain';
import ConversationBar from './ConversationBar';
import LayoutContent from './LayoutContent';
import styles from './Messages.module.scss';

export default async function MessagesLayout({ children }: { children: ReactNode }) {

    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/auth/login?redirect=true&callbackURL=${encodeURIComponent('/messages')}`);
    }

    const res = await fetch(`${getAPIDomain()}/conversations`, {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    const data = await res.json();

    if (data.code != 'OK') {
        throw new Error("Something went wrong!");
    }

    return (
        <LayoutContent conversations={data.conversations} images={data.images} sessionData={session}>
            {children}
        </LayoutContent>
    );
}