const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

// Chemin pour le fichier de logs web
const webLogPath = path.join(__dirname, '..', 'public', 'logs.json');

// Fonction existante pour les logs système
module.exports.logEvent = async (event, payload) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            event,
            details: payload,
        };
        // Créer le répertoire de logs s'il n'existe pas
        const logDir = config.logPath;
        await fs.mkdir(logDir, { recursive: true });
        // Déterminer le chemin du fichier de log
        const logFilePath = path.join(logDir, `${event}.log`);
        // Écrire l'entrée de log dans le fichier
        await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');
        console.log(`Logged event: ${event}`);

        // Ajouter le log pour l'affichage web
        await addWebLog(event, payload);
    } catch (error) {
        console.error('Erreur de logging:', error);
    }
};

// Fonction existante pour les logs d'erreurs
module.exports.logError = async (message, errorDetails) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: 'error',
            message,
            details: errorDetails,
        };
        // Créer le répertoire de logs s'il n'existe pas
        const logDir = config.logPath;
        await fs.mkdir(logDir, { recursive: true });
        // Déterminer le chemin du fichier de log des erreurs
        const logFilePath = path.join(logDir, 'errors.log');
        // Écrire l'entrée de log des erreurs dans le fichier
        await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');
        console.error(`Logged error: ${message}`);
    } catch (error) {
        console.error('Erreur lors de la journalisation des erreurs:', error);
    }
};

// Nouvelle fonction pour gérer les logs web
async function addWebLog(event, payload) {
    try {
        // Créer le dossier public s'il n'existe pas
        await fs.mkdir(path.dirname(webLogPath), { recursive: true });

        // Lire les logs existants ou créer un nouveau tableau
        let logs = [];
        try {
            const content = await fs.readFile(webLogPath, 'utf8');
            logs = JSON.parse(content);
        } catch (error) {
            // Si le fichier n'existe pas ou est invalide, on continue avec un tableau vide
        }

        // Formater le message selon le type d'événement
        let message = '';
        if (event === 'repository_rename') {
            message = `Repository renamed from ${payload.changes.repository.name.from} to ${payload.repository.name} (${payload.repository.full_name})`;
        } else {
            message = `${event} event occurred`;
        }

        // Ajouter le nouveau log
        logs.push({
            timestamp: new Date().toISOString(),
            event,
            message
        });

        // Limiter le nombre de logs si nécessaire (garder les 1000 derniers par exemple)
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }

        // Écrire dans le fichier
        await fs.writeFile(webLogPath, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Error adding web log:', error);
    }
}