import { SquareClient, SquareEnvironment } from "square";

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
      return {
        paymentMode: "square",
        paymentStatus: "failed",
        errorMessage: response.errors.map((e) => e.detail).join("; "),
      };
    }

    return {
      paymentMode: "square",
      paymentStatus: "paid",
      squarePaymentId: response.payment?.id,
    };
  } catch (err) {
    console.error("Square payment failed", err);
    return {
      paymentMode: "square",
      paymentStatus: "failed",
      errorMessage: err instanceof Error ? err.message : "Payment failed",
    };
  }
}
