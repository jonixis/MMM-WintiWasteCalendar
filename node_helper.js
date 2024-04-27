const NodeHelper = require("node_helper");
const Log = require("logger");
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = NodeHelper.create({
  monthToNumber: new Map([
    ["Jan", "01"],
    ["Feb", "02"],
    ["Mär", "03"],
    ["Apr", "04"],
    ["Mai", "05"],
    ["Jun", "06"],
    ["Jul", "07"],
    ["Aug", "08"],
    ["Sep", "09"],
    ["Okt", "10"],
    ["Nov", "11"],
    ["Dez", "12"],
  ]),

  config: {},

  start() {
    Log.info(`Starting node_helper for module: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    this.config = payload;
    if (notification === "FETCH_DATES") {
      const pickups = await this.fetchDates();
      this.sendSocketNotification("NEW_DATES", pickups);
    }
  },

  async fetchDates() {
    const response = await axios.get(this.config.garbageUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const rows = $(".theRow");

    const pickups = [];
    for (let i = 0; i < this.config.maxEntries; ++i) {
      const scrapedDate = $(rows[i]).find(".theDate").text();

      const date = {};
      date.day = scrapedDate.substring(4, 6);
      date.month = this.monthToNumber.get(scrapedDate.substring(8, 11));
      date.year = scrapedDate.substring(15, 17);
    }

    return pickups;
  },

  createPickup(type, date) {
    const pickup = {
      date,
    };
  },
});
