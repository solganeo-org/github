const axios = require('axios');
const config = require('../config/config');

// Function to send Slack notifications
module.exports.notifySlack = async (message, channel = 'github-alerts') => {
    if (!config.slackWebhook) {
        console.warn('Slack webhook URL is not configured.');
        return;
    }

    try {
        await axios.post(config.slackWebhook, {
            channel,
            text: message,
            username: 'GitHub Webhook',
            icon_emoji: ':github:',
        });
        console.log('Slack notification sent successfully.');
    } catch (error) {
        console.error('Error sending Slack notification:', error);
    }
};

// Function to send Discord notifications (example implementation)
module.exports.notifyDiscord = async (message) => {
    if (!config.discordWebhook) {
        console.warn('Discord webhook URL is not configured.');
        return;
    }

    try {
        await axios.post(config.discordWebhook, {
            content: message,
        });
        console.log('Discord notification sent successfully.');
    } catch (error) {
        console.error('Error sending Discord notification:', error);
    }
};

// Function to send Google Chat notifications (example implementation)
module.exports.notifyGoogleChat = async (message) => {
    if (!config.googleChatWebhook) {
        console.warn('Google Chat webhook URL is not configured.');
        return;
    }

    try {
        await axios.post(config.googleChatWebhook, {
            text: message,
        });
        console.log('Google Chat notification sent successfully.');
    } catch (error) {
        console.error('Error sending Google Chat notification:', error);
    }
};

// Function to send Jira notifications (example implementation)
module.exports.createJiraTicket = async (ticketDetails) => {
    if (!config.jiraApiKey || !config.jiraUrl) {
        console.warn('Jira API Key or URL is not configured.');
        return;
    }

    try {
        await axios.post(
            `${config.jiraUrl}/rest/api/3/issue`,
            {
                fields: {
                    project: { key: 'SEC' },
                    summary: ticketDetails.summary,
                    description: ticketDetails.description,
                    issuetype: { name: 'Task' },
                },
            },
            {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`admin:${config.jiraApiKey}`).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('Jira ticket created successfully.');
    } catch (error) {
        console.error('Error creating Jira ticket:', error);
    }
};

// Function to send Trello notifications (example implementation)
module.exports.notifyTrello = async (cardDetails) => {
    if (!config.trelloApiKey) {
        console.warn('Trello API Key is not configured.');
        return;
    }

    try {
        await axios.post(
            `https://api.trello.com/1/cards?key=${config.trelloApiKey}&token=${process.env.TRELLO_TOKEN}`,
            {
                name: cardDetails.name,
                desc: cardDetails.description,
                idList: cardDetails.listId,
            }
        );
        console.log('Trello card created successfully.');
    } catch (error) {
        console.error('Error creating Trello card:', error);
    }
};