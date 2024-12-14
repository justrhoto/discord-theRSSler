const { SlashCommandBuilder } = require('discord.js');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

const feedsFilePath = path.join(__dirname, '..', 'feeds.json');

const loadFeeds = () => {
    if (fs.existsSync(feedsFilePath)) {
        const data = fs.readFileSync(feedsFilePath);
        return JSON.parse(data);
    }
    return { feeds: [] };
};

const saveFeeds = (feeds) => {
    fs.writeFileSync(feedsFilePath, JSON.stringify(feeds, null, 2));
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-feed')
        .setDescription('Add feed to channel')
        .addStringOption(option => option
            .setName('rss_url')
            .setDescription('The RSS feed URL')
            .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const rssUrl = interaction.options.getString('rss_url');
        const feed = await parser.parseURL(rssUrl);

        if (!feed || feed.items.length === 0) {
            await interaction.editReply('Invalid or empty RSS feed provided.');
            return;
        }

        const feedsData = loadFeeds();
        const existingFeed = feedsData.feeds.find(f => f.url === rssUrl);

        if (existingFeed) {
            await interaction.editReply(`Feed ${feed.title} is already added.`);
            return;
        }

        feedsData.feeds.push({ url: rssUrl, lastPostedItemUrl: null });
        saveFeeds(feedsData.feeds);

        const fetchAndSendFeedUpdates = async () => {
            try {
                const feed = await parser.parseURL(rssUrl);
                const firstItemUrl = feed.items[0].content.match(/https?:\/\/.*?.jpg/)[0];

                const currentFeed = feedsData.feeds.find(f => f.url === rssUrl);
                if (firstItemUrl !== currentFeed.lastPostedItemUrl) {
                    currentFeed.lastPostedItemUrl = firstItemUrl;
                    await interaction.channel.send(`New ${feed.title} post! <${feed.items[0].link}>`);
                    await interaction.channel.send(`${firstItemUrl}`);
                    saveFeeds(feedsData.feeds);
                }
            } catch (error) {
                console.error('Error fetching RSS feed:', error);
            }
        };

        setInterval(fetchAndSendFeedUpdates, 900000);

        await interaction.editReply(`Feed ${feed.title} added to ${interaction.channel}`);
    },
};

const savedFeeds = loadFeeds();