// scripts/run-all-cache-tests.js
/**
 * Script principal pour exécuter tous les tests du cache
 * Orchestre les tests unitaires, d'intégration, API et manuels
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Configuration des tests
const TEST_CONFIG = {
  timeout: 30000, // 30 secondes par test
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  skipAPI: process.argv.includes('--skip-api'),
  skipManual: process.argv.includes('--skip-manual'),
  onlyUnit: process.argv.includes('--unit-only')
};

console.log('🧪 Suite complète de tests du cache LLM\n');
console.log('========================================\n');

// Fonction pour exécuter une commande avec timeout et logging
async function runCommand(command, description, options = {}) {
  const startTime = Date.now();
  
  console.log(`🚀 ${description}...`);
  if (TEST_CONFIG.verbose) {
    console.log(`   Commande: ${command}`);
  }
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: projectRoot,
      timeout: TEST_CONFIG.timeout,
      ...options
    });
    
    const duration = Date.now() - startTime;
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr && TEST_CONFIG.verbose) {
      console.log('   Warnings:', stderr);
    }
    
    console.log(`✅ ${description} terminé (${duration}ms)\n`);
    return true;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ ${description} échoué (${duration}ms)`);
    console.error(`   Erreur: ${error.message}`);
    
    if (error.stdout) {
      console.error('   Stdout:', error.stdout);
    }
    if (error.stderr) {
      console.error('   Stderr:', error.stderr);
    }
    
    console.log('');
    return false;
  }
}

// Vérifier que les fichiers de test existent
function checkTestFiles() {
  const testFiles = [
    'tests/cache.test.js',
    'tests/openai-cache-integration.test.js',
    'tests/cache-api.test.js',
    'scripts/test-cache-manual.js'
  ];
  
  const missing = testFiles.filter(file => !existsSync(resolve(projectRoot, file)));
  
  if (missing.length > 0) {
    console.error('❌ Fichiers de test manquants:');
    missing.forEach(file => console.error(`   - ${file}`));
    return false;
  }
  
  return true;
}

// Tests unitaires du cache
async function runUnitTests() {
  console.log('📦 Tests unitaires du cache\n');
  
  const success = await runCommand(
    'node tests/cache.test.js',
    'Tests unitaires Enhanced Cache'
  );
  
  return success;
}

// Tests d'intégration
async function runIntegrationTests() {
  console.log('🔗 Tests d\'intégration\n');
  
  const success = await runCommand(
    'node tests/openai-cache-integration.test.js',
    'Tests d\'intégration OpenAI + Cache'
  );
  
  return success;
}

// Tests API
async function runAPITests() {
  console.log('🌐 Tests API\n');
  
  // Vérifier si le serveur Next.js est démarré
  try {
    const { stdout } = await execAsync('curl -s http://localhost:3000 > /dev/null && echo "server_running"', {
      timeout: 5000
    });
    
    if (!stdout.includes('server_running')) {
      console.log('⚠️  Serveur Next.js non accessible sur localhost:3000');
      console.log('   Pour tester l\'API, démarrez le serveur avec: npm run dev');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Serveur Next.js non accessible');
    console.log('   Pour tester l\'API, démarrez le serveur avec: npm run dev');
    return false;
  }
  
  const success = await runCommand(
    'node tests/cache-api.test.js',
    'Tests API Cache Metrics'
  );
  
  return success;
}

// Tests manuels / de charge
async function runManualTests() {
  console.log('🎯 Tests manuels / de charge\n');
  
  const success = await runCommand(
    'node scripts/test-cache-manual.js',
    'Tests manuels et de charge'
  );
  
  return success;
}

// Générer un rapport de synthèse
function generateReport(results) {
  console.log('📊 Rapport de synthèse des tests\n');
  console.log('=====================================\n');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`📈 Résumé:`);
  console.log(`   - Tests exécutés: ${totalTests}`);
  console.log(`   - Réussis: ${passedTests} ✅`);
  console.log(`   - Échoués: ${failedTests} ${failedTests > 0 ? '❌' : '✅'}`);
  console.log(`   - Taux de succès: ${(passedTests / totalTests * 100).toFixed(1)}%\n`);
  
  console.log(`📋 Détail par catégorie:`);
  Object.entries(results).forEach(([test, success]) => {
    console.log(`   - ${test}: ${success ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  console.log('\n');
  
  if (failedTests === 0) {
    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('   Le cache est prêt pour la production.\n');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
    console.log('   Vérifiez les erreurs ci-dessus avant de déployer.\n');
  }
  
  return failedTests === 0;
}

// Afficher l'aide
function showHelp() {
  console.log(`
📖 Cache Test Suite - Options disponibles:

Exécution:
  node scripts/run-all-cache-tests.js [options]

Options:
  --help, -h          Afficher cette aide
  --verbose, -v       Mode verbeux avec plus de détails
  --skip-api          Ignorer les tests API (si serveur non démarré)
  --skip-manual       Ignorer les tests manuels (plus rapide)
  --unit-only         Exécuter uniquement les tests unitaires

Exemples:
  node scripts/run-all-cache-tests.js                    # Tous les tests
  node scripts/run-all-cache-tests.js --verbose          # Mode verbeux
  node scripts/run-all-cache-tests.js --skip-api         # Sans tests API
  node scripts/run-all-cache-tests.js --unit-only        # Tests unitaires seulement

Prérequis:
  - Node.js installé
  - Dépendances du projet installées (npm install)
  - Pour tests API: serveur Next.js démarré (npm run dev)

`);
}

// Fonction principale
async function main() {
  try {
    // Vérifier les arguments d'aide
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      showHelp();
      return;
    }
    
    console.log(`Configuration: ${JSON.stringify(TEST_CONFIG, null, 2)}\n`);
    
    // Vérifier que les fichiers de test existent
    if (!checkTestFiles()) {
      console.error('❌ Vérification des fichiers de test échouée');
      process.exit(1);
    }
    
    console.log('✅ Tous les fichiers de test sont présents\n');
    
    const results = {};
    
    // Tests unitaires (toujours exécutés)
    results['Tests unitaires'] = await runUnitTests();
    
    if (!TEST_CONFIG.onlyUnit) {
      // Tests d'intégration
      results['Tests d\'intégration'] = await runIntegrationTests();
      
      // Tests API (sauf si skip-api)
      if (!TEST_CONFIG.skipAPI) {
        results['Tests API'] = await runAPITests();
      }
      
      // Tests manuels (sauf si skip-manual)
      if (!TEST_CONFIG.skipManual) {
        results['Tests manuels'] = await runManualTests();
      }
    }
    
    // Générer le rapport
    const allPassed = generateReport(results);
    
    // Code de sortie approprié
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Erreur fatale durant l\'exécution des tests:', error.message);
    if (TEST_CONFIG.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Gestion des signaux pour un arrêt propre
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrompus par l\'utilisateur');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Tests terminés par le système');
  process.exit(143);
});

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}