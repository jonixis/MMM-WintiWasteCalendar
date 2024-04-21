Module.register("WintiWasteCalendar", {
  defaults: {
    text: "Hello World!",
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = this.config.text;
    return wrapper;
  },
});
