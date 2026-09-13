// `qrcode` ships no types and has no @types package worth a dependency for one call: the 2FA
// enrolment dialog renders one data URL and nothing else on the site uses the library. Declared
// here rather than left implicitly any, so a wrong argument is still an error.
//
// The same shim exists in the emulator's dashboard (Vortex.Dashboard.Web/src/vite-env.d.ts), which
// draws its operator QR the same way.
declare module 'qrcode'
{
    export function toDataURL(
        text: string,
        options?: {margin?: number; width?: number},
    ): Promise<string>;

    const QRCode: {toDataURL: typeof toDataURL};

    export default QRCode;
}
