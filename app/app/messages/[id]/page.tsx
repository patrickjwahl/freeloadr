import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../../../util/domain";
import ChatContent from "./ChatContent";

export default async function Page({ params }) {
    const { id } = params;

    const session = await getServerSession(authOptions);
    if (!session) {
        redirect(`/auth/login?callbackURL=${encodeURIComponent('/messages')}`);
    }

    let res = await fetch(`${getAPIDomain()}/conversation/mark/${id}`, {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    res = await fetch(`${getAPIDomain()}/conversations/${id}`, {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
    });

    const data = await res.json();

    if (data.code !== 'OK') {
        throw new Error("Couldn't retrieve this conversation! Please try again.");
    }

    return <ChatContent messages={data.messages} conversation={data.conversation} thumbnail={data.image} sessionData={session} apiDomain={getAPIDomain()} />;
}