import { ScrollText, X } from "lucide-react";

const termsSections = [
  {
    title: "1. Eligibility",
    body: "You must be at least 18 years old and legally able to use this service. By creating an account, you confirm that you meet this requirement. Do not create or use an account if you are under 18.",
  },
  {
    title: "2. Informational use only",
    body: "StockAI provides educational market information and analytical tools. It is not investment, financial, tax, or legal advice, and it does not make personalized recommendations or offers to buy or sell securities. Nothing in the service creates an adviser-client relationship.",
  },
  {
    title: "3. Investment risk",
    body: "Investing involves risk, including possible loss of some or all of your capital. Prices can move unpredictably. Historical results, indicators, model outputs, signals, and forecasts do not guarantee future performance. Consider your circumstances and consult a qualified professional before making investment decisions.",
  },
  {
    title: "4. Market data and AI outputs",
    body: "Market data may be delayed, incomplete, inaccurate, or unavailable and may come from third-party providers. AI predictions and confidence scores are estimates, can be wrong, and should not be relied on as the sole basis for a decision. Verify important information with authoritative sources.",
  },
  {
    title: "5. No trading or execution",
    body: "StockAI is an analysis tool and does not place, route, or execute trades. You are responsible for decisions and transactions made through any broker or other service you choose to use.",
  },
  {
    title: "6. Accounts and acceptable use",
    body: "Provide accurate registration information, protect your sign-in credentials, and promptly secure your account if you suspect unauthorized access. Do not misuse the service, interfere with its security, or use it in a way that violates applicable law.",
  },
  {
    title: "7. Availability and changes",
    body: "Features, data, and the service itself may change or become unavailable. We may update these terms; continued use after an updated version is presented means you accept the updated terms. If you do not agree, stop using the service.",
  },
  {
    title: "8. Your local requirements",
    body: "You are responsible for confirming that your use of StockAI and any investment activity complies with the laws and regulations that apply where you live.",
  },
];

export function TermsAndConditions({ onClose }) {
  const isDialog = typeof onClose === "function";

  return (
    <div className={isDialog ? "terms-overlay" : "terms-page-shell"}>
      <article
        className={`terms-document ${isDialog ? "terms-document-dialog" : ""}`}
        role={isDialog ? "dialog" : "region"}
        aria-modal={isDialog || undefined}
        aria-labelledby="terms-title"
      >
        <header className="terms-heading">
          <span className="terms-icon"><ScrollText size={20} /></span>
          <div>
            <span className="eyebrow">STOCKAI ACCOUNT TERMS</span>
            <h2 id="terms-title">Terms &amp; Conditions</h2>
            <p>Read these terms before creating or using an account.</p>
          </div>
          {isDialog && (
            <button className="terms-close" type="button" onClick={onClose} aria-label="Close terms">
              <X size={18} />
            </button>
          )}
        </header>

        <div className="terms-age-notice">
          <strong>Adults 18 and older only</strong>
          <span>You must be at least 18 to register or use StockAI.</span>
        </div>

        <div className="terms-sections">
          {termsSections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <p className="terms-draft-note">
          These terms are a product draft, not legal advice. Obtain qualified legal review and add any required privacy, jurisdiction, and provider-specific terms before public launch.
        </p>
      </article>
    </div>
  );
}
