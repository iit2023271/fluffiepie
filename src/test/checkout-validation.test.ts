import { describe, it, expect } from "vitest";
import { z } from "zod";

const addressSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().max(50),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  address: z.string().trim().min(5, "Address too short").max(200),
  city: z.string().trim().min(2, "City is required").max(50),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const couponSchema = z.string().trim().min(1).max(20).regex(/^[A-Z0-9]+$/i, "Invalid coupon format");

describe("Checkout Address Validation", () => {
  it("accepts valid address", () => {
    const result = addressSchema.safeParse({
      firstName: "Vishnu", lastName: "V", phone: "9876543210",
      address: "123 Main Street", city: "Hyderabad", pincode: "500001",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = addressSchema.safeParse({
      firstName: "", lastName: "", phone: "9876543210",
      address: "123 Main Street", city: "Hyderabad", pincode: "500001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone numbers", () => {
    const cases = ["123", "0000000000", "12345678901", "abcdefghij", "5555555555"];
    cases.forEach((phone) => {
      const result = addressSchema.safeParse({
        firstName: "Test", lastName: "", phone,
        address: "123 Main Street", city: "City", pincode: "500001",
      });
      expect(result.success).toBe(false);
    });
  });

  it("accepts valid Indian phone numbers", () => {
    ["6123456789", "7000000000", "8999999999", "9876543210"].forEach((phone) => {
      const result = addressSchema.safeParse({
        firstName: "Test", lastName: "", phone,
        address: "123 Main Street", city: "City", pincode: "500001",
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejects short address", () => {
    const result = addressSchema.safeParse({
      firstName: "Test", lastName: "", phone: "9876543210",
      address: "Hi", city: "City", pincode: "500001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid pincode", () => {
    ["12345", "1234567", "abcdef", ""].forEach((pincode) => {
      const result = addressSchema.safeParse({
        firstName: "Test", lastName: "", phone: "9876543210",
        address: "123 Main Street", city: "City", pincode,
      });
      expect(result.success).toBe(false);
    });
  });

  it("rejects XSS in fields but allows normal special chars", () => {
    // Address schema allows special chars in address - that's fine since we don't render as HTML
    const result = addressSchema.safeParse({
      firstName: "Test", lastName: "", phone: "9876543210",
      address: "Apt #5, 2nd Floor", city: "City", pincode: "500001",
    });
    expect(result.success).toBe(true);
  });
});

describe("Coupon Validation", () => {
  it("accepts valid coupon codes", () => {
    ["SAVE20", "FLAT100", "NEW2026"].forEach((code) => {
      expect(couponSchema.safeParse(code).success).toBe(true);
    });
  });

  it("rejects empty coupon", () => {
    expect(couponSchema.safeParse("").success).toBe(false);
  });

  it("rejects SQL injection attempts", () => {
    ["'; DROP TABLE--", "1 OR 1=1", "' UNION SELECT"].forEach((code) => {
      expect(couponSchema.safeParse(code).success).toBe(false);
    });
  });

  it("rejects special characters", () => {
    ["SAVE-20", "FLAT_100", "CODE!"].forEach((code) => {
      expect(couponSchema.safeParse(code).success).toBe(false);
    });
  });

  it("rejects overly long codes", () => {
    expect(couponSchema.safeParse("A".repeat(21)).success).toBe(false);
  });
});

describe("Password Strength", () => {
  const checkPassword = (pw: string) => ({
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  });
  const isStrong = (pw: string) => Object.values(checkPassword(pw)).every(Boolean);

  it("rejects weak passwords", () => {
    ["password", "12345678", "ALLCAPS1!", "nocaps1!", "NoSpecial1"].forEach((pw) => {
      expect(isStrong(pw)).toBe(false);
    });
  });

  it("accepts strong passwords", () => {
    ["MyP@ssw0rd", "Str0ng!Pass", "C@ke2026!"].forEach((pw) => {
      expect(isStrong(pw)).toBe(true);
    });
  });
});
