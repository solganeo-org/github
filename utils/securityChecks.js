const config = require('../config/config');
const { notifySlack } = require('../controllers/notificationHandlers');
const { logEvent } = require('./logger');

module.exports.checkSensitiveFiles = (commits) => {
    const sensitiveFiles = ['.env', 'config.json', 'secrets.yaml', 'credentials.json'];
    const modifiedFiles = [];

    // Vérifier chaque commit pour des fichiers sensibles modifiés ou ajoutés
    commits.forEach((commit) => {
        commit.added.concat(commit.modified).forEach((file) => {
            if (sensitiveFiles.includes(file)) {
                modifiedFiles.push(file);
            }
        });
    });

    if (modifiedFiles.length > 0) {
        console.warn('Sensitive files detected:', modifiedFiles);
        return modifiedFiles;
    }

    return null;
};

module.exports.runSecurityChecks = async (eventDetails) => {
    try {
        const { commits, repository, branch, pusher } = eventDetails;

        // Vérifier la présence de fichiers sensibles dans les commits
        const detectedFiles = this.checkSensitiveFiles(commits);

        if (detectedFiles) {
            const message = `🚨 Sensitive file changes detected in ${repository} on branch ${branch} by ${pusher.name}.\nFiles: ${detectedFiles.join(', ')}`;
            await notifySlack(message);
            await logEvent('security_alert', {
                repository,
                branch,
                pusher: pusher.name,
                detectedFiles,
            });
        } else {
            console.log('No sensitive file changes detected.');
        }
    } catch (error) {
        console.error('Error running security checks:', error);
        throw error;
    }
};