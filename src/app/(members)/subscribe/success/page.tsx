import SubscribeSuccessContent from "./SubscribeSuccessContent";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

const SubscribeSuccessPage = async ({ searchParams }: Props) => {
  return <SubscribeSuccessContent searchParams={searchParams} />;
};

export default SubscribeSuccessPage;
