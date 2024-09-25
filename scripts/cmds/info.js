const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "owner",
    aliases: [],
    author: "kshitiz",
    version: "2.0",
    cooldowns: 5,
    role: 0,
    shortDescription: {
      en: ""
    },
    longDescription: {
      en: "get bot owner info"
    },
    category: "𝗢𝗪𝗡𝗘𝗥",
    guide: {
      en: "{p}{n}"
    }
  },
  onStart: async function ({ api, event }) {
      try {
        const loadingMessage = "Loading owner information...";
        await api.sendMessage(loadingMessage, event.threadID);

const ownerInfo = {
name: '𝗜𝘁𝗮𝗰𝗵𝗶',
gender: '𝐌𝐚𝐥𝐞',
hobby: '𝗔𝗻𝗶𝗺𝗲',
relationship: '𝟵𝟵+',
facebookLink: '',
bio: '𝗦𝗮𝗰𝗿𝗶𝗳𝗶𝗰𝗲𝘀 𝗳𝗼𝗿 𝘁𝗵𝗲 𝗳𝗿𝗶𝗲𝗻𝗱𝘀'
        };

        const videoUrl = '';
        const tmpFolderPath = path.join(__dirname, 'tmp');

        if (!fs.existsSync(tmpFolderPath)) {
          fs.mkdirSync(tmpFolderPath);
        }

        const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        const videoPath = path.join(tmpFolderPath, 'https://raw.githubusercontent.com/zoro-77/video-hosting/main/cache/video-1727278968443-237.mp4');

        fs.writeFileSync(videoPath, Buffer.from(videoResponse.data, 'binary'));

const response = `
𝗼𝘄𝗻𝗲𝗿 𝗶𝗻𝗳𝗼𝗿𝗺𝗮𝘁𝗶𝗼𝗻:
Name: ${ownerInfo.name}
Gender: ${ownerInfo.gender}
Hobby: ${ownerInfo.hobby}
Relationship: ${ownerInfo.relationship}
Facebook: ${ownerInfo.facebookLink}
Status: ${ownerInfo.bio}
        `;

        await api.sendMessage({
          body: response,
          attachment: fs.createReadStream(videoPath)
        }, event.threadID);
      } catch (error) {
        console.error('Error in owner command:', error);
        api.sendMessage('An error occurred while processing the command.', event.threadID);
      }
    },
    onChat: async function({ api, event }) {
      try {
        const lowerCaseBody = event.body.toLowerCase();

        if (lowerCaseBody === "info" || lowerCaseBody.startsWith("{p}owner")) {
          await this.onStart({ api, event });
        }
      } catch (error) {
        console.error('Error in onChat function:', error);
      }
    }
  };
