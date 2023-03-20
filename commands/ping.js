const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),
    async execute(interaction) {
        await interaction.reply(`hey ${interaction.user.username}, pong deez nuts!`)
    }
}