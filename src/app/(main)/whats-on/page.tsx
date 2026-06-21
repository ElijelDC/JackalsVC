import { WhatsOnPage } from "@/components/whats-on/WhatsOnPage";
import { getWhatsOnPageData } from "@/lib/whats-on";

export const metadata = {
  title: "What's On?",
};

export default async function WhatsOnRoute() {
  const data = await getWhatsOnPageData();
  return <WhatsOnPage {...data} />;
}
