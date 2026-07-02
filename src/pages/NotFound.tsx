import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Invalid route accessed:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Top Header */}
      <header className="w-full px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">
          Peer Learning
        </h1>
      </header>

      {/* Center Content */}
      <main className="flex flex-1 items-center justify-center px-6 text-center">
        <div className="max-w-md">

          <h1 className="text-9xl font-extrabold text-primary/80 mb-4">
            404
          </h1>

          <h2 className="text-3xl font-semibold mb-3 text-foreground">
            Page not found
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            The page you’re looking for doesn’t exist or may have been moved.
            Check the URL or return to the homepage.
          </p>

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-white font-medium shadow-md hover:shadow-lg hover:bg-primary/90 transition-all"
          >
            Go back home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;