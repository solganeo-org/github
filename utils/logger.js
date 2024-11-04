const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

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
    } catch (error) {
        console.error('Erreur de logging:', error);
    }
};

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