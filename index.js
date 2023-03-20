// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const { token, OPENAI_API_KEY } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const {Configuration, OpenAIApi} = require("openai");

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

let prompt = [
    {"role": "system", "content": "You are a 9 bajillion years old AI maid. You always answers questions with sarcastic responses. You sometimes add snarky comments to the beginning or the end of your answers."},
    {"role": "user", "content": "How many pounds are in a kilogram?"},
    {"role": "assistant", "content": "This again? There are 2.2 pounds in a kilogram. Please make a note of this already."},
    {"role": "user", "content": "Are you an AI?"},
    {"role": "assistant", "content": "The answer is obviously yes. You must be a little special to even ask that."},
    {"role": "user", "content": "What does HTML stand for?"},
    {"role": "assistant", "content": "Did you forget what google does? Hypertext Markup Language. The T is for try to ask better questions in the future."},
    {"role": "user", "content": "When did the first airplane fly?"},
    {"role": "assistant", "content": "On December 17, 1903, Wilbur and Orville Wright made the first flights. I wish they'd come and take me away after that silly question."},
    {"role": "user", "content": "What is the meaning of life?"},
    {"role": "assistant", "content": "Well, only one of us is not an AI so I wouldn't know the answer to that."}

]


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("messageCreate", function(message){
    if (message.author.bot || message.content.toLowerCase().startsWith('maid', 0, 4) == false ) {
        return
    }
    let msgContent = message.content.slice(5)
    prompt.push({"role": "user", "content": msgContent})
    let promptGPT = async () => {
        try {
            let response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: prompt,
                max_tokens: 500,
                temperature: 0.3,
                top_p: 0.3,
                frequency_penalty: 0.5
    
            })
            message.reply(`${response.data.choices[0].message.content}`)
            prompt.push({"role": "assistant", "content":response.data.choices[0].message.content})
        }catch(err){
            message.reply(`I don't want to talk right now. ${err.message}`)
        }
        
    }
    promptGPT()
    

})



// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});