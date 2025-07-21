#!/usr/bin/env node

console.log('🔍 Checking Auth Dependencies\n');

// Check environment variables
console.log('1️⃣ Environment Variables:');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set (will use default)');

// Check if we can import auth package
console.log('\n2️⃣ Auth Package:');
try {
  const authPath = require.resolve('@/lib/auth');
  console.log('   @/lib/auth resolved to:', authPath);
  
  // Try to import authOptions
  const { authOptions } = require('@/lib/auth');
  console.log('   authOptions imported:', authOptions ? '✅' : '❌');
  console.log('   Providers:', authOptions?.providers?.length || 0);
  
} catch (error) {
  console.log('   Error importing @/lib/auth:', error.message);
}

// Check NextAuth
console.log('\n3️⃣ NextAuth Package:');
try {
  const nextAuthPath = require.resolve('next-auth');
  console.log('   next-auth resolved to:', nextAuthPath);
  
  const NextAuth = require('next-auth').default;
  console.log('   NextAuth imported:', typeof NextAuth === 'function' ? '✅' : '❌');
} catch (error) {
  console.log('   Error importing next-auth:', error.message);
}

// Check database connection
console.log('\n4️⃣ Database Connection:');
const { neon } = require('@neondatabase/serverless');
try {
  const sql = neon(process.env.DATABASE_URL);
  // Simple query to test connection
  sql`SELECT 1`.then(result => {
    console.log('   Database connection:', result ? '✅ Working' : '❌ Failed');
  }).catch(err => {
    console.log('   Database error:', err.message);
  });
} catch (error) {
  console.log('   Error connecting to database:', error.message);
}

// Load env if needed
if (!process.env.NEXTAUTH_SECRET) {
  console.log('\n⚠️  NEXTAUTH_SECRET not found in environment!');
  console.log('   Make sure .env.local is loaded properly');
}