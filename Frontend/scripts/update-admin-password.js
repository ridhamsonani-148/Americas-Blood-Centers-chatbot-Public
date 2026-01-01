#!/usr/bin/env node

/**
 * Script to update the admin password in AdminLogin.jsx
 * Usage: node scripts/update-admin-password.js "new-password"
 */

const fs = require('fs');
const path = require('path');

const newPassword = process.argv[2];

if (!newPassword) {
  process.exit(1);
}

const adminLoginPath = path.join(__dirname, '..', 'src', 'admin', 'AdminLogin.jsx');

if (!fs.existsSync(adminLoginPath)) {
  process.exit(1);
}

try {
  let content = fs.readFileSync(adminLoginPath, 'utf8');
  
  // Replace the password line
  const passwordRegex = /const ADMIN_PASSWORD = '[^']*';/;
  const newPasswordLine = `const ADMIN_PASSWORD = '${newPassword}';`;
  
  if (passwordRegex.test(content)) {
    content = content.replace(passwordRegex, newPasswordLine);
    fs.writeFileSync(adminLoginPath, content, 'utf8');
    console.log('✅ Admin password updated successfully');
    console.log('🔒 New password:', newPassword);
    console.log('📝 Updated file:', adminLoginPath);
  } else {
    console.error('❌ Error: Could not find password line in AdminLogin.jsx');
    console.log('Please manually update the line: const ADMIN_PASSWORD = \'your-password\';');
  }
} catch (error) {
  console.error('❌ Error updating admin password:', error.message);
  process.exit(1);
}