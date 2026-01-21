import type { Alpine } from "alpinejs";
import persist from "@alpinejs/persist";
import { isFromEU } from "detect-europe-js";


export default (Alpine: Alpine) => {
  Alpine.plugin(persist);


  Alpine.magic("money", () => {
    const formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  });

  Alpine.data("cookieConsent", () => ({
    state: Alpine.$persist("unknown").as("cookieConsent"),

    init() {
      this.dispatchEvent();
    },

    dialogue: {
      ["x-show"]() {
        return isFromEU() && this.state == "unknown";
      },
    },

    accept: {
      ["@click"]() {
        this.state = "accepted";

        this.dispatchEvent();
      },
    },

    decline: {
      ["@click"]() {
        this.state = "declined";

        this.dispatchEvent();
      },
    },

    dispatchEvent() {
      document.dispatchEvent(
        new CustomEvent("cookieConsent", {
          detail: this.state,
        })
      );
    },
  }));
};


