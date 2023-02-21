import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../../util/domain";
import ProfileContent from './ProfileContent';

export default async function Page({ params }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect(`/auth/login?callbackURL=${encodeURIComponent('/profile')}`);
    }

    const id = session.user.id;
    const res = await fetch(`${getAPIDomain()}/listings/${id}`, { cache: 'no-store' });
    const { code, owner, listings, images } = await res.json();

    if (code == 'OK') {
        return <ProfileContent owner={owner} listings={listings} images={images} apiDomain={getAPIDomain()} />;
    } else {
        throw new Error("That user doesn't exist!");
    }
}