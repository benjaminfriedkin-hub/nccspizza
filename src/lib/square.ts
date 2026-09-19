import { SquareClient, SquareEnvironment, SquareError } from "square";

const GENERIC_DECLINE_MESSAGE = "Your card was declined. Please check your card details or try a different card.";

// Square's own `detail` strings are written for developers (e.g. "Authorization
// error: 'GENERIC_DECLINE'") — translate the codes parents are actually likely
// to hit into something a parent can act on. Falls back to the generic message
// for anything not explicitly listed here, so we never surface Square's raw
// internal wording to a customer.
const DECLINE_CODE_MESSAGES: Record<string, string> = {
  CARD_DECLINED: GENERIC_DECLINE_MESSAGE,
  GENERIC_DECLINE: GENERIC_DECLINE_MESSAGE,
  CVV_FAILURE: "The card's security code (CVV) didn't match. Please double-check it and try again.",
  ADDRESS_VERIFICATION_FAILURE: "The billing zip code didn't match. Please double-check it and try again.",
  INVALID_EXPIRATION: "The card's expiration date looks invalid. Please double-check it and try again.",
  CARD_EXPIRED: "This card has expired. Please try a different card.",
  INSUFFICIENT_FUNDS: "This card was declined for insufficient funds. Please try a different card.",
  CARD_NOT_SUPPORTED: "This card type isn't supported. Please try a different card.",
  INVALID_ACCOUNT: "This card couldn't be verified. Please try a different card.",
  TRANSACTION_LIMIT: "This card's transaction limit was reached. Please try a different card.",
};

function friendlyDeclineMessage(code: string, detail?: string): string {
  return DECLINE_CODE_MESSAGES[code] ?? detail ?? GENERIC_DECLINE_MESSAGE;
}

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID;

export function isSquareConfigured(): boolean {
  return Boolean(ACCESS_TOKEN && LOCATION_ID);
}

let client: SquareClient | null = null;
function getClient(): SquareClient {
  if (!client) {
    client = new SquareClient({
      token: ACCESS_TOKEN,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }
  return client;
}

export interface ChargeResult {
  paymentMode: "mock" | "square";
  paymentStatus: "paid" | "failed";
  squarePaymentId?: string;
  errorMessage?: string;
}

interface ChargeInput {
  idempotencyKey: string;
  amountCents: number;
  sourceId?: string;
}

/**
 * Charges a card via Square, or — if no Square credentials are configured —
 * records the order as paid via a clearly-labeled mock path so the full
 * checkout flow is testable locally without a Square account.
 */
export async function chargeOrder(input: ChargeInput): Promise<ChargeResult> {
  if (!isSquareConfigured()) {
    return { paymentMode: "mock", paymentStatus: "paid" };
  }

  if (!input.sourceId) {
    return {
      paymentMode: "square",
      paymentStatus: "failed",
      errorMessage: "Missing card payment token",
    };
  }

  try {
    const response = await getClient().payments.create({
      sourceId: input.sourceId,
      idempotencyKey: input.idempotencyKey,
      amountMoney: {
        amount: BigInt(input.amountCents),
        currency: "USD",
      },
      locationId: LOCATION_ID,
    });

    if (response.errors && response.errors.length > 0) {
      const first = response.errors[0];
      console.error("Square payment declined", response.errors);
      return {
        paymentMode: "square",
        paymentStatus: "failed",
        errorMessage: friendlyDeclineMessage(first.code, first.detail),
      };
    }

    return {
      paymentMode: "square",
      paymentStatus: "paid",
      squarePaymentId: response.payment?.id,
    };
  } catch (err) {
    console.error("Square payment failed", err);
    if (err instanceof SquareError && err.errors.length > 0) {
      const first = err.errors[0];
      return {
        paymentMode: "square",
        paymentStatus: "failed",
        errorMessage: friendlyDeclineMessage(first.code, first.detail),
      };
    }
    return {
      paymentMode: "square",
      paymentStatus: "failed",
      errorMessage: GENERIC_DECLINE_MESSAGE,
    };
  }
}
