export interface QuietHoursProps {
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string; // e.g. "America/Sao_Paulo", "UTC"
}

export class QuietHours {
  readonly enabled: boolean;
  readonly startTime: string;
  readonly endTime: string;
  readonly timezone: string;

  constructor(props: QuietHoursProps) {
    if (props.enabled) {
      this.validateTime(props.startTime, 'startTime');
      this.validateTime(props.endTime, 'endTime');
      this.validateTimezone(props.timezone);
    }
    this.enabled = props.enabled;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.timezone = props.timezone;
  }

  private validateTime(time: string, field: string): void {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid ${field} format, expected HH:mm: ${time}`);
    }
  }

  private validateTimezone(tz: string): void {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      throw new Error(`Invalid timezone: ${tz}`);
    }
  }
}
