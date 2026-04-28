import { safeRedirect } from "@/lib/safeRedirect";
import SubscribeSuccessContent from "./SubscribeSuccessContent";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

const SubscribeSuccessPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const next = safeRedirect(params.next ?? null);
  return <SubscribeSuccessContent next={next} />;
};

export default SubscribeSuccessPage;
