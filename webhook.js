const express = require('express');
const bodyParser = require('body-parser');
const { handlePush, handlePullRequest, handleIssueComment, handleSecurityAdvisory, handleRepositoryVulnerabilityAlert } = require('./controllers/eventHandlers');
const verifySignature = require('./middlewares/verifySignature');
const config = require('./config/config');

const app = express();

// Middleware pour parser les requêtes JSON et vérifier les signatures des webhooks
app.use(bodyParser.json({ verify: verifySignature }));

// Servir des fichiers statiques (si nécessaire)
app.use(express.static('public'));

// Route pour la racine du serveur
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de webhooks GitHub !');
});

// Route principale pour gérer les webhooks GitHub
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook received');
        const event = req.headers['x-github-event'];
        const payload = req.body;

        console.log(`Event type: ${event}`);
        if (!payload) {
            console.error('Error: Payload is undefined or null');
            return res.status(400).json({ status: 'error', message: 'Payload is undefined or null' });
        }

        console.log('Payload received:', JSON.stringify(payload, null, 2));

        // Gérer les différents types d'événements GitHub
        switch (event) {
            case 'push':
                console.log('Processing push event...');
                await handlePush(payload);
                console.log('Push event processed successfully.');
                break;
            case 'pull_request':
                console.log('Processing pull request event...');
                await handlePullRequest(payload);
                console.log('Pull request event processed successfully.');
                break;
            case 'issue_comment':
                console.log('Processing issue comment event...');
                await handleIssueComment(payload);
                console.log('Issue comment event processed successfully.');
                break;
            case 'security_advisory':
                console.log('Processing security advisory event...');
                await handleSecurityAdvisory(payload);
                console.log('Security advisory event processed successfully.');
                break;
            case 'repository_vulnerability_alert':
                console.log('Processing repository vulnerability alert event...');
                await handleRepositoryVulnerabilityAlert(payload);
                console.log('Repository vulnerability alert event processed successfully.');
                break;
            default:
                console.log(`Unhandled event type: ${event}`);
                return res.status(400).json({ status: 'error', message: `Unhandled event type: ${event}` });
        }

        res.status(200).json({ status: 'success', event });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Démarrer le serveur
app.listen(config.port, () => {
    console.log(`Webhook server running on http://localhost:${config.port}`);
});