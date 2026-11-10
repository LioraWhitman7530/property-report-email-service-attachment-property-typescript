import { deliverReport } from "../src/report_delivery";

const recipient = process.env.DEMO_EMAIL_TO;
if (!recipient) throw new Error("DEMO_EMAIL_TO is required");

const result = await deliverReport({
  propertyId: "oak-17",
  propertyName: "Oak Street Apartments",
  recipient,
  maintenanceOpen: 2,
  documentsDue: 1,
  inspectionDue: true
});
console.log("report delivered:", result);
