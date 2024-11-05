const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

const publicPath = path.join(__dirname, '..', 'public');
const webLogPath = path.join(publicPath, 'logs.json');

// S'assurer que le dossier public existe
const ensurePublicFolder = async () => {
    try {
        await fs.mkdir(publicPath, { recursive: true });
    } catch (error) {
        console.error('Error creating public folder:', error);
    }
};

// Fonction principale de logging
module.exports.logEvent = async (event, payload) => {
    try {
        // Log système standard
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            event,
            details: payload
        };

        // Créer le répertoire de logs système
        await fs.mkdir(config.logPath, { recursive: true });
        const logFilePath = path.join(config.logPath, `${event}.log`);
        await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');

        // Log pour l'interface web
        await ensurePublicFolder();
        
        // Lire les logs web existants
        let webLogs = [];
        try {
            const content = await fs.readFile(webLogPath, 'utf8');
            webLogs = JSON.parse(content);
        } catch {
            // Si le fichier n'existe pas, on continue avec un tableau vide
        }

        // Formater le message selon l'événement
        let message = '';
        if (event === 'repository_rename' && payload.changes && payload.repository) {
            message = `Repository renamed from ${payload.changes.repository.name.from} to ${payload.repository.name} (${payload.repository.full_name})`;
        } else {
            message = `${event} event received`;
        }

        // Ajouter le nouveau log
        webLogs.push({
            timestamp,
            event,
            message
        });

        // Limiter le nombre de logs si nécessaire
        if (webLogs.length > 100) {
            webLogs = webLogs.slice(-100);
        }

        // Sauvegarder les logs web
        await fs.writeFile(webLogPath, JSON.stringify(webLogs, null, 2));

        console.log(`Logged event: ${event}`);
    } catch (error) {
        console.error('Error logging event:', error);
    }
};

// Fonction de logging d'erreur
module.exports.logError = async (message, errorDetails) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: 'error',
            message,
            details: errorDetails
        };

        await fs.mkdir(config.logPath, { recursive: true });
        const logFilePath = path.join(config.logPath, 'errors.log');
        await fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n');
        console.error(`Logged error: ${message}`);
    } catch (error) {
        console.error('Error logging error:', error);
    }
};