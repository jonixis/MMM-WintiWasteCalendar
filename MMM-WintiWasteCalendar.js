Module.register("MMM-WintiWasteCalendar", {
  defaults: {
    garbageUrl: "",
    compostUrl: "",
    recyclingUrl: "",
    maxWeeks: 2,
    updateInterval: 6 * 60 * 60 * 1000, // Update every six hours
  },

  wasteType: Object.freeze({
    garbage: {
      label: "Kehricht",
      icon: "fa-trash-can",
    },
    compost: {
      label: "Grüntour",
      icon: "fa-leaf",
    },
    recycling: {
      label: "Papier/Karton",
      icon: "fa-recycle",
    },
  }),

  nextPickups: null,

  getStyles() {
    return ["MMM-WintiWasteCalendar.css", "font-awesome.css"];
  },

  getScripts() {
    return ["moment.js"];
  },

  createIcon(name) {
    const element = document.createElement("i");
    element.classList.add("fa-solid", name);
    return element;
  },

  start() {
    Log.info("Starting module:", this.name);

    const fetchPickups = () =>
      this.sendSocketNotification("FETCH_PICKUPS", this.config);

    fetchPickups();
    setInterval(fetchPickups, this.config.updateInterval);
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "UPDATE_PICKUPS") {
      this.nextPickups = payload;
      this.updateDom();
    }
  },

  getDom() {
    const wrapper = document.createElement("div");

    if (!this.nextPickups?.length) {
      wrapper.innerHTML = this.translate("LOADING");
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    const pickupWrapper = document.createElement("div");
    pickupWrapper.classList.add("pickup-wrapper");

    for (const { dateString, pickup } of this.nextPickups) {
      const pickupContainer = document.createElement("div");
      pickupContainer.classList.add("pickup-container");

      const dateContainer = document.createElement("span");
      dateContainer.classList.add("pickup-date");

      const today = moment().startOf("day");
      const pickupDate = moment(dateString, "MM/DD/YY");
      if (today.isSame(pickupDate)) {
        dateContainer.innerHTML = this.translate("TODAY");
      } else if (moment(today).add(1, "days").isSame(pickupDate)) {
        dateContainer.innerHTML = this.translate("TOMORROW");
      } else if (moment(today).add(7, "days").isAfter(pickupDate)) {
        dateContainer.innerHTML = pickupDate.format("dddd");
      } else {
        dateContainer.innerHTML = pickupDate.format("MMMM D");
      }

      pickupContainer.appendChild(dateContainer);

      const iconContainer = document.createElement("span");
      iconContainer.classList.add("waste-pickup-icon-container");

      if (pickup.garbage) {
        iconContainer.appendChild(this.createIcon(this.wasteType.garbage.icon));
      }
      if (pickup.compost) {
        iconContainer.appendChild(this.createIcon(this.wasteType.compost.icon));
      }
      if (pickup.recycling) {
        iconContainer.appendChild(
          this.createIcon(this.wasteType.recycling.icon),
        );
      }

      pickupContainer.appendChild(iconContainer);

      pickupWrapper.appendChild(pickupContainer);
    }

    wrapper.appendChild(pickupWrapper);

    const legendWrapper = document.createElement("div");
    legendWrapper.classList.add("legend-wrapper");
    legendWrapper.classList.add("light");
    legendWrapper.appendChild(this.createLegendEntry(this.wasteType.garbage));
    legendWrapper.appendChild(this.createLegendEntry(this.wasteType.compost));
    legendWrapper.appendChild(this.createLegendEntry(this.wasteType.recycling));

    wrapper.appendChild(legendWrapper);

    return wrapper;
  },

  createLegendEntry(type) {
    const legendContainer = document.createElement("div");
    legendContainer.classList.add("legend-container");

    const iconContainer = document.createElement("span");
    iconContainer.classList.add("waste-pickup-icon-legend-container");
    iconContainer.appendChild(this.createIcon(type.icon));
    legendContainer.appendChild(iconContainer);

    const descriptionContainer = document.createElement("span");
    descriptionContainer.classList.add("pickup-date");
    descriptionContainer.innerHTML = type.label;
    legendContainer.appendChild(descriptionContainer);

    return legendContainer;
  },
});
