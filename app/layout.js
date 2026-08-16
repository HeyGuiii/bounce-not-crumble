import "./globals.css";

export const metadata = {
  title: "Bounce not Crumble",
  description: "Every day the workout comes to you.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Bounce",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#15181C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
