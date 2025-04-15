import "./globals.css";
import Providers from "./providers";
export const metadata = {
  title: "Meeting Scheduler",
  description: "Schedule and create instant meetings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
              <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
