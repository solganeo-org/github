const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const { handlePush, handlePullRequest, handleIssueComment, handleSecurityAdvisory, handleRepositoryVulnerabilityAlert } = require('./controllers/eventHandlers');
const verifySignature = require('./middlewares/verifySignature');

const app = express();

// Servir les fichiers statiques à partir du dossier public
app.use(express.static('public'));

// Middleware pour parser les requêtes JSON et vérifier les signatures des webhooks
app.use(bodyParser.json({ verify: verifySignature }));

// Route pour la racine du serveur
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de webhooks GitHub !');
});

// Route principale pour gérer les webhooks GitHub
app.post('/webhook', async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const payload = req.body;

        // Gérer les différents types d'événements GitHub
        switch (event) {
            case 'push':
                await handlePush(payload);
                break;
            case 'pull_request':
                await handlePullRequest(payload);
                break;
            case 'issue_comment':
                await handleIssueComment(payload);
                break;
            case 'security_advisory':
                await handleSecurityAdvisory(payload);
                break;
            case 'repository_vulnerability_alert':
                await handleRepositoryVulnerabilityAlert(payload);
                break;
            default:
                console.log(`Unhandled event type: ${event}`);
        }

        res.status(200).json({ status: 'success', event });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/check-config', (req, res) => {
    const missingConfigs = [];
    const requiredConfigs = ['WEBHOOK_SECRET', 'GITHUB_TOKEN', 'SLACK_WEBHOOK_URL', 'JIRA_API_KEY', 'JIRA_URL'];

    requiredConfigs.forEach((configKey) => {
        if (!process.env[configKey]) {
            missingConfigs.push(configKey);
        }
    });

    if (missingConfigs.length > 0) {
        res.status(500).json({
            status: 'error',
            message: 'Les configurations suivantes sont manquantes ou incorrectes :',
            missingConfigs
        });
    } else {
        res.status(200).json({
            status: 'success',
            message: 'Toutes les configurations requises sont présentes.'
        });
    }
});

// Démarrer le serveur
app.listen(config.port, () => {
    console.log(`Webhook server running on http://localhost:${config.port}`);
});