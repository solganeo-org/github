require('dotenv').config(); // Load environment variables from .env file

module.exports = {
    port: process.env.PORT || 3000,
    webhookSecret: process.env.WEBHOOK_SECRET,
    logPath: process.env.LOG_PATH || './logs',
    githubToken: process.env.GITHUB_TOKEN,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    jiraApiKey: process.env.JIRA_API_KEY,
    jiraUrl: process.env.JIRA_URL,
    notificationServices: {
        slack: process.env.SLACK_WEBHOOK_URL ? true : false,
        discord: process.env.DISCORD_WEBHOOK_URL ? true : false,
        googleChat: process.env.GOOGLE_CHAT_WEBHOOK_URL ? true : false,
        jira: process.env.JIRA_API_KEY ? true : false,
        trello: process.env.TRELLO_API_KEY ? true : false,
    }
};