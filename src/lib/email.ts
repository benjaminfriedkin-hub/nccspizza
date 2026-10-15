import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { gradeLabel, type ItemKey } from "./constants";
import type { LabelMap } from "./pricing";

const hasRealSmtp = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

export function isUsingMockTransport(): boolean {
  return !hasRealSmtp;
}

function createTransport() {
  if (hasRealSmtp) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

const transport = createTransport();
const FROM = process.env.SMTP_FROM || "NCCS Pizza Fridays <no-reply@example.com>";

interface OrderConfirmationEmailInput {
  orderId: string;
  parentName: string;
  parentEmail: string;
  fridayDateLabel: string;
  totalAmountCents: number;
  // Set for a "pay for the rest of the year" purchase: the order below repeats every listed Friday.
  prepaid?: { weeklyTotalCents: number; fridayLabels: string[] };
  labels: LabelMap;
  students: {
    firstName: string;
    lastName: string;
    grade: string;
    quantities: Partial<Record<ItemKey, number>>;
    sharedLines?: string[];
  }[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildEmailBody(input: OrderConfirmationEmailInput): { subject: string; text: string } {
  const lines: string[] = [];
  lines.push(`Thanks for your order, ${input.parentName}!`);
  if (input.prepaid) {
    lines.push(`You prepaid for the rest of the school year: ${input.prepaid.fridayLabels.length} pizza Fridays.`);
    lines.push(`The order below is repeated every week (${formatCents(input.prepaid.weeklyTotalCents)} per week):`);
  } else {
    lines.push(`Pizza Friday: ${input.fridayDateLabel}`);
  }
  lines.push("");
  for (const student of input.students) {
    lines.push(`${student.firstName} ${student.lastName} (${gradeLabel(student.grade)}):`);
    for (const [key, qty] of Object.entries(student.quantities)) {
      if (qty && qty > 0) {
        lines.push(`  - ${qty} x ${input.labels[key as ItemKey]}`);
      }
    }
    for (const line of student.sharedLines ?? []) lines.push(`  - ${line}`);
  }
  if (input.prepaid) {
    lines.push("");
    lines.push("Pizza Fridays covered:");
    for (const label of input.prepaid.fridayLabels) lines.push(`  - ${label}`);
    lines.push("");
    lines.push("Prepaid orders are final and are not refunded or credited if a Friday is canceled.");
  }
  lines.push("");
  lines.push(`Total charged: ${formatCents(input.totalAmountCents)}`);
  lines.push("");
  lines.push(`Order confirmation #${input.orderId}`);

  return {
    subject: input.prepaid
      ? `Pizza Fridays prepaid for the rest of the year — ${input.prepaid.fridayLabels.length} weeks`
      : `Pizza Friday order confirmed — ${input.fridayDateLabel}`,
    text: lines.join("\n"),
  };
}

export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<void> {
  const { subject, text } = buildEmailBody(input);

  try {
    await transport.sendMail({
      from: FROM,
      to: input.parentEmail,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send order confirmation email", err);
  }

  if (isUsingMockTransport()) {
    console.log(`[mock email] to=${input.parentEmail} subject="${subject}"`);
    await prisma.mockEmail.create({
      data: { to: input.parentEmail, subject, text },
    });
  }
}
