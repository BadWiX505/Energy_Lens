import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

eventBus.on("event", (data) => {
  console.log("Event received:", data);
});
