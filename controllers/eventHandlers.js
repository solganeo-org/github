const { notifySlack } = require('./notificationHandlers');
const { logEvent } = require('../utils/logger');
const { triggerCICD } = require('../utils/cicd');
const config = require('../config/config');
const axios = require('axios');

const validTechnologies = ["node", "html", "css", "javascript", "python", "ruby", "php"];

module.exports.handlePush = async (payload) => {
    try {
        console.log('Received push event payload:', JSON.stringify(payload, null, 2));

        if (!payload || !payload.ref) {
            console.error('Error: payload or payload.ref is undefined.');
            console.log('Payload content:', JSON.stringify(payload, null, 2)); // Ajout pour voir le payload complet
            throw new Error('Invalid payload: ref is undefined.');
        }

        const branch = payload.ref.replace('refs/heads/', '');
        const commits = payload.commits;
        const repository = payload.repository.full_name;

        console.log(`Handling push event for branch: ${branch} in repository: ${repository}`);

        // Log the event
        await logEvent('push', payload);
        console.log('Event logged successfully for push.');

        // Check for sensitive file changes and notify if necessary
        const sensitiveFiles = ['.env', 'config.json', 'secrets.yaml', 'credentials.json'];
        const sensitiveChanges = commits.some(commit =>
            commit.added.concat(commit.modified).some(file => sensitiveFiles.includes(file))
        );

        if (sensitiveChanges) {
            console.log('Sensitive changes detected, notifying Slack...');
            await notifySlack(`🚨 Sensitive changes detected on branch ${branch} in ${repository} by ${payload.pusher.name}`);
            console.log('Slack notification sent for sensitive changes.');
        }

        // Trigger CI/CD if applicable
        console.log(`Triggering CI/CD for branch: ${branch}...`);
        await triggerCICD({
            repository,
            branch,
            commit: payload.after,
            author: payload.pusher.name
        });
        console.log('CI/CD triggered successfully.');

    } catch (error) {
        console.error('Error handling push event:', error);
        throw error;
    }
};

module.exports.handlePullRequest = async (payload) => {
    try {
        console.log('Received pull request event payload:', JSON.stringify(payload, null, 2));

        if (!payload || !payload.pull_request) {
            console.error('Error: payload or payload.pull_request is undefined.');
            throw new Error('Invalid payload: pull_request is undefined.');
        }

        const { action, pull_request, repository } = payload;
        const prDetails = {
            number: pull_request.number,
            title: pull_request.title,
            base: pull_request.base.ref,
            head: pull_request.head.ref,
            author: pull_request.user.login,
            repository: repository.full_name
        };

        console.log(`Handling pull request event: ${action} for PR #${prDetails.number} in repository: ${prDetails.repository}`);

        // Log the event
        await logEvent('pull_request', payload);
        console.log('Event logged successfully for pull request.');

        switch (action) {
            case 'opened':
            case 'reopened':
                console.log('New or reopened PR detected, notifying Slack...');
                await notifySlack(`📝 New PR #${prDetails.number}: ${prDetails.title} in ${prDetails.repository}`);
                console.log('Slack notification sent for new/reopened PR.');
                break;
            case 'closed':
                if (pull_request.merged) {
                    console.log(`PR #${prDetails.number} merged, notifying Slack...`);
                    await notifySlack(`✅ PR #${prDetails.number} merged in ${prDetails.repository}`);
                    console.log('Slack notification sent for merged PR.');
                }
                break;
            default:
                console.log(`Unhandled pull request action: ${action}`);
        }

    } catch (error) {
        console.error('Error handling pull request event:', error);
        throw error;
    }
};

module.exports.handleIssueComment = async (payload) => {
    try {
        console.log('Received issue comment event payload:', JSON.stringify(payload, null, 2));

        if (!payload || !payload.comment || !payload.issue) {
            console.error('Error: payload, payload.comment, or payload.issue is undefined.');
            throw new Error('Invalid payload: comment or issue is undefined.');
        }

        const { action, comment, issue, repository } = payload;

        console.log(`Handling issue comment event: ${action} on issue #${issue.number} in repository: ${repository.full_name}`);

        if (action === 'created') {
            // Log the event 
            await logEvent('issue_comment', payload);
            console.log('Event logged successfully for issue comment.');
            
            await notifySlack(`💬 New comment on issue #${issue.number} in ${repository.full_name}: "${comment.body}" by ${comment.user.login}`);
            console.log('Slack notification sent for new issue comment.');
        }

    } catch (error) {
        console.error('=> Error handling issue comment event:', error);
        throw error;
    }
};

module.exports.handleSecurityAdvisory = async (payload) => {
    try {
        console.log('Received security advisory event payload:', JSON.stringify(payload, null, 2));

        if (!payload || !payload.security_advisory) {
            console.error('Error: payload or payload.security_advisory is undefined.');
            throw new Error('Invalid payload: security_advisory is undefined.');
        }

        const { action, security_advisory, repository } = payload;

        console.log(`Handling security advisory event: ${action} in repository: ${repository.full_name}`);

        if (action === 'published') {
            await logEvent('security_advisory', payload);
            console.log('Event logged successfully for security advisory.');
            
            await notifySlack(`🚨 Security advisory published in ${repository.full_name}: ${security_advisory.summary}`);
            console.log('Slack notification sent for published security advisory.');
        }

    } catch (error) {
        console.error('Error handling security advisory event:', error);
        throw error;
    }
};

