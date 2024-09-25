const cheerio = require('cheerio');
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');
const zlib = require('zlib');
const childProcess = require("child_process");

const tmpFolder = './temp';
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder);
}

const api_key = '';  //put api key

async function GetOutputFb(url) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      k_exp: Math.floor(Date.now() / 1000) + (60 * 60),
      k_token: 'edc63f7155aac41195ecae629e9a36d129925b01a0f44898d8d236f21b5f2ec4',
      q: url,
      lang: 'en',
      web: 'fdownloader.net',
      v: 'v2',
      w: ''
    });

    const options = {
      hostname: 'v3.fdownloader.net',
      port: 443,
      path: '/api/ajaxSearch?lang=en',
      method: 'POST',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData.toString()),
        'DNT': '1',
        'Origin': 'https://fdownloader.net',
        'Priority': 'u=1, i',
        'Referer': 'https://fdownloader.net/',
        'Sec-Ch-Ua': '"Not)A;Brand";v="99", "Microsoft Edge";v="127", "Chromium";v="127"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
      },
    };

    const req = https.request(options, (res) => {
      let chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        let buffer = Buffer.concat(chunks);

        let responseData = '';
        if (res.headers['content-encoding'] === 'br') {
          zlib.brotliDecompress(buffer, (err, decompressed) => {
            if (err) {
              reject(err);
              return;
            }
            responseData = decompressed.toString();
            extractSDLink(responseData);
          });
        } else {
          responseData = buffer.toString();
          extractSDLink(responseData);
        }

        function extractSDLink(data) {
          try {
            const jsonData = JSON.parse(data);
            const htmlContent = jsonData.data;

            const $ = cheerio.load(htmlContent);

            const sdLinkElement = $('a[title="Download 360p (SD)"]');

            if (sdLinkElement.length > 0) {
              const sdLink = sdLinkElement.attr('href');
              resolve(sdLink);
            } else {
              reject(new Error('SD download link not found'));
            }

          } catch (err) {
            reject(err);
          }
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData.toString());
    req.end();
  });
}

async function GetOutputIns(url) {
  const response = await axios.get(`https://insta-kshitiz.vercel.app/insta?url=${url}`);
  return response.data.url;

}

async function GetOutputTik(url) {
  const formData = new FormData();
  formData.append('url', url);
  formData.append('lang', 'en1');
  formData.append('token', 'eyMTcyMDA5MTMwNA==c');

  const headers = {
    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
  };

  const response = await axios.post('https://snaptik.app/abc2.php', formData, { headers });
  const output = response.data;

  const decodedOutput = evalDecode(output);
  const html = extractHTMLFromJS(decodedOutput);

  const videoTitleMatch = html.match(/<div class="video-title">([^<]+)<\/div>/);
  const videoTitle = videoTitleMatch && videoTitleMatch[1] ? videoTitleMatch[1].trim() : null;

  const downloadUrlMatch = html.match(/href="([^"]+)"/);
  const downloadUrl = downloadUrlMatch && downloadUrlMatch[1] ? downloadUrlMatch[1].trim() : null;

  const usernameMatch = html.match(/<span>([^<]+)<\/span>/);
  const username = usernameMatch && usernameMatch[1] ? usernameMatch[1].trim() : null;

  return { title: videoTitle, videoUrl: downloadUrl, author: username };
}

function evalDecode(source) {
  try {
    const self = this;
    self._eval = self.eval;
    self.eval = (_code) => {
      self.eval = self._eval;
      return _code;
    };
    return self._eval(source);
  } catch (error) {
    return `Error decoding code: ${error.message}`;
  }
}

function extractHTMLFromJS(jsCode) {
  const htmlMatch = jsCode.match(/innerHTML = "(.*?)";/);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].replace(/\\"/g, '"').replace(/\\\\"/g, '\\"');
  }
  return null;
}

async function GetOutputX(url) {
  try {
    const payload = `page=${encodeURIComponent(url)}&ftype=all`;

    const response = await axios.post('https://twmate.com/', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
      },
    });

    const $ = cheerio.load(response.data);

    const downloadLinks = $('.btn-dl')
      .map((i, el) => $(el).attr('href'))
      .get();

    const secondLink = downloadLinks[1] || downloadLinks[0];

    return secondLink;

  } catch (error) {
    console.error("Error fetching or extracting download link:", error);
    return null;
  }
}

