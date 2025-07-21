#!/usr/bin/env node

console.log('Setting up authentication database...\n');

fetch('http://localhost:3000/api/setup-auth-database')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Success:', data.message);
      console.log('\nDefault credentials:');
      console.log('Email:', data.defaultCredentials.email);
      console.log('Password:', data.defaultCredentials.password);
      console.log('\n⚠️', data.defaultCredentials.note);
    } else {
      console.error('❌ Error:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
    }
  })
  .catch(error => {
    console.error('❌ Failed to connect to server:', error.message);
    console.log('\nMake sure the server is running on http://localhost:3000');
    console.log('Run: cd apps/base-template && npm run dev');
  });