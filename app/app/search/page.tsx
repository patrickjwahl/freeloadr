import { getServerSession } from "next-auth";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../../util/domain";
import SearchContent from "./SearchContent";

export default async function Page({ params, searchParams }) {

    const session = await getServerSession(authOptions);

    let newParams = [];

    const allowedParams = ['search', 'radius', 'lat', 'lng'];
    allowedParams.forEach(param => {
        if (searchParams[param]) {
            newParams.push(`${param}=${searchParams[param]}`);
        }
    });

    const url_path = !session ? 'search/guest' : 'search';

    const url = `${getAPIDomain()}/${url_path}?${newParams.join('&')}`;

    const headers = !session ? {} : {Authorization: `Bearer ${session.access_token}`}

    const res = await fetch(url, { headers, cache: 'no-store' }); 

    const data = await res.json();

    return <SearchContent results={data.listings} sessionData={session} images={data.images}/>;
}