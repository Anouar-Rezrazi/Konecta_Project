import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User as UserModel } from '@/models/User';
import { verifyPassword } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();
          
          const user = await UserModel.findOne({ email: credentials.email });
          if (!user) {
            return null;
          }

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            user.password as string
          );
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.role = user.role;
      }
      
      // Handle session updates (when update() is called)
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }
      
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        // Ensure name and email are updated from token
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
