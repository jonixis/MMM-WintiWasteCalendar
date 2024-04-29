const NodeHelper = require("node_helper");
const Log = require("logger");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

module.exports = NodeHelper.create({
  monthToNumber: Object.freeze(
    new Map([
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
  ),

  config: {},

  wasteType: Object.freeze({
    garbage: "garbage",
    compost: "compost",
    recycling: "recycling",
  }),

  start() {
    Log.info(`Starting node_helper for module: ${this.name}`);
  },

  async socketNotificationReceived(notification, payload) {
    this.config = payload;
    if (notification === "FETCH_PICKUPS") {
      try {
        const garbagePickups = await this.fetchPickups(this.wasteType.garbage);
        const compostPickups = await this.fetchPickups(this.wasteType.compost);
        const recyclingPickups = await this.fetchPickups(
          this.wasteType.recycling,
        );
        const pickups = this.mergePickups(
          garbagePickups,
          compostPickups,
          recyclingPickups,
        );

        this.sendSocketNotification(
          "UPDATE_PICKUPS",
          Array.from(pickups, ([dateString, pickup]) => ({
            dateString,
            pickup,
          })),
        );
      } catch (error) {
        Log.error(`${this.name} error while fetching pickups: ${error}`);
      }
    }
  },

  async fetchPickups(type) {
    const url = this.getUrl(type);
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    const rows = $(".theRow");

    const pickups = new Map();
    for (let i = 0; i < rows.length; ++i) {
      const scrapedDate = $(rows[i]).find(".theDate").text();

      const day = scrapedDate.substring(4, 6);
      const month = this.monthToNumber.get(scrapedDate.substring(8, 11));
      const year = scrapedDate.substring(15, 17);

      const dateString = [month, day, year].join("/");
      const date = moment(dateString, "MM/DD/YY");

      const maxDate = moment()
        .startOf("day")
        .add(this.config.maxWeeks * 7, "days");
      const isValid = date.isBefore(maxDate, "day");
      if (!isValid) {
        break;
      }

      const pickup = this.createPickup(type);
      pickups.set(dateString, pickup);
    }

    return pickups;
  },

  createPickup(type) {
    return {
      [this.wasteType.garbage]: type === this.wasteType.garbage,
      [this.wasteType.compost]: type === this.wasteType.compost,
      [this.wasteType.recycling]: type === this.wasteType.recycling,
    };
  },

  getUrl(type) {
    return type === this.wasteType.garbage
      ? this.config.garbageUrl
      : type === this.wasteType.compost
        ? this.config.compostUrl
        : this.config.recyclingUrl;
  },

  mergePickups(...pickupLists) {
    const mergedPickups = new Map();
    for (const pickups of pickupLists) {
      for (const [date, pickup] of pickups) {
        const existingPickup = mergedPickups.get(date);
        if (existingPickup) {
          existingPickup.garbage = existingPickup.garbage || pickup.garbage;
          existingPickup.compost = existingPickup.compost || pickup.compost;
          existingPickup.recycling =
            existingPickup.recycling || pickup.recycling;
        } else {
          mergedPickups.set(date, pickup);
        }
      }
    }
    return mergedPickups;
  },
});
