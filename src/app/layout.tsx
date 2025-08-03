import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradingAI - Trading automatisé par IA",
  description: "Créez et gérez vos bots de trading automatisés avec l'intelligence artificielle. Analysez les marchés, optimisez vos stratégies et maximisez vos profits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#d4af37", // Or - primary
              colorBackground: "rgba(0, 0, 0, 0.9)", // Fond sombre avec transparence
              colorInputBackground: "rgba(255, 255, 255, 0.1)", // Fond des inputs glassmorphique
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "rgba(255, 255, 255, 0.7)",
              colorSuccess: "#d4af37",
              colorDanger: "#dc2626", // Rouge - secondary
              colorWarning: "#d4af37",
              borderRadius: "12px",
              fontFamily: "var(--font-geist-sans)"
            },
            elements: {
              rootBox: {
                backdropFilter: "blur(20px)",
                backgroundColor: "rgba(0, 0, 0, 0.8)"
              },
              card: {
                backdropFilter: "blur(20px)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "24px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              },
              headerTitle: {
                background: "linear-gradient(to right, #d4af37, #dc2626)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
                fontWeight: "bold"
              },
              headerSubtitle: {
                color: "rgba(255, 255, 255, 0.7)"
              },
              formButtonPrimary: {
                background: "linear-gradient(to right, #d4af37, #dc2626)",
                color: "#000000",
                fontWeight: "600",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                "&:hover": {
                  opacity: "0.9",
                  transform: "translateY(-1px)"
                }
              },
              formFieldInput: {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: "#ffffff",
                "&:focus": {
                  borderColor: "#d4af37",
                  boxShadow: "0 0 0 2px rgba(212, 175, 55, 0.3)"
                },
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderColor: "rgba(255, 255, 255, 0.3)"
                }
              },
              formFieldLabel: {
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500"
              },
              identityPreviewText: {
                color: "rgba(255, 255, 255, 0.8)"
              },
              identityPreviewEditButton: {
                color: "#d4af37",
                "&:hover": {
                  backgroundColor: "rgba(212, 175, 55, 0.1)"
                }
              },
              socialButtonsBlockButton: {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderColor: "rgba(255, 255, 255, 0.3)"
                }
              },
              dividerLine: {
                backgroundColor: "rgba(255, 255, 255, 0.2)"
              },
              dividerText: {
                color: "rgba(255, 255, 255, 0.7)"
              },
              footerActionText: {
                color: "rgba(255, 255, 255, 0.7)"
              },
              footerActionLink: {
                color: "#d4af37",
                "&:hover": {
                  color: "#ffd700"
                }
              },
              modalBackdrop: {
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(0, 0, 0, 0.6)"
              }
            }
          }}
        >
          {children}
        </ClerkProvider>

      </body>
    </html>
  );
}
