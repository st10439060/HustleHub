const path = require('path');
const fs = require('fs');
const selfsigned = require('selfsigned');

const certsDir = path.resolve(process.cwd(), 'certs');

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.cert');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL certificates already exist:');
  console.log(`  Key:  ${keyPath}`);
  console.log(`  Cert: ${certPath}`);
  process.exit(0);
}

console.log('Generating local SSL certificate...');

const pems = selfsigned.generate(
  [{ name: 'commonName', value: 'localhost' }],
  {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      { name: 'keyUsage', keyCertSign: true, digitalSignature: true },
      { name: 'extKeyUsage', serverAuth: true },
      { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] },
    ],
  }
);

fs.writeFileSync(keyPath, pems.private);
fs.writeFileSync(certPath, pems.cert);

console.log('\nSSL certificate generated successfully:');
console.log(`  Key:  ${keyPath}`);
console.log(`  Cert: ${certPath}`);
console.log('\nNote: Your browser will show a security warning because this is a self-signed');
console.log('certificate. This is expected for local development. Click "Advanced" ->');
console.log('"Proceed to localhost" to continue.');
