'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ClerkProvider
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#14b8a6", // Turquoise Warren AI
            colorBackground: "rgba(10, 10, 10, 0.95)", // Fond noir Warren AI
            colorInputBackground: "rgba(255, 255, 255, 0.1)", // Fond des inputs glassmorphique
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "rgba(161, 161, 170, 1)", // Gray-400
            colorSuccess: "#10b981", // Vert Warren AI
            colorDanger: "#ef4444", // Rouge
            colorWarning: "#14b8a6",
            borderRadius: "12px",
            fontFamily: "Inter, system-ui, sans-serif"
          },
          elements: {
            rootBox: {
              backdropFilter: "blur(20px)",
              backgroundColor: "rgba(10, 10, 10, 0.9)"
            },
            card: {
              backdropFilter: "blur(20px)", 
              backgroundColor: "rgba(26, 26, 26, 0.95)", // #1a1a1a avec transparence
              border: "1px solid rgba(38, 38, 38, 0.8)", // #262626
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
            },
            headerTitle: {
              background: "linear-gradient(to right, #14b8a6, #10b981)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontWeight: "800", // Font-black comme dans la homepage
              fontSize: "24px"
            },
            headerSubtitle: {
              color: "rgba(161, 161, 170, 1)" // Gray-400
            },
            formButtonPrimary: {
              background: "#14b8a6", // Turquoise Warren AI
              color: "#0a0a0a", // Noir Warren AI
              fontWeight: "700",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              padding: "12px 24px",
              "&:hover": {
                backgroundColor: "#10b981", // Vert Warren AI au hover
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)"
              }
            },
            formFieldInput: {
              backgroundColor: "rgba(38, 38, 38, 0.8)", // #262626
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(64, 64, 64, 0.8)", // #404040
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "16px",
              padding: "12px 16px",
              "&:focus": {
                borderColor: "#14b8a6",
                boxShadow: "0 0 0 2px rgba(20, 184, 166, 0.3)"
              },
              "&:hover": {
                backgroundColor: "rgba(38, 38, 38, 0.9)",
                borderColor: "#14b8a6"
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
              color: "#14b8a6",
              "&:hover": {
                backgroundColor: "rgba(20, 184, 166, 0.1)"
              }
            },
            socialButtonsBlockButton: {
              backgroundColor: "rgba(38, 38, 38, 0.8)", // #262626
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(64, 64, 64, 0.8)", // #404040
              borderRadius: "12px",
              color: "#ffffff",
              fontSize: "16px",
              padding: "12px 16px",
              "&:hover": {
                backgroundColor: "rgba(38, 38, 38, 0.9)",
                borderColor: "#14b8a6"
              }
            },
            dividerLine: {
              backgroundColor: "rgba(64, 64, 64, 0.8)" // #404040
            },
            dividerText: {
              color: "rgba(161, 161, 170, 1)" // Gray-400
            },
            footerActionText: {
              color: "rgba(161, 161, 170, 1)" // Gray-400
            },
            footerActionLink: {
              color: "#14b8a6",
              fontWeight: "600",
              "&:hover": {
                color: "#10b981"
              }
            },
            modalBackdrop: {
              backdropFilter: "blur(12px)",
              backgroundColor: "rgba(10, 10, 10, 0.9)" // Fond noir Warren AI plus opaque
            }
          }
        }}
      >
        {children}
      </ClerkProvider>
    </ThemeProvider>
  );
}