#!/usr/bin/env node

/**
 * Script to update the admin password in admin.html
 * Usage: node scripts/update-admin-password.js "new-password"
 */

const fs = require('fs');
const path = require('path');

const newPassword = process.argv[2];

if (!newPassword) {
  console.error('❌ Error: Please provide a new password');
  console.log('Usage: node scripts/update-admin-password.js "your-new-password"');
  process.exit(1);
}

const adminHtmlPath = path.join(__dirname, '..', 'public', 'admin.html');

if (!fs.existsSync(adminHtmlPath)) {
  console.error('❌ Error: admin.html not found at', adminHtmlPath);
  process.exit(1);
}

try {
  let content = fs.readFileSync(adminHtmlPath, 'utf8');
  
  // Replace the password line
  const passwordRegex = /const adminPassword = '[^']*';/;
  const newPasswordLine = `const adminPassword = '${newPassword}';`;
  
  if (passwordRegex.test(content)) {
    content = content.replace(passwordRegex, newPasswordLine);
    fs.writeFileSync(adminHtmlPath, content, 'utf8');
    console.log('✅ Admin password updated successfully');
    console.log('🔒 New password:', newPassword);
    console.log('📝 Updated file:', adminHtmlPath);
  } else {
    console.error('❌ Error: Could not find password line in admin.html');
    console.log('Please manually update the line: const adminPassword = \'your-password\';');
  }
} catch (error) {
  console.error('❌ Error updating admin password:', error.message);
  process.exit(1);
}