async function GetOutputYt(url) {
  try {
    const payload = {
      url: url,
      isAudioOnly: false,
      filenamePattern: "pretty",
    };

    const curlCommand = `curl -X POST \
      https://cnvmp3.com/fetch.php \
      -H 'Content-Type: application/json' \
      -d '${JSON.stringify(payload)}'`;

    const output = childProcess.execSync(curlCommand);
    const jsonData = JSON.parse(output.toString());
    const videoDownloadUrl = jsonData.url;

    const filename = `${Date.now()}.mp4`;
    const filePath = path.join(tmpFolder, filename);

    const downloadCommand = `curl -o "${filePath}" "${videoDownloadUrl}"`;
    childProcess.execSync(downloadCommand);

    return filePath; 
  } catch (error) {
    console.error("Error in GetOutputYt:", error);
    throw error;
  }
}

var url;

module.exports = {
  config: {
    name: 'autolink',
    version: '1.2.10',
    author: 'Shikaki',
    countDown: 5,
    role: 0,
    description: 'Auto video downloader for Instagram, Facebook, TikTok, Twitter and Youtube',
    category: 'media',
    guide: {
      en: "{pn} -> This will tell you whether autolink is on or off in that place.\n\n{pn} {{[on | off]}} -> This will either turn on or off the autolink in the place.",
    },
    autolinkon: "✅ Autolink is already enabled.\n\nTo disable it, use:\n{pn}autolink off.",
    autolinkoff: "❌ Autolink is currently disabled.\n\nTo enable it, use:\n{pn}autolink on.",
  },

  onStart: async function ({ event, message, args, prefix }) {
    const threadID = event.threadID;
    const autolinkFile = 'autolink.json';
    let autolinkData = {};

    if (fs.existsSync(autolinkFile)) {
      autolinkData = JSON.parse(fs.readFileSync(autolinkFile, 'utf8'));
    } else {
      autolinkData = {};
    }

    if (!autolinkData[threadID]) {
      autolinkData[threadID] = false;
      fs.writeFileSync(autolinkFile, JSON.stringify(autolinkData, null, 2));
    }
    if (!args[0]) {
      const autolinkStatus = autolinkData[threadID];
      if (autolinkStatus) {
        return message.reply(this.config.autolinkon.replace(/{pn}/g, prefix));
      } else {
        return message.reply(this.config.autolinkoff.replace(/{pn}/g, prefix));
      }
    }

    if (args[0].toLowerCase() === "on") {
      autolinkData[threadID] = true;
      fs.writeFileSync(autolinkFile, JSON.stringify(autolinkData, null, 2));
      return message.reply("✅ Autolink has been turned on here.");
    } else if (args[0].toLowerCase() === "off") {
      autolinkData[threadID] = false;
      fs.writeFileSync(autolinkFile, JSON.stringify(autolinkData, null, 2));
      return message.reply("❌ Autolink has been turned off here.");
    }
  },
  onChat: async function ({ message, event, api }) {
    const threadID = event.threadID;
    const autolinkFile = 'autolink.json';
    let autolinkData = {};

    if (fs.existsSync(autolinkFile)) {
      autolinkData = JSON.parse(fs.readFileSync(autolinkFile, 'utf8'));
    }

    const autolinkStatus = autolinkData[threadID];
    if (!autolinkStatus)
      return;

    if (event.body == "") {
      if (event.attachments[0].type == "share") {
        let url;
        if (event.attachments[0].url.includes("permalink.php")) {
          url = event.attachments[0].subattachments[0].url;
        } else {
          url = event.attachments[0].url;
        }

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          const randomFilename = `${Date.now()}.mp4`;
          const filePath = path.join(tmpFolder, randomFilename);
          const writer = fs.createWriteStream(filePath);

          const sdDownloadLink = await GetOutputFb(url);

          const response = await axios.get(sdDownloadLink, { responseType: 'stream' });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const stream = fs.createReadStream(filePath);
          await message.reply({
            attachment: stream
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          console.error(err);
          return;
        }
      }
    } else {
      url = event.body;
      if (url.includes("instagram.com")) {
        if (url === "instagram.com" || 
          url === "https://instagram.com" || 
          url === "http://instagram.com" || 
          url === "www.instagram.com" || 
          url === "https://www.instagram.com" || 
          url === "http://www.instagram.com") {
        return;
      }
        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          const randomFilename = `${Date.now()}.mp4`;
          const filePath = path.join(tmpFolder, randomFilename);
          const writer = fs.createWriteStream(filePath);

          const fullResponse = await GetOutputIns(url);

          const response = await axios.get(fullResponse, { responseType: 'stream' });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const stream = fs.createReadStream(filePath);
          await message.reply({
            attachment: stream
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          console.error(err);
          return;
        }
      }
      else if (url.includes("facebook.com") || url.includes("https://fb.watch")) {
        if (url === "facebook.com" || url === "https://facebook.com" ||
          url === "http://facebook.com" || url === "www.facebook.com" ||
          url === "https://www.facebook.com" || url === "http://www.facebook.com" ||
          url === "fb.watch" || url === "https://fb.watch" || url === "https://www.facebook.com/profile") {
          return;
        }

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        let url1;
        if (event.attachments[0].subattachments.length > 0) {
          url1 = event.attachments[0].subattachments[0].url;
        } else {
          url1 = event.attachments[0].url;
        }
        console.log(url1);

        try {
          const randomFilename = `${Date.now()}.mp4`;
          const filePath = path.join(tmpFolder, randomFilename);
          const writer = fs.createWriteStream(filePath);

          const sdDownloadLink = await GetOutputFb(url);

          const response = await axios.get(sdDownloadLink, { responseType: 'stream' });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const stream = fs.createReadStream(filePath);
          await message.reply({
            attachment: stream
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
          fs.rmdirSync(tempFolder);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          console.error(err);
          return;
        }
      } else if (url.includes("tiktok.com")) {
        if (url === "tiktok.com" || url === "https://tiktok.com" ||
          url === "http://tiktok.com" || url === "www.tiktok.com" ||
          url === "https://www.tiktok.com" || url === "http://www.tiktok.com") {
          return;
        }
        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          const randomFilename = `${Date.now()}.mp4`;
          const filePath = path.join(tmpFolder, randomFilename);
          const writer = fs.createWriteStream(filePath);

          const output = await GetOutputTik(url);
          const response = await axios.get(output.videoUrl, { responseType: 'stream' });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const stream = fs.createReadStream(filePath);
          await message.reply({
            body: `Title: ${output.title}\n\nBy: ${output.author}`,
            attachment: stream
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          console.error(err);
          return;
        }
      } else if (url.includes("x.com") || url.includes("twitter.com")) {
        if (url === "x.com" || url === "https://x.com" ||
          url === "https://twitter.com" || url === "www.x.com" ||
          url === "twitter.com" || url === "www.twitter.com") {
          return;
        }
        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          const randomFilename = `${Date.now()}.mp4`;
          const filePath = path.join(tmpFolder, randomFilename);
          const writer = fs.createWriteStream(filePath);

          const output = await GetOutputX(url);
          const response = await axios.get(output, { responseType: 'stream' });
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const stream = fs.createReadStream(filePath);
          await message.reply({
            attachment: stream
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
          fs.rmdirSync(tempFolder);
        } catch (err) {
          console.error("An error occurred:", err);
          api.setMessageReaction("❌", event.messageID, () => { }, true);
        }
      }
      else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        if (url === "youtube.com" || url === "https://youtube.com" ||
          url === "http://youtube.com" || url === "www.youtube.com" ||
          url === "https://www.youtube.com" || url === "http://www.youtube.com" ||
          url === "youtu.be" || url === "https://youtu.be" ||
          url === "http://youtu.be") {
          return;
        }

        api.setMessageReaction("⌛", event.messageID, () => { }, true);

        try {
          const filePath = await GetOutputYt(url);

          await message.reply({
            attachment: fs.createReadStream(filePath)
          });

          await api.setMessageReaction("✅", event.messageID, () => { }, true);

          fs.unlinkSync(filePath);
        } catch (err) {
          api.setMessageReaction("❌", event.messageID, () => { }, true);
          console.error(`Error: ${err.message}`);
          return;
        }
      }
      else {
        return;
      }
    }
  }
      }
