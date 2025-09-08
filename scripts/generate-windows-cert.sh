#!/bin/bash

# Windows self-signed certificate generation script
# This script generates a self-signed certificate for Windows code signing

set -e

CERT_DIR="build/certificates"
CERT_NAME="flowsonat-windows-cert"

echo "🔐 Generating Windows self-signed certificate..."

# Create certificates directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key and certificate with code signing extensions
openssl req -x509 -newkey rsa:4096 -keyout "$CERT_DIR/$CERT_NAME-key.pem" -out "$CERT_DIR/$CERT_NAME-cert.pem" -days 3650 -nodes -subj "/C=US/ST=CA/L=San Francisco/O=FlowSonat/OU=Development/CN=FlowSonat" -extensions v3_req -config <(echo '[req]'; echo 'distinguished_name=req'; echo '[v3_req]'; echo 'keyUsage=digitalSignature,keyEncipherment'; echo 'extendedKeyUsage=codeSigning'; echo 'subjectAltName=@alt_names'; echo '[alt_names]'; echo 'DNS.1=FlowSonat')

# Convert to PKCS#12 format (.p12) for Windows code signing
openssl pkcs12 -export -out "$CERT_DIR/$CERT_NAME.p12" -inkey "$CERT_DIR/$CERT_NAME-key.pem" -in "$CERT_DIR/$CERT_NAME-cert.pem" -password pass:flowsonat123

echo "✅ Certificate generated successfully!"
echo "📁 Certificate files:"
echo "   - Private key: $CERT_DIR/$CERT_NAME-key.pem"
echo "   - Certificate: $CERT_DIR/$CERT_NAME-cert.pem"
echo "   - PKCS#12: $CERT_DIR/$CERT_NAME.p12"
echo ""
echo "🔑 Certificate password: flowsonat123"
echo ""
echo "⚠️  Note: This is a self-signed certificate for development/testing purposes only."
echo "   For production releases, consider using a certificate from a trusted CA."
