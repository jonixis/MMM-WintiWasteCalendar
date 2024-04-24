Module.register("MMM-WintiWasteCalendar", {
	defaults: {
		garbageUrl: "https:m.winterthur.ch/index.php?apid=3041966&apparentid=5704846",
		compostUrl: "https:m.winterthur.ch/index.php?apid=3041966&apparentid=5704846",
		recyclingUrl: "https:m.winterthur.ch/index.php?apid=3041966&apparentid=5704846",
		maxEntries: 3
	},

	wasteTypes: {
		garbage: {
			label: "Kehricht",
			icon: "fa-trash-can"
		},
		compost: {
			label: "Grüntour",
			icon: "fa-leaf"
		},
		recycling: {
			label: "Papier/Karton",
			icon: "fa-recycle"
		}
	},

	nextPickups: [
		{
			date: "04/22/2024",
			garbage: true,
			compost: true,
			recycling: true
		}
	],

	getStyles () {
		return ["MMM-WintiWasteCalendar.css", "font-awesome.css"];
	},

	getScripts () {
		return ["moment.js"];
	},

	createIcon (name) {
		const element = document.createElement("i");
		element.classList.add("fa-solid", name);
		return element;
	},

	start () {
		Log.info("Starting module:", this.name);

		this.sendSocketNotification("FETCH_DATES", this.config);
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "NEW_DATES") {
			this.nextPickups = payload;
		}
	},

	getDom () {
		Log.info("sdf");
		const wrapper = document.createElement("div");

		if (this.nextPickups.length === 0) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		const pickupWrapper = document.createElement("div");
		pickupWrapper.classList.add("pickup-wrapper");

		for (let i = 0; i < this.nextPickups.length; ++i) {
			const pickup = this.nextPickups[i];

			const pickupContainer = document.createElement("div");
			pickupContainer.classList.add("pickup-container");

			const dateContainer = document.createElement("span");
			dateContainer.classList.add("pickup-date");

			const today = moment().startOf("day");
			const pickUpDate = moment(pickup.date);
			if (today.isSame(pickUpDate)) {
				dateContainer.innerHTML = this.translate("TODAY");
			} else if (moment(today).add(1, "days").isSame(pickUpDate)) {
				dateContainer.innerHTML = this.translate("TOMORROW");
			} else if (moment(today).add(7, "days").isAfter(pickUpDate)) {
				dateContainer.innerHTML = pickUpDate.format("dddd");
			} else {
				dateContainer.innerHTML = pickUpDate.format("MMMM D");
			}

			pickupContainer.appendChild(dateContainer);

			const iconContainer = document.createElement("span");
			iconContainer.classList.add("waste-pickup-icon-container");

			if (pickup.garbage) {
				iconContainer.appendChild(this.createIcon(this.wasteTypes.garbage.icon));
			}
			if (pickup.compost) {
				iconContainer.appendChild(this.createIcon(this.wasteTypes.compost.icon));
			}
			if (pickup.recycling) {
				iconContainer.appendChild(this.createIcon(this.wasteTypes.recycling.icon));
			}

			pickupContainer.appendChild(iconContainer);

			pickupWrapper.appendChild(pickupContainer);
		}

		wrapper.appendChild(pickupWrapper);

		const legendWrapper = document.createElement("div");
		legendWrapper.classList.add("legend-wrapper");
		legendWrapper.classList.add("light");
		legendWrapper.appendChild(
			this.createLegendEntry(this.wasteTypes.garbage)
		);
		legendWrapper.appendChild(
			this.createLegendEntry(this.wasteTypes.compost)
		);
		legendWrapper.appendChild(
			this.createLegendEntry(this.wasteTypes.recycling)
		);

		wrapper.appendChild(legendWrapper);

		return wrapper;
	},

	createLegendEntry (type) {
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
	}

});
