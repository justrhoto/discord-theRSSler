const { SlashCommandBuilder } = require('discord.js');
const Parser = require('rss-parser');

const parser = new Parser();
let lastFeedItemUrl = null;

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

        const fetchAndSendFeedUpdates = async () => {
            try {
                const feed = await parser.parseURL(rssUrl);
                const firstItemUrl = feed.items[0].content.match(/https?:\/\/.*?.jpg/)[0];

                if (firstItemUrl !== lastFeedItemUrl) {
                    lastFeedItemUrl = firstItemUrl;
                    await interaction.channel.send(`New ${feed.title} post! <${feed.items[0].link}>`);
                    await interaction.channel.send(`${firstItemUrl}`);
                }
            } catch (error) {
                console.error('Error fetching RSS feed:', error);
            }
        };

        setInterval(fetchAndSendFeedUpdates, 900000);

        await interaction.editReply(`Feed ${feed.title} added to ${interaction.channel}`);
    },
};