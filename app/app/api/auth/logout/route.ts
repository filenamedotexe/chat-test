import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    // Clear all auth-related cookies
    const cookieStore = cookies();
    
    // NextAuth session cookies
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('next-auth.csrf-token');
    cookieStore.delete('__Secure-next-auth.csrf-token');
    cookieStore.delete('next-auth.callback-url');
    cookieStore.delete('__Secure-next-auth.callback-url');
    
    // Clear any other session cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
      if (cookie.name.includes('next-auth') || cookie.name.includes('session')) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { 
        status: 200,
        headers: {
          'Clear-Site-Data': '"cookies", "storage"'
        }
      }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}