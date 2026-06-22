import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "./Index";

function renderPage() {
  return render(
    <BrowserRouter>
      <Index />
    </BrowserRouter>,
  );
}

describe("Index (smoke)", () => {
  it("merender tanpa crash dengan H1 yang terlihat", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Makan Bergizi Gratis/i);
  });

  it("menampilkan satuan waktu + porsi setelah memasukkan nominal", () => {
    renderPage();
    const input = screen.getByLabelText("Jumlah Rupiah");
    fireEvent.change(input, { target: { value: "1000000000" } }); // Rp 1 miliar
    expect((input as HTMLInputElement).value).toBe("1.000.000.000");
    // Rp 1 M = 100.000 porsi → "100 Rb", dan ada teks "porsi makan gratis"
    expect(screen.getAllByText(/porsi makan gratis/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("≈ 100 Rb").length).toBeGreaterThan(0);
  });

  it("punya mode toggle beraksesibilitas (radiogroup)", () => {
    renderPage();
    const group = screen.getByRole("radiogroup", { name: /mode kalkulator/i });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("aria-checked", "true"); // Hitung aktif
  });
});
