import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../pages/api/auth/[...nextauth]";
import { getAPIDomain } from "../util/domain";
import HomePage from "./HomePage";
import SearchContent from "./search/SearchContent";

export default async function Page({ params, searchParams }) {

    const session = await getServerSession(authOptions);

    if (!session) return <HomePage />;

    redirect('/search?radius=25');
}