module.exports.handleRepositoryVulnerabilityAlert = async (payload) => {
    try {
        console.log('Received repository vulnerability alert event payload:', JSON.stringify(payload, null, 2));

        if (!payload || !payload.alert) {
            console.error('Error: payload or payload.alert is undefined.');
            throw new Error('Invalid payload: alert is undefined.');
        }

        const { action, alert, repository } = payload;

        console.log(`Handling repository vulnerability alert: ${action} in repository: ${repository.full_name}`);

        if (action === 'created') {
            await logEvent('repository_vulnerability_alert', payload);
            console.log('Event logged successfully for vulnerability alert.');
            
            await notifySlack(`🔒 New vulnerability alert in ${repository.full_name} for ${alert.package_name}`);
            console.log('Slack notification sent for vulnerability alert.');
        }

    } catch (error) {
        console.error('Error handling repository vulnerability alert event:', error);
        throw error;
    }
};

// Fonction de vérification du format du nouveau nom
function checkNewNameFormat(name) {
    const words = name.split("-");
    const hasValidSeparators = words.length > 1 && !name.includes(" ");
    const lastWord = words[words.length - 1];
    const hasValidTechnology = validTechnologies.includes(lastWord.toLowerCase());

    if (!hasValidSeparators || !hasValidTechnology) {
        console.error(
            `Erreur de nommage - Résultat obtenu : ${name} - Résultat attendu : nomprojet-objectif-techno`
        );
        return false;
    }
    return true;
}

// Fonction pour renommer le dépôt
async function renameRepository(owner, repo, newName, token) {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    try {
        const response = await axios.patch(url, { name: newName }, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });
        console.log(`Repository renamed to ${newName}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 422) {
            console.error('Erreur 422 : format de données non valide ou nom déjà utilisé.');
        } else {
            console.error('Erreur lors du renommage du repository:', error.message);
        }
        throw error;
    }
}

// Fonction pour enregistrer les événements de renommage (assurez-vous que logEvent est défini)
async function logEvent(eventType, payload) {
    try {
        // Logique pour stocker l'événement dans votre fichier logs.json ou autre
        console.log(`Logging event ${eventType}`);
        // ... implémentez ici la logique de log
    } catch (error) {
        console.error('Erreur lors de la journalisation de l\'événement:', error.message);
    }
}

// Fonction pour envoyer une notification Slack (assurez-vous que notifySlack est défini)
async function notifySlack(message) {
    try {
        // Logique pour envoyer une notification Slack
        console.log(`Sending Slack notification: ${message}`);
        // ... implémentez ici la logique de notification Slack
    } catch (error) {
        console.error('Erreur lors de l\'envoi de la notification Slack:', error.message);
    }
}

// Fonction principale de gestion du renommage
module.exports.handleRepositoryRename = async (payload) => {
    try {
        console.log('Received repository rename event payload:', JSON.stringify(payload, null, 2));

        const oldName = payload.changes.repository.name.from;
        const newName = payload.repository.name;
        const fullName = payload.repository.full_name;
        const [owner] = fullName.split('/'); // Extraction de l'owner

        console.log(`Repository renamed from ${oldName} to ${newName} (${fullName})`);

        // Vérification du format du nouveau nom
        if (!checkNewNameFormat(newName)) {
            // Nom d'erreur formaté sans espaces ni caractères spéciaux
            const errorMessage = `nom_invalid-${Date.now()}`;

            // Renommer le dépôt avec le message d'erreur formaté
            await renameRepository(owner, newName, errorMessage, process.env.GITHUB_TOKEN);

            console.log(`Repository renamed to error message: ${errorMessage}`);
            return;
        }

        // Journalisation de l'événement
        await logEvent('repository_rename', payload);
        console.log('Event logged successfully for repository rename.');

        // Notification Slack
        await notifySlack(`🔄 Repository renamed from ${oldName} to ${newName} (${fullName})`);
        console.log('Slack notification sent for repository rename.');

    } catch (error) {
        console.error('Error handling repository rename event:', error.message);
        throw error;
    }
};

module.exports.handleDeploymentStatus = async (payload) => {
    try {
        console.log('Received deployment status event payload:', JSON.stringify(payload, null, 2));

        const deploymentStatus = payload.deployment_status.state;
        const repository = payload.repository.full_name;
        const environment = payload.deployment.environment;

        console.log(`Deployment status for ${repository} in environment ${environment}: ${deploymentStatus}`);

        // Log the deployment status event
        await logEvent('deployment_status', payload);
        console.log('Event logged successfully for deployment status.');

        // Notify via Slack or other integration
        await notifySlack(`🚀 Deployment status for ${repository} in ${environment}: ${deploymentStatus}`);
        console.log('Slack notification sent for deployment status.');

    } catch (error) {
        console.error('Error handling deployment status event:', error);
        throw error;
    }
};