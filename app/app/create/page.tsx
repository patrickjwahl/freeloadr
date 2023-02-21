import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../../util/domain";
import CreateContent from "./CreateContent";

export default async function CreatePage({ params }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(`/auth/login?callbackURL=${encodeURIComponent('/create')}`);
    }

    return <CreateContent sessionData={session} apiDomain={getAPIDomain()} />
}