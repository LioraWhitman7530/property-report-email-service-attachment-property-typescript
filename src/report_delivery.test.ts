import test from "node:test";
import assert from "node:assert/strict";
import { reportRequest, shouldEmailReport } from "./report_delivery";

test("emails a property manager when an inspection reminder is due", () => {
  const input = reportRequest.parse({
    propertyId: "oak-17",
    propertyName: "Oak Street Apartments",
    recipient: "manager@example.com",
    maintenanceOpen: 0,
    documentsDue: 0,
    inspectionDue: true
  });
  assert.equal(shouldEmailReport(input), true);
});

test("keeps quiet for a clear property", () => {
  const input = reportRequest.parse({
    propertyId: "oak-17",
    propertyName: "Oak Street Apartments",
    recipient: "manager@example.com",
    maintenanceOpen: 0,
    documentsDue: 0,
    inspectionDue: false
  });
  assert.equal(shouldEmailReport(input), false);
});
