import { Order } from "../models/Order.js";

export const orderRepo = {
  async findByAwbNumbers(awbNumbers) {
    return Order.find({ awbNumber: { $in: awbNumbers } }).lean();
  },

  async listOverdueWithoutSettlement({ cutoffDate }) {
    // Orders delivered more than 14 days ago with no settlement records.
    return Order.aggregate([
      {
        $match: {
          deliveryDate: { $exists: true, $ne: null, $lt: cutoffDate }
        }
      },
      {
        $lookup: {
          from: "settlements",
          localField: "awbNumber",
          foreignField: "awbNumber",
          as: "sett"
        }
      },
      { $match: { "sett.0": { $exists: false } } },
      {
        $project: {
          _id: 1,
          awbNumber: 1,
          merchantId: 1,
          orderStatus: 1,
          codAmount: 1,
          declaredWeight: 1,
          deliveryDate: 1
        }
      }
    ]);
  }
};

