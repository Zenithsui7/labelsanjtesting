import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node create-owner.js <email> <password> [displayName] [serviceAccountPath]');
  console.error('Example: node create-owner.js owner@example.com "YourPassword123!" "Owner" service-account.json');
  process.exit(1);
}

const [email, password, displayName = 'Owner', serviceAccountPath = './service-account.json'] = args;
const resolvedPath = resolve(serviceAccountPath);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(resolvedPath, 'utf8'));
} catch (error) {
  console.error(`Failed to read service account file at ${resolvedPath}:`, error.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

async function main() {
  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    const adminDoc = firestore.doc(`admins/${user.uid}`);
    await adminDoc.set({
      role: 'owner',
      displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Created owner user successfully.');
    console.log('UID:', user.uid);
    console.log('Firestore admin document created at admins/' + user.uid);
  } catch (error) {
    console.error('Failed to create owner user:', error.message);
    process.exit(1);
  }
}

main();
