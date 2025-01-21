const { SlashCommandBuilder, Events } = require('discord.js');
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

const feedsFilePath = path.join(__dirname, '..', 'feeds.json');

const intervals = [];

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

const fetchAndSendFeedUpdates = async (rssUrl, channel) => {
    try {
        console.log(`Fetching ${rssUrl}`)
        const feedsData = loadFeeds();
        const feed = await parser.parseURL(rssUrl);

        const currentFeed = feedsData.feeds.find(f => f.url === rssUrl && f.channel.id === channel.id);
        if (feed.items[0].link !== currentFeed.lastPostedItemUrl) {
            console.log(`New link: ${feed.items[0].link}`);
            currentFeed.lastPostedItemUrl = feed.items[0].link;
            await channel.send(`New ${feed.title} post! <${feed.items[0].link}>`);

            const firstItemUrl = feed.items[0].content.match(/https?:\/\/.*?.jpg/)[0];
            await channel.send(`${firstItemUrl}`);

            saveFeeds(feedsData);
        }
        console.log(`Success`);
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
    }
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
        await interaction.deferReply();

        if (interaction.user.id != process.env.ADMIN_USER_ID) {
            await interaction.editReply('You must be an admin to run this command.');
            return;
        }

        const rssUrl = interaction.options.getString('rss_url');
        const feed = await parser.parseURL(rssUrl);

        if (!feed || feed.items.length === 0) {
            await interaction.editReply('Invalid or empty RSS feed provided.');
            return;
        }

        const feedsData = loadFeeds();
        const existingFeed = feedsData.feeds.find(f => f.url === rssUrl && f.channel.id === interaction.channel.id);

        if (existingFeed) {
            await interaction.editReply(`Feed ${feed.title} is already added.`);
            return;
        }

        feedsData.feeds.push({ url: rssUrl, lastPostedItemUrl: null, channel: interaction.channel });
        saveFeeds(feedsData);

        fetchAndSendFeedUpdates(rssUrl, interaction.channel);
        intervals.push(setInterval(() => fetchAndSendFeedUpdates(rssUrl, interaction.channel), 900000));

        await interaction.editReply(`Feed ${feed.title} added to ${interaction.channel}`);
    },
    init: (client) => {
        intervals.length = 0;
        if (client.isReady()) {
            initFeeds(client);
            return;
        }
        client.on(Events.ClientReady, readyClient => {
            initFeeds(readyClient);
        });
    },
    unload: () => {
        console.log(`Clearing ${intervals.length} intervals before unloading rssReader`);
        while (intervals.length) {
            clearInterval(intervals.pop());
        }
    }
};

const initFeeds = (client) => {
    const savedFeeds = loadFeeds();
    savedFeeds.feeds.forEach(async feed => {
        const channel = await client.channels.fetch(feed.channel.id);
        fetchAndSendFeedUpdates(feed.url, channel);
        intervals.push(setInterval(() => fetchAndSendFeedUpdates(feed.url, channel), 900000));
        console.log(`${feed.url}: Feed loaded from config.`);
    });
    console.log(`RSS feed module initialized`);
}
