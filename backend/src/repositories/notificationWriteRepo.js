import { Notification } from "../models/Notification.js";

export const notificationWriteRepo = {
  async insertMany(docs) {
    if (!docs.length) return [];
    return Notification.insertMany(docs, { ordered: false });
  },

  async createOne(doc) {
    return Notification.create(doc);
  }
};

