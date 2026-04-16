import Page from "@/components/common/Page";
import Row from "@/components/common/Row";
import { PlanCard } from "@/components/subscriptions/PlanCard";
import { subscriptionService } from "@/services/subscriptionService";
import { safeRedirect } from "@/lib/safeRedirect";

interface Props {
  searchParams?: Promise<{ next?: string }>;
}

const PricingPageContent = async ({ searchParams }: Props) => {
  const plans = await subscriptionService.getPlans();
  const params = searchParams ? await searchParams : {};
  const safeNext = safeRedirect(params.next ?? null) ?? undefined;

  return (
    <Page className="" FULL={false}>
      <Row className="text-center py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground mb-10">
          Cancel anytime. Upgrade or downgrade whenever.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} next={safeNext} />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          All plans include access to free articles.
        </p>
      </Row>
    </Page>
  );
};

export default PricingPageContent;
