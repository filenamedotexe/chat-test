import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export const authOptions: NextAuthOptions = {
  // Note: When using credentials provider with JWT strategy, 
  // we don't need the database adapter
  
  session: {
    strategy: 'jwt',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Query user from database
        const result = await sql`
          SELECT id, email, name, password_hash, role
          FROM users
          WHERE email = ${credentials.email} AND is_active = true
        `;

        const user = result[0];

        if (!user || !user.password_hash) {
          return null;
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          // Log failed login attempt
          await sql`
            INSERT INTO login_history (user_id, ip_address, user_agent, success)
            VALUES (${user.id}, 'unknown', 'unknown', false)
          `;
          return null;
        }

        // Log successful login
        await sql`
          INSERT INTO login_history (user_id, ip_address, user_agent, success)
          VALUES (${user.id}, 'unknown', 'unknown', true)
        `;

        // Update last login timestamp
        await sql`
          UPDATE users 
          SET last_login = CURRENT_TIMESTAMP 
          WHERE id = ${user.id}
        `;

        // Return user object (password_hash excluded)
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  debug: process.env.NODE_ENV === 'development',
};