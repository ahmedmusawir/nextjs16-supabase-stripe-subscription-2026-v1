import PricingPageContent from "./PricingPageContent";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

const PricingPage = async ({ searchParams }: Props) => {
  return <PricingPageContent searchParams={searchParams} />;
};

export default PricingPage;
