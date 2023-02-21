import { getAPIDomain } from '../../../util/domain';
import ProfileContent from '../ProfileContent';

export default async function Page({ params }) {
    const { id } = params;
    const res = await fetch(`${getAPIDomain()}/listings/${id}`, { cache: 'no-store' });
    const { code, owner, listings, images } = await res.json();

    if (code == 'OK') {
        return <ProfileContent owner={owner} listings={listings} images={images} apiDomain={getAPIDomain()} />;
    } else {
        throw new Error("That user doesn't exist!");
    }
}