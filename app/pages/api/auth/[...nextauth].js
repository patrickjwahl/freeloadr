import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Sign Up',
            id: 'signup',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                },
                password: {
                    label: 'Password',
                    type: 'password'
                },
                name: {
                    label: 'Full Name',
                    type: 'text'
                },
                address: {
                    label: 'Address',
                    type: 'text'
                },
                lat: {
                    label: 'Latitude',
                    type: 'text'
                },
                lng: {
                    label: 'Longitude',
                    type: 'text'
                }
            },
            authorize: async (credentials, req) => {
                
                const payload = {
                    email: credentials.email,
                    password: credentials.password,
                    name: credentials.name,
                    address: credentials.address,
                    lat: credentials.lat,
                    lng: credentials.lng
                };

                const res = await fetch('http://localhost:5000/user', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const user = await res.json();
                if (!res.ok) {
                    throw new Error(user.message);
                }

                if (res.ok && user) {
                    if (user.code == 'USER_EXISTS') {
                        throw new Error("That email is in use! Did you mean to log in instead?");
                    } else {
                        return user;
                    }
                }

                return null;
            }
        }), 
        CredentialsProvider({
            name: 'Log In',
            id: 'login',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                    placeholder: 'myemail@domain.com'
                },
                password: {
                    label: 'Password',
                    type: 'password'
                }
            },
            authorize: async (credentials, req) => {
                const payload = {
                    email: credentials.email,
                    password: credentials.password
                };

                const res = await fetch('http://localhost:5000/login', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const user = await res.json();
                if (!res.ok) {
                    throw new Error(user.message);
                }

                if (res.ok && user) {
                    if (user.code == 'NO_USER_EXISTS') {
                        throw new Error("No user with that email exists! Did you mean to sign up instead?");
                    } else if (user.code == 'INCORRECT_PASSWORD') {
                        throw new Error("That password is incorrect!");
                    }
                    return user;
                }

                return null;
            }
        })
    ],
    secret: 'deadlysecret',
    callbacks: {
        jwt: async ({ token, user, account }) => {
            if (account && user) {
                return {
                    ...token,
                    user
                }
            }

            return token;
        },

        session: async ({ session, token }) => {
            session.user = token.user.user;
            session.access_token = token.user.access_token;

            return session;
        }
    },
    debug: true
};

export default NextAuth(authOptions);