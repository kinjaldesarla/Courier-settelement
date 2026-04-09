import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    awbNumber: { type: String, required: true, trim: true },
    merchantId: { type: String, required: true, trim: true },
    courierPartner: { type: String, required: true, trim: true },
    orderStatus: {
      type: String,
      required: true,
      enum: ["DELIVERED", "RTO", "IN_TRANSIT", "LOST"]
    },
    codAmount: { type: Number, required: true, min: 0 },
    declaredWeight: { type: Number, required: true, min: 0 },
    orderDate: { type: Date, required: true },
    deliveryDate: { type: Date }
  },
  { timestamps: true }
);

OrderSchema.index({ awbNumber: 1 }, { unique: true });
OrderSchema.index({ merchantId: 1, orderStatus: 1, orderDate: -1 });
OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

