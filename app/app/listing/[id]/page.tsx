import { getAPIDomain } from "../../../util/domain";
import ListingContent from './ListingContent';

export default async function ListingPage({ params }) {
    const { id } = params;

    const res = await fetch(`${getAPIDomain()}/listing/${id}`);
    const { code, listing, images } = await res.json();

    if (code == 'OK') {
        return <ListingContent listing={listing} images={images} apiDomain={getAPIDomain()} />;
    } else {
        throw new Error("That listing doesn't exist!");
    }
}