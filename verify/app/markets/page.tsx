import MarketDeck from "@/components/market-deck";
import { SkinProvider } from "@/components/skin-provider";

export const metadata = {
  title: "Markets — MAD Gambit",
  description: "Prediction · Conviction · Perps, on one instrument language.",
};

export default function MarketsPage() {
  return (
    <SkinProvider>
      <MarketDeck />
    </SkinProvider>
  );
}
