import { describe, it, expect } from "vitest";
import { yildizTheme } from "../src/theme";
import {
  Button,
  Card,
  Badge,
  CashRegisterPOS,
  AppointmentManager,
  StockManager,
  SupplierManager,
  ServiceManager,
  StaffCommissionManager,
  AdminDashboard,
  BookingWizardModal,
  Toast,
  PasswordInput,
} from "../src/index";

describe("Yıldız UI Teması", () => {
  it("şartnamedeki kurumsal renk kodlarını eksiksiz içerir", () => {
    expect(yildizTheme.colors.bg.primary).toBe("#FAF7F2");
    expect(yildizTheme.colors.bg.secondary).toBe("#F3EDE4");
    expect(yildizTheme.colors.accent.gold).toBe("#C9A96E");
    expect(yildizTheme.colors.accent.pink).toBe("#E8B4B8");
    expect(yildizTheme.colors.text.primary).toBe("#2C2C2C");
    expect(yildizTheme.colors.text.secondary).toBe("#6B6B6B");
    expect(yildizTheme.colors.border).toBe("#E5E0D8");
  });

  it("tüm modüler domain ve UI bileşenlerini başarıyla dışa aktarır", () => {
    expect(Button).toBeDefined();
    expect(Card).toBeDefined();
    expect(Badge).toBeDefined();
    expect(CashRegisterPOS).toBeDefined();
    expect(AppointmentManager).toBeDefined();
    expect(StockManager).toBeDefined();
    expect(SupplierManager).toBeDefined();
    expect(ServiceManager).toBeDefined();
    expect(StaffCommissionManager).toBeDefined();
    expect(AdminDashboard).toBeDefined();
    expect(BookingWizardModal).toBeDefined();
    expect(Toast).toBeDefined();
    expect(PasswordInput).toBeDefined();
  });
});
