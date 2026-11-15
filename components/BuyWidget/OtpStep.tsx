"use client";

type Props = {
  otp: string;
  onOtp: (v: string) => void;
  onSubmit: () => void;
};

export function OtpStep(props: Props) {
  return (
    <div className="space-y-5">
      <h2 className="font-heading text-xl font-bold">Enter OTP</h2>
      <p className="text-sm text-[var(--mp-text-muted)]">
        Enter the one-time code sent to your phone.
      </p>
      <div>
        <label htmlFor="otp" className="label">
          OTP
        </label>
        <input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="field font-numbers text-2xl tracking-widest text-center"
          maxLength={8}
          value={props.otp}
          onChange={(e) => props.onOtp(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={props.otp.length < 4}
        onClick={props.onSubmit}
      >
        Verify
      </button>
    </div>
  );
}
