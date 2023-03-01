import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../../util/domain";
import SearchContent from "./SearchContent";

export default async function Page({ searchParams }) {

    const session = await getServerSession(authOptions);

    let params = [];

    const allowedParams = ['search', 'radius', 'lat', 'lng'];
    allowedParams.forEach(param => {
        if (searchParams[param]) {
            params.push(`${param}=${searchParams[param]}`);
        }
    });

    const url_path = !session ? 'search/guest' : 'search';

    const url = `${getAPIDomain()}/${url_path}?${params.join('&')}`;

    const headers = !session ? {} : {Authorization: `Bearer ${session.access_token}`}

    const res = await fetch(url, { headers }); 

    const data = await res.json();

    return <SearchContent results={data.listings} sessionData={session} images={data.images}/>;
}