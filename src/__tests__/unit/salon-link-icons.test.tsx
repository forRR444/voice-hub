import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SALON_LINK_ICONS, SalonLinkIcon } from "@/lib/salon-link-icons";

describe("SALON_LINK_ICONS", () => {
  it("web, line, instagram, phone, mail, map の6種が定義されている", () => {
    const ids = SALON_LINK_ICONS.map((i) => i.id);
    expect(ids).toEqual(["web", "line", "instagram", "phone", "mail", "map"]);
  });
});

describe("SalonLinkIcon", () => {
  it("有効なiconでSVGが描画される", () => {
    const { container } = render(<SalonLinkIcon icon="web" size={18} color="#000" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("icon='none'で何も描画されない", () => {
    const { container } = render(<SalonLinkIcon icon="none" size={18} color="#000" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.innerHTML).toBe("");
  });
});
