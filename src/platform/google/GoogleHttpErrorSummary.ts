interface GoogleErrorObject {
  code?: number;
  message?: string;
  status?: string;
}

interface GoogleErrorPayload {
  error?: string | GoogleErrorObject;
  error_description?: string;
  message?: string;
}

export class GoogleHttpErrorSummary {
  public static async message(baseMessage: string, response: Response): Promise<string> {
    const details = await GoogleHttpErrorSummary.details(response);

    if (!details) {
      return baseMessage;
    }

    return `${baseMessage} (${details})`;
  }

  private static async details(response: Response): Promise<string> {
    const errorReason = GoogleHttpErrorSummary.reasonFromBody(await GoogleHttpErrorSummary.safeBodyText(response));

    if (!errorReason) {
      return `HTTP ${response.status}`;
    }

    return `HTTP ${response.status}: ${errorReason}`;
  }

  private static async safeBodyText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }

  private static reasonFromBody(bodyText: string): string | null {
    if (!bodyText) {
      return null;
    }

    try {
      return GoogleHttpErrorSummary.reasonFromPayload(JSON.parse(bodyText) as unknown);
    } catch {
      return GoogleHttpErrorSummary.shortPlainText(bodyText);
    }
  }

  private static reasonFromPayload(payload: unknown): string | null {
    if (!GoogleHttpErrorSummary.isPayload(payload)) {
      return null;
    }

    if (typeof payload.error === "string") {
      return GoogleHttpErrorSummary.joinReason(payload.error, payload.error_description);
    }

    if (GoogleHttpErrorSummary.isErrorObject(payload.error)) {
      return GoogleHttpErrorSummary.joinReason(payload.error.status ?? String(payload.error.code ?? ""), payload.error.message);
    }

    return payload.message ?? null;
  }

  private static isPayload(value: unknown): value is GoogleErrorPayload {
    return typeof value === "object" && value !== null;
  }

  private static isErrorObject(value: unknown): value is GoogleErrorObject {
    return typeof value === "object" && value !== null;
  }

  private static joinReason(label: string, detail: string | undefined): string {
    if (!detail || detail === label) {
      return label;
    }

    if (!label) {
      return detail;
    }

    return `${label} - ${detail}`;
  }

  private static shortPlainText(bodyText: string): string {
    return bodyText.replace(/\s+/g, " ").trim().slice(0, 160);
  }
}
