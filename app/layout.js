import "./globals.css";
import { Prompt } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata = {
  title: "Secure Payment Portal | StockVision",
  description:
    "StockVision Secure Manual Payment Verification & Transfer Portal with PromptPay QR Code Generation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={prompt.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
