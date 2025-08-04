#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Convertit une clé CDP base64 en format PEM pour ES256
 */
function convertCDPKeyToPEM() {
  console.log('🔐 Conversion de clé CDP Coinbase en format PEM\n');

  // Lire le fichier JSON CDP
  const cdpKeyPath = '/Users/sf/Documents/testing/cdp_api_key.json';
  
  try {
    const cdpKeyContent = fs.readFileSync(cdpKeyPath, 'utf8');
    const cdpKey = JSON.parse(cdpKeyContent);
    
    console.log('📋 Clé CDP trouvée:');
    console.log(`  ID: ${cdpKey.id}`);
    console.log(`  Private Key: ${cdpKey.privateKey.substring(0, 20)}...`);
    console.log('');

    // La clé base64 de Coinbase CDP doit être convertie
    const base64Key = cdpKey.privateKey;
    const keyBuffer = Buffer.from(base64Key, 'base64');
    
    console.log(`📊 Taille de la clé: ${keyBuffer.length} bytes`);
    
    // Tentatives de conversion en différents formats PEM
    const formats = [
      {
        name: 'EC PRIVATE KEY (secp256r1)',
        header: '-----BEGIN EC PRIVATE KEY-----',
        footer: '-----END EC PRIVATE KEY-----'
      },
      {
        name: 'PRIVATE KEY (PKCS#8)',
        header: '-----BEGIN PRIVATE KEY-----',
        footer: '-----END PRIVATE KEY-----'
      }
    ];

    formats.forEach((format, index) => {
      console.log(`\n🧪 Test format ${index + 1}: ${format.name}`);
      
      // Créer la clé PEM
      const keyBase64Lines = base64Key.match(/.{1,64}/g) || [base64Key];
      const pemKey = `${format.header}\n${keyBase64Lines.join('\n')}\n${format.footer}`;
      
      console.log('🔑 Clé PEM générée:');
      console.log(pemKey);
      
      // Tester si la clé est valide pour ES256
      try {
        // Essayer de créer un objet crypto avec cette clé
        const keyObject = crypto.createPrivateKey({
          key: pemKey,
          format: 'pem'
        });
        
        console.log('✅ Clé PEM valide !');
        console.log(`   Type: ${keyObject.asymmetricKeyType}`);
        console.log(`   Taille: ${keyObject.asymmetricKeySize} bytes`);
        
        // Sauvegarder la clé PEM valide
        const outputPath = `/Users/sf/Documents/testing/trading-v1/cdp_private_key_${format.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pem`;
        fs.writeFileSync(outputPath, pemKey);
        console.log(`💾 Clé sauvegardée: ${outputPath}`);
        
        return pemKey; // Retourner la première clé valide
        
      } catch (error) {
        console.log(`❌ Format invalide: ${error.message}`);
      }
    });

    // Si aucun format standard ne fonctionne, essayer avec les specs Coinbase
    console.log('\n🏦 Test format spécifique Coinbase CDP...');
    
    // Format exact selon la doc Coinbase
    const coinbaseFormat = `-----BEGIN EC PRIVATE KEY-----\n${base64Key}\n-----END EC PRIVATE KEY-----\n`;
    
    try {
      const keyObject = crypto.createPrivateKey({
        key: coinbaseFormat,
        format: 'pem'
      });
      
      console.log('✅ Format Coinbase CDP valide !');
      console.log(`   Type: ${keyObject.asymmetricKeyType}`);
      
      // Mettre à jour le .env avec la clé PEM
      const envPath = '/Users/sf/Documents/testing/trading-v1/.env';
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remplacer la clé base64 par la clé PEM (échappée pour le .env)
      const escapedPemKey = coinbaseFormat.replace(/\n/g, '\\n');
      envContent = envContent.replace(
        /COINBASE_ADVANCED_API_SECRET=.*/,
        `COINBASE_ADVANCED_API_SECRET="${escapedPemKey}"`
      );
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env mis à jour avec la clé PEM');
      
      return coinbaseFormat;
      
    } catch (error) {
      console.log(`❌ Format Coinbase échoué: ${error.message}`);
    }
    
    console.log('\n⚠️  Aucun format PEM valide trouvé automatiquement');
    console.log('📝 Vous devrez peut-être générer une nouvelle clé CDP sur Coinbase Developer Platform');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter la conversion
convertCDPKeyToPEM();