const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'hello',
    category: 'utils',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'hello',
    examples: ['hello',],
    description: 'La commande hello world',
    async run(client, message, args) {
        const embed = new MessageEmbed()
            .setTitle('Hello World')
            .setDescription('Hello World')
            .setColor('RANDOM')
        message.channel.send({ embeds: [embed] })
    },
    async runInteraction(client, interaction) {
        const embed = new MessageEmbed()
            .setTitle('Hello World')
            .setDescription('Hello World')
            .setColor('RANDOM')
        await interaction.reply({ embeds: [embed] })
    }
};