const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "lines",
    aliases: ["line", "sads", "squote"],
    version: "1.0",
    author: "Birendra Joshi",
    role: 0,
    shortDescription: { en: "Get a random sad quote." },
    longDescription: { en: "Fetch a random sad quote from the predefined list." },
    category: "fun",
    guide: { en: "Use {p}lines to get a random sad quote." }
  },
  onStart: async function ({ api, event }) {
    try {
      // Define an array of sad lines
      const sadLines = [
        "सम्बन्धले ठूलो पाठ सिकायो, आशा गर्नु तर भरोसा नगर्नु माया गर्नु तर मरिहत्ते कसैलाई नगर्नु ।❤️‍🩹",
        "धित मरुन्जेल हेर्ने थिए तिमीलाई, यदि त्यो नै अन्तिम भेट हो भन्ने थाहा भैदिएको भए।❤️‍🩹",
        "त्यो घण्टौ नसुतेर बोलेको रातहरुलाई सोध कति माया थियो यो मेरो मुटुमा तिम्रो लागि।❤️‍🩹",
        "बदनाम त हुन नै थियो, स्वाभिमान भुलेर मर्हेस्ते मैले नै गरेको थिएँ।❤️‍🩹",
        "मन मरेपछि हो पछाडी हटेको, नत्र त प्राण अडिएको थियो तिमी प्रती।❤️‍🩹"
      ];
      
      

      // React to the message with a waiting symbol
      const waitingSymbol = "⌛";
      await api.setMessageReaction(waitingSymbol, event.messageID);

      // Randomly select a sad line
      const randomIndex = Math.floor(Math.random() * sadLines.length);
      const selectedSadLine = sadLines[randomIndex];

      // Send the selected sad line as a message
      const messageBody = `"${selectedSadLine}"`;
      api.sendMessage(messageBody, event.threadID, (err, info) => {
        if (err) {
          console.error('Error occurred:', err);
          const errorMessage = `An error occurred while sending the sad line: ${err.message}`;
          api.sendMessage(errorMessage, event.threadID, (err) => {
            if (err) {
              console.error('Error occurred:', err);
            }
          });
        } else {
          // React with a success symbol
          const successSymbol = "✅";
          api.setMessageReaction(successSymbol, event.messageID, (err) => {
            if (err) {
              console.error('Error occurred:', err);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error occurred:', error);
      const errorMessage = `An error occurred while sending the sad line: ${error.message}`;
      api.sendMessage(errorMessage, event.threadID, (err) => {
        if (err) {
          console.error('Error occurred:', err);
        }
      });
    }
  }
};
